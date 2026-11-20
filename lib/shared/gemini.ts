// Model chain for every Gemini text call. `gemini-flash-latest` regularly
// answers 503 "high demand" (or just stalls) on the free tier, which took
// all three AI demos down at once; falling back to a lite model with its
// own capacity pool keeps the demo answering. Both ids are env-overridable.
export const GEMINI_MODELS = [
  process.env.GEMINI_MODEL ?? "gemini-flash-latest",
  process.env.GEMINI_FALLBACK_MODEL ?? "gemini-2.5-flash-lite",
];

/**
 * Per-attempt cap, so a stalled primary still leaves the fallback time inside a route's budget.
 * Enforce it with a client-side AbortSignal, not httpOptions.timeout — the SDK forwards that as
 * a server deadline, and Gemini rejects anything under 10s with a 400.
 */
export const GEMINI_ATTEMPT_TIMEOUT_MS = 8_000;

const BUSY_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

/** Overloaded, out of quota, or timed out — worth trying another model. */
export function isProviderBusy(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === "AbortError" || error.name === "TimeoutError") return true;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" && BUSY_STATUSES.has(status);
}

export async function generateWithFallback<T>(
  models: readonly string[],
  call: (model: string) => Promise<T>
): Promise<T> {
  let lastError: unknown;
  for (const model of models) {
    try {
      return await call(model);
    } catch (error) {
      if (!isProviderBusy(error)) throw error;
      console.warn(`[gemini] ${model} busy, trying next model:`, (error as Error).message);
      lastError = error;
    }
  }
  throw lastError;
}
