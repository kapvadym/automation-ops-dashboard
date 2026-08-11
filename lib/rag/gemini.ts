import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY must be set");
}

const ai = new GoogleGenAI({ apiKey });

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;
const GENERATION_MODEL = "gemini-flash-latest";

// @google/genai doesn't expose outputDimensionality on its embedContent
// helper either, so this still goes straight to the REST endpoint — same
// approach the original rag-docs-support-agent project verified live.
export async function embedText(text: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text }] },
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini embedContent failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return data.embedding.values as number[];
}

export interface ContextChunk {
  source: string;
  content: string;
}

export async function generateAnswer(
  question: string,
  contextChunks: ContextChunk[]
): Promise<string> {
  const context = contextChunks
    .map((chunk, i) => `[${i + 1}] (${chunk.source})\n${chunk.content}`)
    .join("\n\n");

  const prompt = `You are a support agent for the Acme Tasks API. Answer the user's question as helpfully as you can.

Base your answer primarily on the documentation excerpts below, and cite the excerpt(s) you used with [n] markers matching their numbers. If the excerpts only partly cover the question, answer what they support (with citations) and use reasonable general knowledge or inference to fill in the rest — just don't present a guess as if it were documented fact. Only say you don't know if the question has nothing to do with the Acme Tasks API at all.

Documentation excerpts:
${context}

Question: ${question}

Answer:`;

  const result = await ai.models.generateContent({
    model: GENERATION_MODEL,
    contents: prompt,
  });

  return result.text ?? "";
}
