import { supabase } from "@/lib/supabase/client";
import { embedText } from "./gemini";

export interface RetrievedChunk {
  source: string;
  content: string;
  similarity: number;
}

export async function retrieveRelevantChunks(
  question: string,
  matchCount = 4
): Promise<RetrievedChunk[]> {
  const embedding = await embedText(question);

  const { data, error } = await supabase.rpc("match_rag_documents", {
    query_embedding: embedding,
    match_count: matchCount,
  });

  if (error) {
    throw new Error(`Retrieval failed: ${error.message}`);
  }

  return data ?? [];
}
