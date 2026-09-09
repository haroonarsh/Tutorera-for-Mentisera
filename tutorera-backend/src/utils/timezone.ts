/** Convert a local ISO date and HH:mm value in an IANA timezone to its UTC instant.
 * The original timezone is always stored alongside the instant for unambiguous rendering.
 */
export function isValidIanaTimezone(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  try { new Intl.DateTimeFormat("en-US", { timeZone: value }).format(); return true; }
  catch { return false; }
}

export function zonedDateTimeToUtc(date: string, time: string, timezone: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time) || !isValidIanaTimezone(timezone)) {
    throw new Error("A valid local date, time, and IANA timezone are required.");
  }
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  const offsetAt = (instant: number) => {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(instant));
    const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
    return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute")) - instant;
  };
  // Re-evaluate after applying the offset so DST boundaries resolve against the local instant.
  let instant = localAsUtc - offsetAt(localAsUtc);
  instant = localAsUtc - offsetAt(instant);
  return new Date(instant);
}
