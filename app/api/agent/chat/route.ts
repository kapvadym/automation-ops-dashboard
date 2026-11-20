import { NextRequest, NextResponse } from "next/server";
import { runAgentTurn } from "@/lib/agent/gemini";
import { loadHistory, saveMessage, touchSession } from "@/lib/agent/session";
import { validateChatRequest } from "@/lib/agent/validate";
import { agentChatRateLimiter } from "@/lib/shared/rateLimit";
import { withTimeout } from "@/lib/shared/withTimeout";
import { isProviderBusy } from "@/lib/shared/gemini";

const CHAT_TIMEOUT_MS = 25_000;

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const identifier = request.headers.get("x-forwarded-for") ?? "anonymous";

  if (agentChatRateLimiter.isLimited(identifier)) {
    return NextResponse.json({ error: "Too many requests, please slow down." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const validation = validateChatRequest(body);

  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const sessionId = validation.sessionId!;
  const message = validation.message!;

  try {
    const resultPromise = (async () => {
      await touchSession(sessionId);
      const history = await loadHistory(sessionId);

      await saveMessage(sessionId, { role: "user", content: message, tool_calls: null });

      const result = await runAgentTurn(history, message);

      await saveMessage(sessionId, {
        role: "assistant",
        content: result.reply,
        tool_calls: result.toolCalls.length > 0 ? result.toolCalls : null,
      });

      return result;
    })();

    const result = await withTimeout(resultPromise, CHAT_TIMEOUT_MS, "timeout");

    return NextResponse.json({ reply: result.reply, toolCalls: result.toolCalls });
  } catch (error) {
    if (error instanceof Error && error.message === "timeout") {
      console.error("[agent] request timed out");
      return NextResponse.json(
        {
          error:
            "This is taking longer than expected — the agent didn't respond in time. Please try again.",
        },
        { status: 504 }
      );
    }

    console.error(error);

    if (isProviderBusy(error)) {
      return NextResponse.json(
        { error: "The free-tier AI model is busy right now. Please try again in a minute." },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: "Failed to generate a reply" }, { status: 500 });
  }
}
