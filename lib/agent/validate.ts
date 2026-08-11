const MAX_MESSAGE_LENGTH = 1000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ChatRequestValidation {
  valid: boolean;
  error?: string;
  sessionId?: string;
  message?: string;
}

export function validateChatRequest(body: unknown): ChatRequestValidation {
  if (typeof body !== "object" || body === null) {
    return { valid: false, error: "Request body must be a JSON object" };
  }

  const { sessionId, message } = body as Record<string, unknown>;

  if (typeof sessionId !== "string" || !UUID_PATTERN.test(sessionId)) {
    return { valid: false, error: "`sessionId` must be a valid UUID" };
  }

  if (typeof message !== "string" || message.trim().length === 0) {
    return { valid: false, error: "`message` is required" };
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, error: `\`message\` must be under ${MAX_MESSAGE_LENGTH} characters` };
  }

  return { valid: true, sessionId, message: message.trim() };
}
