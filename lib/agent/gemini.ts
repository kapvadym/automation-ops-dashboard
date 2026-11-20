import {
  GoogleGenAI,
  createPartFromFunctionResponse,
  createUserContent,
  type Content,
} from "@google/genai";
import { tools, findTool } from "./tools";
import { GEMINI_ATTEMPT_TIMEOUT_MS, GEMINI_MODELS, generateWithFallback } from "@/lib/shared/gemini";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY must be set");
}

export const ai = new GoogleGenAI({ apiKey });

const MAX_TOOL_ITERATIONS = 5;

const functionDeclarations = tools.map((tool) => tool.declaration);

export interface ToolCallTrace {
  name: string;
  args: unknown;
  result?: unknown;
  error?: string;
}

export interface AgentTurnResult {
  reply: string;
  toolCalls: ToolCallTrace[];
}

export async function runAgentTurn(history: Content[], userMessage: string): Promise<AgentTurnResult> {
  const contents: Content[] = [...history, createUserContent(userMessage)];
  const toolCallTrace: ToolCallTrace[] = [];

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const response = await generateWithFallback(GEMINI_MODELS, (model) =>
      ai.models.generateContent({
        model,
        contents,
        config: {
          tools: [{ functionDeclarations }],
          abortSignal: AbortSignal.timeout(GEMINI_ATTEMPT_TIMEOUT_MS),
        },
      })
    );

    const functionCalls = response.functionCalls;

    if (!functionCalls || functionCalls.length === 0) {
      return { reply: response.text ?? "", toolCalls: toolCallTrace };
    }

    const modelContent = response.candidates?.[0]?.content;
    if (modelContent) {
      contents.push(modelContent);
    }

    const responseParts = [];

    for (const call of functionCalls) {
      const name = call.name ?? "";
      const tool = findTool(name);
      let output: Record<string, unknown> | undefined;
      let error: string | undefined;

      if (!tool) {
        error = `Unknown tool: ${name}`;
      } else {
        const parsed = tool.argsSchema.safeParse(call.args ?? {});
        if (!parsed.success) {
          error = `Invalid arguments for ${name}: ${parsed.error.message}`;
        } else {
          try {
            output = (await tool.handler(parsed.data)) as Record<string, unknown>;
          } catch (err) {
            error = err instanceof Error ? err.message : String(err);
          }
        }
      }

      toolCallTrace.push({ name, args: call.args, result: output, error });
      responseParts.push(
        createPartFromFunctionResponse(call.id ?? name, name, error ? { error } : output ?? {})
      );
    }

    contents.push(createUserContent(responseParts));
  }

  throw new Error("Agent exceeded maximum tool-call iterations");
}
