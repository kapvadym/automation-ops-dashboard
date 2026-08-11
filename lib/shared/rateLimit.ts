export class SlidingWindowRateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private windowMs: number,
    private maxRequests: number
  ) {}

  isLimited(identifier: string, now: number = Date.now()): boolean {
    const timestamps = (this.hits.get(identifier) ?? []).filter(
      (t) => now - t < this.windowMs
    );

    if (timestamps.length >= this.maxRequests) {
      this.hits.set(identifier, timestamps);
      return true;
    }

    timestamps.push(now);
    this.hits.set(identifier, timestamps);
    return false;
  }
}

// Best-effort per-instance limiter — Vercel serverless functions aren't
// guaranteed to share memory across invocations, so this caps abuse within a
// warm instance rather than globally.
export const ragAskRateLimiter = new SlidingWindowRateLimiter(60_000, 10);
export const agentChatRateLimiter = new SlidingWindowRateLimiter(60_000, 10);
export const workflowSimulateRateLimiter = new SlidingWindowRateLimiter(60_000, 10);
export const keysRateLimiter = new SlidingWindowRateLimiter(60_000, 20);
