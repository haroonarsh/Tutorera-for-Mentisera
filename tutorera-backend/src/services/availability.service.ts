import BookedSlot, { IBookedSlot } from "../models/BookedSlot.model";
import { IWeeklySlot } from "../models/TutorAvailability.model";
import { isValidIanaTimezone, zonedDateTimeToUtc } from "../utils/timezone";

export interface CalendarSnapshot {
  weeklySlots: IWeeklySlot[];
  blockedDates: (Date | string)[];
}

type SlotInterval = Pick<IBookedSlot, "startAt" | "endAt" | "date" | "startTime" | "endTime">;

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function normalizeTutorTimezone(tz?: string): string {
  return isValidIanaTimezone(tz) ? tz : "Asia/Karachi";
}

export function tutorLocalDate(instant: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(instant);
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function isBlockedCalendarDay(calendar: CalendarSnapshot, date: string): boolean {
  return calendar.blockedDates.some((d) => {
    const normalized = d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10);
    return normalized === date;
  });
}

export function calendarCoversInterval(calendar: CalendarSnapshot, timezone: string, startAt: Date, endAt: Date): boolean {
  if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime()) || endAt <= startAt) return false;
  const localDate = tutorLocalDate(startAt, timezone);
  if (isBlockedCalendarDay(calendar, localDate)) return false;
  const dayName = DAYS[new Date(`${localDate}T00:00:00.000Z`).getUTCDay()];
  return calendar.weeklySlots.some((slot) => {
    if (slot.day !== dayName || slot.startTime >= slot.endTime) return false;
    try {
      const openAt = zonedDateTimeToUtc(localDate, slot.startTime, timezone);
      const closeAt = zonedDateTimeToUtc(localDate, slot.endTime, timezone);
      return openAt <= startAt && closeAt >= endAt;
    } catch { return false; }
  });
}

export function isBookedIntervalConflict(
  booked: SlotInterval, timezone: string, startAt: Date, endAt: Date
): boolean {
  if (booked.startAt && booked.endAt) {
    return booked.startAt < endAt && booked.endAt > startAt;
  }
  // Historical rows were stored in local HH:mm without UTC instants.
  // This fallback is conservative for the tutor's displayed local timezone;
  // a separate migration is needed for different historical timezones.
  const localDate = tutorLocalDate(startAt, timezone);
  const legacyDay = booked.date instanceof Date ? booked.date.toISOString().slice(0, 10) : "";
  if (legacyDay !== localDate) return false;
  const localClock = (instant: Date) => {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(instant);
    const get = (key: string) => parts.find((part) => part.type === key)?.value || "00";
    return `${get("hour")}:${get("minute")}`;
  };
  return booked.startTime < localClock(endAt) && booked.endTime > localClock(startAt);
}

export interface PublicOpenSlot {
  date: string;
  dayName: string;
  startTime: string;
  endTime: string;
}

/** List complete, unoccupied weekly windows over a tutor-local 14-day horizon. */
export async function listTutorOpenSlots(
  tutorId: string, calendar: CalendarSnapshot, timezone: string, days = 14, now = new Date()
): Promise<PublicOpenSlot[]> {
  const localToday = tutorLocalDate(now, timezone);
  const localStart = new Date(`${localToday}T00:00:00.000Z`);
  const horizonStart = new Date(localStart.getTime() - 2 * 86400_000);
  const horizonEnd = new Date(localStart.getTime() + (days + 2) * 86400_000);
  const booked = await BookedSlot.find({
    tutor: tutorId,
    $or: [
      { startAt: { $lt: horizonEnd }, endAt: { $gt: horizonStart } },
      { startAt: { $exists: false }, date: { $gte: horizonStart, $lt: horizonEnd } },
    ],
  }).lean();

  const slots: PublicOpenSlot[] = [];
  for (let index = 0; index < days; index++) {
    const date = new Date(localStart.getTime() + index * 86400_000).toISOString().slice(0, 10);
    if (isBlockedCalendarDay(calendar, date)) continue;
    const dayName = DAYS[new Date(`${date}T00:00:00.000Z`).getUTCDay()];
    for (const weekly of calendar.weeklySlots.filter((slot) => slot.day === dayName)) {
      try {
        const startAt = zonedDateTimeToUtc(date, weekly.startTime, timezone);
        const endAt = zonedDateTimeToUtc(date, weekly.endTime, timezone);
        if (startAt < now || endAt <= startAt) continue;
        if (booked.some((reservation) => isBookedIntervalConflict(reservation, timezone, startAt, endAt))) continue;
        slots.push({ date, dayName, startTime: weekly.startTime, endTime: weekly.endTime });
      } catch { /* An invalid/legacy slot should not be advertised as available. */ }
    }
  }
  return slots;
}
