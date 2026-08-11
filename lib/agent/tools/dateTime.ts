export class DateTimeError extends Error {}

export function getCurrentDateTime(timezone?: string): string {
  const now = new Date();

  if (!timezone) {
    return now.toISOString();
  }

  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      dateStyle: "full",
      timeStyle: "long",
    }).format(now);
  } catch {
    throw new DateTimeError(`Unknown IANA timezone: "${timezone}"`);
  }
}
