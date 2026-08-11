import { describe, expect, it } from "vitest";
import { validateChatRequest } from "../../lib/agent/validate";

const VALID_SESSION_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

describe("validateChatRequest", () => {
  it("accepts a valid request", () => {
    const result = validateChatRequest({ sessionId: VALID_SESSION_ID, message: "hello" });
    expect(result.valid).toBe(true);
    expect(result.sessionId).toBe(VALID_SESSION_ID);
    expect(result.message).toBe("hello");
  });

  it("trims the message", () => {
    const result = validateChatRequest({ sessionId: VALID_SESSION_ID, message: "  hello  " });
    expect(result.message).toBe("hello");
  });

  it("rejects a non-object body", () => {
    expect(validateChatRequest(null).valid).toBe(false);
    expect(validateChatRequest("hi").valid).toBe(false);
  });

  it("rejects a missing or malformed sessionId", () => {
    expect(validateChatRequest({ sessionId: "not-a-uuid", message: "hi" }).valid).toBe(false);
    expect(validateChatRequest({ message: "hi" }).valid).toBe(false);
  });

  it("rejects an empty message", () => {
    expect(validateChatRequest({ sessionId: VALID_SESSION_ID, message: "   " }).valid).toBe(false);
    expect(validateChatRequest({ sessionId: VALID_SESSION_ID }).valid).toBe(false);
  });

  it("rejects a message over the length limit", () => {
    expect(
      validateChatRequest({ sessionId: VALID_SESSION_ID, message: "a".repeat(1001) }).valid
    ).toBe(false);
  });
});
