import { supabase } from "@/lib/supabase/client";

export interface ProductQuery {
  category?: string;
  maxPrice?: number;
  inStock?: boolean;
  minRating?: number;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  price_usd: number;
  stock_qty: number;
  rating: number;
}

export type ProductFilter =
  | { type: "category"; value: string }
  | { type: "maxPrice"; value: number }
  | { type: "inStock" }
  | { type: "minRating"; value: number };

export function buildProductFilters(query: ProductQuery): ProductFilter[] {
  const filters: ProductFilter[] = [];

  if (query.category) filters.push({ type: "category", value: query.category });
  if (query.maxPrice !== undefined) filters.push({ type: "maxPrice", value: query.maxPrice });
  if (query.inStock) filters.push({ type: "inStock" });
  if (query.minRating !== undefined) filters.push({ type: "minRating", value: query.minRating });

  return filters;
}

const RESULT_LIMIT = 10;

export async function queryProducts(query: ProductQuery): Promise<Product[]> {
  let builder = supabase.from("agent_products").select("*");

  for (const filter of buildProductFilters(query)) {
    switch (filter.type) {
      case "category":
        builder = builder.ilike("category", filter.value);
        break;
      case "maxPrice":
        builder = builder.lte("price_usd", filter.value);
        break;
      case "inStock":
        builder = builder.gt("stock_qty", 0);
        break;
      case "minRating":
        builder = builder.gte("rating", filter.value);
        break;
    }
  }

  const { data, error } = await builder.order("rating", { ascending: false }).limit(RESULT_LIMIT);

  if (error) {
    throw new Error(`queryProducts failed: ${error.message}`);
  }

  return data ?? [];
}
