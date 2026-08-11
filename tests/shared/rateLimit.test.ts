import { describe, expect, it } from "vitest";
import { SlidingWindowRateLimiter } from "../../lib/shared/rateLimit";

describe("SlidingWindowRateLimiter", () => {
  it("allows requests under the limit", () => {
    const limiter = new SlidingWindowRateLimiter(60_000, 3);

    expect(limiter.isLimited("user-1", 0)).toBe(false);
    expect(limiter.isLimited("user-1", 1)).toBe(false);
    expect(limiter.isLimited("user-1", 2)).toBe(false);
  });

  it("blocks requests once the limit is reached within the window", () => {
    const limiter = new SlidingWindowRateLimiter(60_000, 2);

    expect(limiter.isLimited("user-1", 0)).toBe(false);
    expect(limiter.isLimited("user-1", 1)).toBe(false);
    expect(limiter.isLimited("user-1", 2)).toBe(true);
  });

  it("tracks each identifier independently", () => {
    const limiter = new SlidingWindowRateLimiter(60_000, 1);

    expect(limiter.isLimited("user-1", 0)).toBe(false);
    expect(limiter.isLimited("user-2", 0)).toBe(false);
    expect(limiter.isLimited("user-1", 1)).toBe(true);
    expect(limiter.isLimited("user-2", 1)).toBe(true);
  });

  it("allows requests again once the window has passed", () => {
    const limiter = new SlidingWindowRateLimiter(1_000, 1);

    expect(limiter.isLimited("user-1", 0)).toBe(false);
    expect(limiter.isLimited("user-1", 500)).toBe(true);
    expect(limiter.isLimited("user-1", 1_500)).toBe(false);
  });
});
