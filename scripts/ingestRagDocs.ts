import "dotenv/config";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { chunkText } from "../lib/rag/chunk";
import { embedText } from "../lib/rag/gemini";
import { supabase } from "../lib/supabase/client";
import { withRetry } from "../lib/shared/retry";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const DOCS_DIR = join(process.cwd(), "docs");

async function main() {
  const files = readdirSync(DOCS_DIR).filter((f) => f.endsWith(".md"));
  console.log(`Found ${files.length} doc files in ${DOCS_DIR}`);

  const { error: deleteError } = await supabase
    .from("rag_documents")
    .delete()
    .gte("id", 0);

  if (deleteError) {
    throw new Error(`Failed to clear existing documents: ${deleteError.message}`);
  }

  let totalChunks = 0;

  for (const file of files) {
    const content = readFileSync(join(DOCS_DIR, file), "utf-8");
    const chunks = chunkText(content);

    console.log(`Ingesting ${file}: ${chunks.length} chunks`);

    for (const chunk of chunks) {
      const embedding = await withRetry(() => embedText(chunk), { retries: 3, backoffMs: 2000 });
      await sleep(300);

      const { error } = await supabase.from("rag_documents").insert({
        source: file,
        content: chunk,
        embedding,
      });

      if (error) {
        throw new Error(`Failed to insert chunk from ${file}: ${error.message}`);
      }

      totalChunks += 1;
    }
  }

  console.log(`Ingestion complete: ${totalChunks} chunks across ${files.length} files`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
