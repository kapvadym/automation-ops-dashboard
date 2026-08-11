const MAX_QUESTION_LENGTH = 500;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateQuestion(question: unknown): ValidationResult {
  if (typeof question !== "string" || question.trim().length === 0) {
    return { valid: false, error: "`question` is required" };
  }

  if (question.length > MAX_QUESTION_LENGTH) {
    return {
      valid: false,
      error: `\`question\` must be under ${MAX_QUESTION_LENGTH} characters`,
    };
  }

  return { valid: true };
}
