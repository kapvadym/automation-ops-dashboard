import { describe, expect, it } from "vitest";
import { getCurrentDateTime, DateTimeError } from "../../lib/agent/tools/dateTime";

describe("getCurrentDateTime", () => {
  it("returns an ISO string when no timezone is given", () => {
    const result = getCurrentDateTime();
    expect(() => new Date(result)).not.toThrow();
    expect(new Date(result).toISOString()).toBe(result);
  });

  it("formats the date in the given IANA timezone", () => {
    const result = getCurrentDateTime("Europe/Vienna");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("throws DateTimeError for an unknown timezone", () => {
    expect(() => getCurrentDateTime("Not/ATimezone")).toThrow(DateTimeError);
  });
});
