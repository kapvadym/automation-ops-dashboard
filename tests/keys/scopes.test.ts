import { describe, expect, it } from "vitest";
import { validateScopes } from "../../lib/keys/scopes";

describe("validateScopes", () => {
  it("accepts allow-listed scopes", () => {
    const result = validateScopes(["read", "write"]);
    expect(result.valid).toBe(true);
    expect(result.scopes).toEqual(["read", "write"]);
  });

  it("accepts an empty array", () => {
    const result = validateScopes([]);
    expect(result.valid).toBe(true);
    expect(result.scopes).toEqual([]);
  });

  it("rejects unknown scopes", () => {
    const result = validateScopes(["read", "delete-everything"]);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Unknown scope/);
  });

  it("rejects duplicate scopes", () => {
    const result = validateScopes(["read", "read"]);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/duplicates/);
  });

  it("rejects a non-array input", () => {
    const result = validateScopes("read");
    expect(result.valid).toBe(false);
  });

  it("rejects non-string entries", () => {
    const result = validateScopes(["read", 123]);
    expect(result.valid).toBe(false);
  });
});
