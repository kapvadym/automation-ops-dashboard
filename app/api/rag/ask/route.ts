import { NextRequest, NextResponse } from "next/server";
import { retrieveRelevantChunks } from "@/lib/rag/retrieval";
import { generateAnswer } from "@/lib/rag/gemini";
import { validateQuestion } from "@/lib/rag/validate";
import { ragAskRateLimiter } from "@/lib/shared/rateLimit";
import { withTimeout } from "@/lib/shared/withTimeout";
import { isProviderBusy } from "@/lib/shared/gemini";

const ANSWER_TIMEOUT_MS = 20_000;

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const identifier = request.headers.get("x-forwarded-for") ?? "anonymous";

  if (ragAskRateLimiter.isLimited(identifier)) {
    return NextResponse.json(
      { error: "Too many requests, please slow down." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const question = body?.question;

  const validation = validateQuestion(question);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const answerPromise = (async () => {
      const chunks = await retrieveRelevantChunks((question as string).trim());

      if (chunks.length === 0) {
        return {
          answer: "I don't have documentation covering that yet.",
          sources: [],
        };
      }

      const answer = await generateAnswer((question as string).trim(), chunks);

      return {
        answer,
        sources: chunks.map((c) => ({
          source: c.source,
          similarity: c.similarity,
        })),
      };
    })();

    const result = await withTimeout(answerPromise, ANSWER_TIMEOUT_MS, "timeout");

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "timeout") {
      console.error("[rag] request timed out");
      return NextResponse.json(
        {
          error:
            "This is taking longer than expected — the agent didn't respond in time. Please try again.",
        },
        { status: 504 }
      );
    }

    if (isProviderBusy(error)) {
      console.error(error);
      return NextResponse.json(
        { error: "The free-tier AI model is busy right now. Please try again in a minute." },
        { status: 503 }
      );
    }

    console.error(error);
    return NextResponse.json({ error: "Failed to generate an answer" }, { status: 500 });
  }
}
