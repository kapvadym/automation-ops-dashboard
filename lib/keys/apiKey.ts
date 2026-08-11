import { randomBytes, createHash } from "crypto";

const KEY_PREFIX_TAG = "ak_live_";
const SECRET_BYTES = 32;
const DISPLAY_PREFIX_LENGTH = KEY_PREFIX_TAG.length + 4;

export interface GeneratedApiKey {
  plaintextKey: string;
  keyPrefix: string;
  keyHash: string;
}

export function generateApiKey(): GeneratedApiKey {
  const secret = randomBytes(SECRET_BYTES).toString("base64url");
  const plaintextKey = `${KEY_PREFIX_TAG}${secret}`;

  return {
    plaintextKey,
    keyPrefix: plaintextKey.slice(0, DISPLAY_PREFIX_LENGTH),
    keyHash: hashApiKey(plaintextKey),
  };
}

export function hashApiKey(plaintextKey: string): string {
  return createHash("sha256").update(plaintextKey).digest("hex");
}
