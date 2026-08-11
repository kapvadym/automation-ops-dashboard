import { describe, expect, it } from "vitest";
import { chunkText } from "../../lib/rag/chunk";

describe("chunkText", () => {
  it("returns a single chunk for short text", () => {
    const chunks = chunkText("Hello world.");
    expect(chunks).toEqual(["Hello world."]);
  });

  it("keeps paragraphs together under the size limit", () => {
    const text = "Paragraph one.\n\nParagraph two.";
    const chunks = chunkText(text, 100);
    expect(chunks).toEqual(["Paragraph one.\n\nParagraph two."]);
  });

  it("splits into a new chunk once the size limit is exceeded", () => {
    const a = "a".repeat(50);
    const b = "b".repeat(50);
    const c = "c".repeat(50);
    const text = [a, b, c].join("\n\n");

    const chunks = chunkText(text, 80);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join("")).toContain(a);
    expect(chunks.join("")).toContain(b);
    expect(chunks.join("")).toContain(c);
  });

  it("ignores empty paragraphs and surrounding whitespace", () => {
    const chunks = chunkText("\n\n  First.  \n\n\n\n  Second.  \n\n");
    expect(chunks).toEqual(["First.\n\nSecond."]);
  });

  it("returns an empty array for empty input", () => {
    expect(chunkText("")).toEqual([]);
  });
});
