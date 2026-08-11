import { describe, expect, it } from "vitest";
import { calculate, CalculationError } from "../../lib/agent/tools/calculate";

describe("calculate", () => {
  it("evaluates basic arithmetic", () => {
    expect(calculate("12 * (7 + 3)")).toBe(120);
  });

  it("evaluates expressions with decimals", () => {
    expect(calculate("10 / 4")).toBe(2.5);
  });

  it("rejects an empty expression", () => {
    expect(() => calculate("   ")).toThrow(CalculationError);
  });

  it("rejects an expression that is too long", () => {
    expect(() => calculate("1+".repeat(150))).toThrow(CalculationError);
  });

  it("rejects invalid syntax", () => {
    expect(() => calculate("12 * ")).toThrow(CalculationError);
  });

  it("rejects an expression that doesn't resolve to a finite number", () => {
    expect(() => calculate("1/0")).toThrow(CalculationError);
  });

  it("rejects an expression that resolves to a non-numeric value", () => {
    expect(() => calculate("\"hello\"")).toThrow(CalculationError);
  });
});
