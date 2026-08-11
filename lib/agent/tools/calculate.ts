import { evaluate } from "mathjs";

export class CalculationError extends Error {}

export function calculate(expression: string): number {
  const trimmed = expression.trim();

  if (!trimmed) {
    throw new CalculationError("Expression must not be empty");
  }
  if (trimmed.length > 200) {
    throw new CalculationError("Expression is too long");
  }

  let result: unknown;
  try {
    result = evaluate(trimmed, {});
  } catch (error) {
    throw new CalculationError(`Could not evaluate "${expression}": ${(error as Error).message}`);
  }

  if (typeof result !== "number" || !Number.isFinite(result)) {
    throw new CalculationError(`Expression "${expression}" did not evaluate to a finite number`);
  }

  return result;
}
