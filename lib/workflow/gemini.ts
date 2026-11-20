import { GoogleGenAI } from "@google/genai";
import { GEMINI_ATTEMPT_TIMEOUT_MS, GEMINI_MODELS, generateWithFallback } from "@/lib/shared/gemini";
import {
  classificationResponseSchema,
  parseClassificationResult,
  type ClassificationResult,
} from "./classification";

export async function classifyTicket(subject: string, body: string): Promise<ClassificationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = [
    "You triage incoming customer support tickets for a small SaaS company.",
    "Classify the ticket below and produce a one-sentence summary for a Slack alert.",
    "",
    `Subject: ${subject}`,
    `Body: ${body}`,
  ].join("\n");

  const result = await generateWithFallback(GEMINI_MODELS, (model) =>
    ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: classificationResponseSchema,
        abortSignal: AbortSignal.timeout(GEMINI_ATTEMPT_TIMEOUT_MS),
      },
    })
  );

  const text = result.text ?? "";

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    throw new Error(`Gemini did not return valid JSON: ${(error as Error).message}`);
  }

  return parseClassificationResult(raw);
}
