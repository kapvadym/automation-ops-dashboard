import { describe, it, expect, vi } from "vitest";
import { generateWithFallback, isProviderBusy } from "@/lib/shared/gemini";

const busy = (status: number) => Object.assign(new Error(`status ${status}`), { status });

describe("isProviderBusy", () => {
  it("treats overload, quota and timeouts as busy", () => {
    expect(isProviderBusy(busy(503))).toBe(true);
    expect(isProviderBusy(busy(429))).toBe(true);
    expect(isProviderBusy(busy(500))).toBe(true);
    expect(isProviderBusy(Object.assign(new Error("aborted"), { name: "AbortError" }))).toBe(true);
  });

  it("does not treat client errors as busy", () => {
    expect(isProviderBusy(busy(400))).toBe(false);
    expect(isProviderBusy(new Error("bad json"))).toBe(false);
    expect(isProviderBusy("nope")).toBe(false);
  });
});

describe("generateWithFallback", () => {
  it("uses the primary model when it succeeds", async () => {
    const call = vi.fn().mockResolvedValue("ok");
    await expect(generateWithFallback(["a", "b"], call)).resolves.toBe("ok");
    expect(call).toHaveBeenCalledTimes(1);
    expect(call).toHaveBeenCalledWith("a");
  });

  it("falls back to the next model when the primary is busy", async () => {
    const call = vi.fn().mockRejectedValueOnce(busy(503)).mockResolvedValueOnce("from b");
    await expect(generateWithFallback(["a", "b"], call)).resolves.toBe("from b");
    expect(call.mock.calls.map((c) => c[0])).toEqual(["a", "b"]);
  });

  it("does not fall back on a non-busy error", async () => {
    const call = vi.fn().mockRejectedValue(busy(400));
    await expect(generateWithFallback(["a", "b"], call)).rejects.toMatchObject({ status: 400 });
    expect(call).toHaveBeenCalledTimes(1);
  });

  it("rethrows the last busy error when every model is busy", async () => {
    const call = vi.fn().mockRejectedValueOnce(busy(503)).mockRejectedValueOnce(busy(429));
    await expect(generateWithFallback(["a", "b"], call)).rejects.toMatchObject({ status: 429 });
  });
});
