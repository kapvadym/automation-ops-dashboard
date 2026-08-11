import { describe, expect, it } from "vitest";
import { validateQuestion } from "../../lib/rag/validate";

describe("validateQuestion", () => {
  it("accepts a normal question", () => {
    expect(validateQuestion("How do I authenticate?")).toEqual({ valid: true });
  });

  it("rejects a missing question", () => {
    expect(validateQuestion(undefined).valid).toBe(false);
  });

  it("rejects a non-string question", () => {
    expect(validateQuestion(42).valid).toBe(false);
  });

  it("rejects an empty or whitespace-only question", () => {
    expect(validateQuestion("").valid).toBe(false);
    expect(validateQuestion("   ").valid).toBe(false);
  });

  it("rejects a question over 500 characters", () => {
    const result = validateQuestion("a".repeat(501));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/500/);
  });

  it("accepts a question exactly at the 500 character limit", () => {
    expect(validateQuestion("a".repeat(500)).valid).toBe(true);
  });
});
