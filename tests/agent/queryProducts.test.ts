import { describe, expect, it } from "vitest";
import { buildProductFilters } from "../../lib/agent/tools/queryProducts";

describe("buildProductFilters", () => {
  it("returns no filters for an empty query", () => {
    expect(buildProductFilters({})).toEqual([]);
  });

  it("builds a category filter", () => {
    expect(buildProductFilters({ category: "Kitchen" })).toEqual([{ type: "category", value: "Kitchen" }]);
  });

  it("builds a maxPrice filter", () => {
    expect(buildProductFilters({ maxPrice: 50 })).toEqual([{ type: "maxPrice", value: 50 }]);
  });

  it("builds an inStock filter only when true", () => {
    expect(buildProductFilters({ inStock: true })).toEqual([{ type: "inStock" }]);
    expect(buildProductFilters({ inStock: false })).toEqual([]);
  });

  it("builds a minRating filter", () => {
    expect(buildProductFilters({ minRating: 4.5 })).toEqual([{ type: "minRating", value: 4.5 }]);
  });

  it("combines multiple filters in a stable order", () => {
    expect(
      buildProductFilters({ category: "Sports", maxPrice: 60, inStock: true, minRating: 4 })
    ).toEqual([
      { type: "category", value: "Sports" },
      { type: "maxPrice", value: 60 },
      { type: "inStock" },
      { type: "minRating", value: 4 },
    ]);
  });
});
