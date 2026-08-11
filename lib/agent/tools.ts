import type { FunctionDeclaration } from "@google/genai";
import { z, type ZodTypeAny } from "zod";
import { calculate } from "./tools/calculate";
import { getCurrentDateTime } from "./tools/dateTime";
import { queryProducts } from "./tools/queryProducts";
import { webSearch } from "./tools/webSearch";

export interface ToolDefinition<TArgs = any> {
  declaration: FunctionDeclaration;
  argsSchema: ZodTypeAny;
  handler: (args: TArgs) => Promise<unknown>;
}

const calculateArgsSchema = z.object({ expression: z.string() });
const dateTimeArgsSchema = z.object({ timezone: z.string().optional() });
const queryProductsArgsSchema = z.object({
  category: z.string().optional(),
  maxPrice: z.number().positive().optional(),
  inStock: z.boolean().optional(),
  minRating: z.number().min(0).max(5).optional(),
});
const webSearchArgsSchema = z.object({ query: z.string().min(1) });

export const tools: ToolDefinition[] = [
  {
    declaration: {
      name: "calculate",
      description: "Evaluate an arithmetic expression, e.g. '12 * (7 + 3)'.",
      parametersJsonSchema: {
        type: "object",
        properties: { expression: { type: "string", description: "A math expression to evaluate." } },
        required: ["expression"],
      },
    },
    argsSchema: calculateArgsSchema,
    handler: async (args: z.infer<typeof calculateArgsSchema>) => ({ result: calculate(args.expression) }),
  },
  {
    declaration: {
      name: "getCurrentDateTime",
      description:
        "Get the current date and time, optionally in a specific IANA timezone (e.g. 'Europe/Vienna').",
      parametersJsonSchema: {
        type: "object",
        properties: { timezone: { type: "string", description: "Optional IANA timezone name." } },
      },
    },
    argsSchema: dateTimeArgsSchema,
    handler: async (args: z.infer<typeof dateTimeArgsSchema>) => ({
      datetime: getCurrentDateTime(args.timezone),
    }),
  },
  {
    declaration: {
      name: "queryProducts",
      description:
        "Search the product catalog with structured filters (category, max price, in-stock only, minimum rating). Returns up to 10 matching products sorted by rating.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "Product category, e.g. 'Electronics', 'Home', 'Sports', 'Books', 'Toys', 'Kitchen'.",
          },
          maxPrice: { type: "number", description: "Maximum price in USD." },
          inStock: { type: "boolean", description: "Only return products currently in stock." },
          minRating: { type: "number", description: "Minimum average rating, 0-5." },
        },
      },
    },
    argsSchema: queryProductsArgsSchema,
    handler: async (args: z.infer<typeof queryProductsArgsSchema>) => ({
      products: await queryProducts(args),
    }),
  },
  {
    declaration: {
      name: "webSearch",
      description: "Search the live web for up-to-date information not covered by the other tools.",
      parametersJsonSchema: {
        type: "object",
        properties: { query: { type: "string", description: "The search query." } },
        required: ["query"],
      },
    },
    argsSchema: webSearchArgsSchema,
    handler: async (args: z.infer<typeof webSearchArgsSchema>) => ({ results: await webSearch(args.query) }),
  },
];

export function findTool(name: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.declaration.name === name);
}
