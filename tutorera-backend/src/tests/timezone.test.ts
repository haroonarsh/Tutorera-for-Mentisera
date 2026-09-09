import { isValidIanaTimezone, zonedDateTimeToUtc } from "../utils/timezone";

describe("timezone-safe schedule instants", () => {
  it("stores a Dubai local lesson as its authoritative UTC instant", () => {
    expect(zonedDateTimeToUtc("2026-01-15", "18:30", "Asia/Dubai").toISOString()).toBe("2026-01-15T14:30:00.000Z");
  });

  it("accounts for the London daylight-saving offset", () => {
    expect(zonedDateTimeToUtc("2026-07-15", "18:30", "Europe/London").toISOString()).toBe("2026-07-15T17:30:00.000Z");
  });

  it("rejects non-IANA timezones", () => {
    expect(isValidIanaTimezone("GMT+5")).toBe(false);
    expect(() => zonedDateTimeToUtc("2026-01-15", "18:30", "GMT+5")).toThrow();
  });
});
