// Computes real, concrete calendar dates from a Booking's structured
// recurrence fields (preferredDays, preferredStartTime, sessionDurationMinutes,
// expectedStartDate, scheduleTimezone). This is what lets the dashboard show
// "Wed, 24 Sept, 12:00 PM" instead of the raw recurring pattern string.
//
// Deliberately has NO knowledge of Booking, Session, or any Mongoose model —
// pure date math, easy to unit test, reusable by both the dashboard
// serializer and the Session-generation job.

import { isValidIanaTimezone, zonedDateTimeToUtc } from "./timezone";

const DAY_NAME_TO_INDEX: Record<string, number> = {
    sun: 0, sunday: 0,
    mon: 1, monday: 1,
    tue: 2, tues: 2, tuesday: 2,
    wed: 3, weds: 3, wednesday: 3,
    thu: 4, thur: 4, thurs: 4, thursday: 4,
    fri: 5, friday: 5,
    sat: 6, saturday: 6,
};

export interface RecurringScheduleInput {
    preferredDays?: string[] | null;       // e.g. ["Mon", "Wed", "Fri"] — case-insensitive, various forms accepted
    preferredStartTime?: string | null;    // "HH:mm", 24-hour, e.g. "12:00" or "16:00"
    sessionDurationMinutes?: number | null;
    expectedStartDate?: Date | string | null; // occurrences never computed before this date
    scheduleTimezone?: string | null;      // IANA timezone, e.g. "Asia/Karachi"
}

export interface SessionOccurrence {
  startAt: Date;   // UTC instant
  endAt: Date;     // UTC instant
  dayLabel: string;    // "Wed"
  dateLabel: string;   // "24 Sept 2026"
  timeLabel: string;   // "12:00 PM"
}

function parseDayList(preferredDays?: string[] | null): number[] {
    if (!preferredDays || preferredDays.length === 0) return [];
    const indices = preferredDays
        .map((d) => DAY_NAME_TO_INDEX[d.trim().toLowerCase()])
        .filter((i): i is number => typeof i === "number");
    return Array.from(new Set(indices)).sort((a, b) => a - b);
}

function parseTime(preferredStartTime?: string | null): { hours: number; minutes: number } | null {
    if (!preferredStartTime) return null;
    const match = /^(\d{1,2}):(\d{2})$/.exec(preferredStartTime.trim());
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return { hours, minutes };
}

/**
 * Computes the next `count` real occurrences of a recurring booking, in
 * order, starting from `from` (defaults to now). Returns an empty array if
 * the booking doesn't have enough structured recurrence data to compute
 * from (e.g. an old booking that only has the legacy `schedule` text) —
 * callers should fall back to displaying the raw `schedule` string in that
 * case, not throw.
 */
export function computeUpcomingOccurrences(
    input: RecurringScheduleInput,
    count: number = 1,
    from: Date = new Date()
): SessionOccurrence[] {
    const dayIndices = parseDayList(input.preferredDays);
    const time = parseTime(input.preferredStartTime);
    if (dayIndices.length === 0 || !time) return [];

    const durationMinutes = input.sessionDurationMinutes && input.sessionDurationMinutes > 0 ? input.sessionDurationMinutes : 60;
    const earliestDate = input.expectedStartDate ? new Date(input.expectedStartDate) : null;
    const tz = input.scheduleTimezone && isValidIanaTimezone(input.scheduleTimezone) ? input.scheduleTimezone : null;
    const labelOpts = tz ? { timeZone: tz } : {};

    const occurrences: SessionOccurrence[] = [];
    const cursor = new Date(from);
    cursor.setHours(0, 0, 0, 0);

    // Search forward day-by-day until we have `count` matching occurrences.
    // Capped at 60 days out as a sanity bound (covers any weekly pattern).
    for (let dayOffset = 0; dayOffset < 60 && occurrences.length < count; dayOffset++) {
      const candidate = new Date(cursor);
      candidate.setDate(candidate.getDate() + dayOffset);

      if (!dayIndices.includes(candidate.getDay())) continue;
      if (earliestDate && candidate < new Date(earliestDate.getFullYear(), earliestDate.getMonth(), earliestDate.getDate())) continue;

      // Build the UTC instant for this wall-clock slot.  When a booking
      // timezone is stored, run through zonedDateTimeToUtc so DST transitions
      // are handled correctly (e.g. a 17:00 slot in Europe/London falls on
      // different UTC hours in winter vs. summer).  Without a timezone, fall
      // back to treating the time as server-local (UTC on most deployments).
      let startAt: Date;
      if (tz) {
        const mm = String(candidate.getMonth() + 1).padStart(2, "0");
        const dd = String(candidate.getDate()).padStart(2, "0");
        const dateStr = `${candidate.getFullYear()}-${mm}-${dd}`;
        const timeStr = `${String(time.hours).padStart(2, "0")}:${String(time.minutes).padStart(2, "0")}`;
        try {
          startAt = zonedDateTimeToUtc(dateStr, timeStr, tz);
        } catch {
          // timezone conversion failed for this slot — skip rather than emit wrong time
          continue;
        }
      } else {
        startAt = new Date(candidate);
        startAt.setHours(time.hours, time.minutes, 0, 0);
      }

      // Skip occurrences already in the past today.
      if (startAt < from) continue;

      const endAt = new Date(startAt.getTime() + durationMinutes * 60 * 1000);

      occurrences.push({
        startAt,
        endAt,
        dayLabel: startAt.toLocaleDateString("en-US", { weekday: "short", ...labelOpts }),
        dateLabel: startAt.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", ...labelOpts }),
        timeLabel: startAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, ...labelOpts }),
      });
    }

    return occurrences;
}

/** Convenience — just the single next upcoming occurrence, or null. */
export function computeNextOccurrence(input: RecurringScheduleInput, from: Date = new Date()): SessionOccurrence | null {
    return computeUpcomingOccurrences(input, 1, from)[0] || null;
}