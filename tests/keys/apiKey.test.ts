import { describe, expect, it } from "vitest";
import { generateApiKey, hashApiKey } from "../../lib/keys/apiKey";

describe("generateApiKey", () => {
  it("produces a key with the expected prefix and format", () => {
    const { plaintextKey } = generateApiKey();
    expect(plaintextKey.startsWith("ak_live_")).toBe(true);
    expect(plaintextKey.length).toBeGreaterThan(40);
  });

  it("returns a keyPrefix that is a strict prefix of the plaintext key", () => {
    const { plaintextKey, keyPrefix } = generateApiKey();
    expect(plaintextKey.startsWith(keyPrefix)).toBe(true);
    expect(keyPrefix.length).toBeLessThan(plaintextKey.length);
  });

  it("returns a keyHash matching hashApiKey(plaintextKey)", () => {
    const { plaintextKey, keyHash } = generateApiKey();
    expect(keyHash).toBe(hashApiKey(plaintextKey));
  });

  it("never collides across many generations", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const { plaintextKey } = generateApiKey();
      expect(seen.has(plaintextKey)).toBe(false);
      seen.add(plaintextKey);
    }
  });
});

describe("hashApiKey", () => {
  it("is deterministic", () => {
    expect(hashApiKey("ak_live_abc")).toBe(hashApiKey("ak_live_abc"));
  });

  it("produces a 64-char hex SHA-256 digest", () => {
    const hash = hashApiKey("ak_live_abc");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces different hashes for different inputs", () => {
    expect(hashApiKey("ak_live_a")).not.toBe(hashApiKey("ak_live_b"));
  });
});
