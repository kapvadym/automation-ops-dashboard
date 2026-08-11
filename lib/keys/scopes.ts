export const ALLOWED_SCOPES = ["read", "write", "admin"] as const;
export type Scope = (typeof ALLOWED_SCOPES)[number];

export interface ScopeValidation {
  valid: boolean;
  error?: string;
  scopes?: Scope[];
}

export function validateScopes(input: unknown): ScopeValidation {
  if (!Array.isArray(input)) {
    return { valid: false, error: "`scopes` must be an array" };
  }

  if (!input.every((s): s is string => typeof s === "string")) {
    return { valid: false, error: "`scopes` must be an array of strings" };
  }

  const unknown = input.filter((s) => !ALLOWED_SCOPES.includes(s as Scope));
  if (unknown.length > 0) {
    return {
      valid: false,
      error: `Unknown scope(s): ${unknown.join(", ")}. Allowed: ${ALLOWED_SCOPES.join(", ")}`,
    };
  }

  const deduped = Array.from(new Set(input)) as Scope[];
  if (deduped.length !== input.length) {
    return { valid: false, error: "`scopes` must not contain duplicates" };
  }

  return { valid: true, scopes: deduped };
}
