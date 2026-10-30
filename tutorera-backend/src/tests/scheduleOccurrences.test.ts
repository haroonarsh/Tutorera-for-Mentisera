/**
 * Unit tests for computeUpcomingOccurrences — timezone and DST correctness.
 *
 * Pure date-math, no Mongoose, no mongodb-memory-server.
 */

import { computeUpcomingOccurrences, computeNextOccurrence } from "../utils/scheduleOccurrences";

// Monday 3 Feb 2025 09:00 UTC — a safe stable reference point for tests
const REF = new Date("2025-02-03T09:00:00Z");

describe("computeUpcomingOccurrences", () => {
  it("returns empty array when no days provided", () => {
    expect(computeUpcomingOccurrences({ preferredDays: [], preferredStartTime: "17:00" }, 1, REF)).toEqual([]);
  });

  it("returns empty array when no time provided", () => {
    expect(computeUpcomingOccurrences({ preferredDays: ["Monday"] }, 1, REF)).toEqual([]);
  });

  it("finds the next Monday 17:00 without a timezone (server-local fallback)", () => {
    // REF is Mon 3 Feb 2025 09:00 UTC.  Without a scheduleTimezone the
    // implementation falls back to server-local time, so we can only assert
    // the wall-clock hour/minute — the UTC offset depends on the host TZ.
    const results = computeUpcomingOccurrences({ preferredDays: ["Monday"], preferredStartTime: "17:00" }, 1, REF);
    expect(results).toHaveLength(1);
    expect(results[0].timeLabel).toBe("5:00 PM");
  });

  it("converts 17:00 PKT (UTC+5) to UTC correctly", () => {
    // 17:00 PKT = 12:00 UTC
    const results = computeUpcomingOccurrences(
      { preferredDays: ["Monday"], preferredStartTime: "17:00", scheduleTimezone: "Asia/Karachi" },
      1,
      REF
    );
    expect(results).toHaveLength(1);
    expect(results[0].startAt.toISOString()).toBe("2025-02-03T12:00:00.000Z");
  });

  it("converts 17:00 GMT (winter, UTC+0) to UTC correctly", () => {
    // London is UTC+0 in February (winter — GMT, not BST)
    const results = computeUpcomingOccurrences(
      { preferredDays: ["Monday"], preferredStartTime: "17:00", scheduleTimezone: "Europe/London" },
      1,
      REF
    );
    expect(results).toHaveLength(1);
    expect(results[0].startAt.toISOString()).toBe("2025-02-03T17:00:00.000Z");
  });

  it("converts 17:00 BST (summer, UTC+1) to UTC correctly — DST boundary", () => {
    // Monday 2 Jun 2025 09:00 UTC — UK is on BST (UTC+1) in summer
    const summerRef = new Date("2025-06-02T09:00:00Z");
    const results = computeUpcomingOccurrences(
      { preferredDays: ["Monday"], preferredStartTime: "17:00", scheduleTimezone: "Europe/London" },
      1,
      summerRef
    );
    expect(results).toHaveLength(1);
    // 17:00 BST = 16:00 UTC (one hour less than winter)
    expect(results[0].startAt.toISOString()).toBe("2025-06-02T16:00:00.000Z");
  });

  it("returns labels rendered in the booking timezone, not server-local", () => {
    const results = computeUpcomingOccurrences(
      { preferredDays: ["Monday"], preferredStartTime: "17:00", scheduleTimezone: "Asia/Karachi" },
      1,
      REF
    );
    expect(results[0].timeLabel).toBe("5:00 PM"); // 17:00 in PKT, not 12:00 PM UTC
  });

  it("respects expectedStartDate — skips occurrences before it", () => {
    // REF is Monday 3 Feb — if expected start is 10 Feb, next Monday is 10 Feb
    const results = computeUpcomingOccurrences(
      {
        preferredDays: ["Monday"],
        preferredStartTime: "17:00",
        scheduleTimezone: "Asia/Karachi",
        expectedStartDate: new Date("2025-02-10T00:00:00Z"),
      },
      1,
      REF
    );
    expect(results).toHaveLength(1);
    expect(results[0].startAt.toISOString()).toBe("2025-02-10T12:00:00.000Z");
  });

  it("returns multiple occurrences across weeks", () => {
    const results = computeUpcomingOccurrences(
      { preferredDays: ["Monday", "Wednesday"], preferredStartTime: "17:00", scheduleTimezone: "Asia/Karachi" },
      4,
      REF
    );
    expect(results).toHaveLength(4);
    // Mon 3 Feb, Wed 5 Feb, Mon 10 Feb, Wed 12 Feb (all at 12:00 UTC = 17:00 PKT)
    expect(results[0].startAt.toISOString()).toBe("2025-02-03T12:00:00.000Z");
    expect(results[1].startAt.toISOString()).toBe("2025-02-05T12:00:00.000Z");
    expect(results[2].startAt.toISOString()).toBe("2025-02-10T12:00:00.000Z");
    expect(results[3].startAt.toISOString()).toBe("2025-02-12T12:00:00.000Z");
  });

  it("skips past occurrences within the current day", () => {
    // REF is 09:00 UTC — a 08:00 slot today is already past
    const results = computeUpcomingOccurrences(
      { preferredDays: ["Monday"], preferredStartTime: "08:00", scheduleTimezone: "Asia/Karachi" },
      1,
      REF
    );
    // 08:00 PKT = 03:00 UTC — that's before REF (09:00 UTC), so skip to next Monday
    expect(results).toHaveLength(1);
    expect(results[0].startAt.toISOString()).toBe("2025-02-10T03:00:00.000Z");
  });
});

describe("computeNextOccurrence", () => {
  it("returns null when no structured data available", () => {
    expect(computeNextOccurrence({ preferredDays: [], preferredStartTime: "17:00" })).toBeNull();
  });

  it("returns the next occurrence correctly", () => {
    const result = computeNextOccurrence(
      { preferredDays: ["Monday"], preferredStartTime: "17:00", scheduleTimezone: "Asia/Karachi" },
      REF
    );
    expect(result).not.toBeNull();
    expect(result!.startAt.toISOString()).toBe("2025-02-03T12:00:00.000Z");
  });
});
