// Computes real, concrete calendar dates from a Booking's structured
// recurrence fields (preferredDays, preferredStartTime, sessionDurationMinutes,
// expectedStartDate). This is what lets the dashboard show "Wed, 24 Sept,
// 12:00 PM" instead of the raw recurring pattern string ("Mon: 12pm, Wed:
// 12pm, Fri: 4pm") that gave no way to know which actual date is next.
//
// Deliberately has NO knowledge of Booking, Session, or any Mongoose model —
// pure date math, easy to unit test, reusable by both the dashboard
// serializer and (later) the Session-generation job and Google Calendar
// event creation.

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

  // Timezone handling note: this computes occurrences using the SERVER's
  // interpretation of preferredStartTime as a wall-clock time, then treats
  // the constructed Date as that wall-clock time. For full correctness
  // across timezones (a tutor and student may be in different ones — see
  // scheduleTimezone on the booking), this should be extended to use the
  // same zonedDateTimeToUtc() helper already used in request.controller.ts
  // for scheduledStartAt/scheduledEndAt, rather than the naive Date
  // construction below. Flagged here rather than silently guessed at.
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

    const startAt = new Date(candidate);
    startAt.setHours(time.hours, time.minutes, 0, 0);

    // Skip occurrences already in the past today (e.g. it's 3pm and this
    // slot was 12pm today — that one's gone, find the next one).
    if (startAt < from) continue;

    const endAt = new Date(startAt.getTime() + durationMinutes * 60 * 1000);

    occurrences.push({
        startAt,
        endAt,
        dayLabel: startAt.toLocaleDateString("en-US", { weekday: "short" }),
        dateLabel: startAt.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
        timeLabel: startAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
        });
    }

    return occurrences;
}

/** Convenience — just the single next upcoming occurrence, or null. */
export function computeNextOccurrence(input: RecurringScheduleInput, from: Date = new Date()): SessionOccurrence | null {
    return computeUpcomingOccurrences(input, 1, from)[0] || null;
}