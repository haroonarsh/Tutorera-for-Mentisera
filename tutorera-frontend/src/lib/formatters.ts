// src/lib/formatters.ts
// Global number, currency, and date formatters using Intl API
// Respects locale-specific conventions (decimal separators, date formats, RTL)

/**
 * Format a number according to the given locale.
 * Examples:
 *   formatNumber(1234567.89, "en") → "1,234,567.89"
 *   formatNumber(1234567.89, "ar") → "١٬٢٣٤٬٥٦٧٫٨٩"  (Arabic numerals)
 */
export function formatNumber(value: number, locale = "en", options?: Intl.NumberFormatOptions): string {
  try {
    return new Intl.NumberFormat(locale, options).format(value);
  } catch {
    return String(value);
  }
}

/**
 * Format a monetary amount in the given currency and locale.
 * Examples:
 *   formatCurrency(2500, "PKR", "en") → "Rs. 2,500"
 *   formatCurrency(100, "USD", "en") → "$100.00"
 *   formatCurrency(500, "AED", "ar") → "د.إ.‏ ٥٠٠٫٠٠"
 */
export function formatCurrency(amount: number, currencyCode = "USD", locale = "en"): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: currencyCode === "PKR" || currencyCode === "INR" ? 0 : 2,
    }).format(amount);
  } catch {
    // Fallback for unknown currency codes
    return `${currencyCode} ${formatNumber(amount, locale)}`;
  }
}

/**
 * Format a Date or ISO string per locale.
 * Examples:
 *   formatDate("2025-01-15", "en") → "January 15, 2025"
 *   formatDate("2025-01-15", "ar") → "١٥ يناير ٢٠٢٥"
 */
export function formatDate(
  value: Date | string | number,
  locale = "en",
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" }
): string {
  try {
    return new Intl.DateTimeFormat(locale, options).format(new Date(value));
  } catch {
    return String(value);
  }
}

/**
 * Format a relative time (e.g. "2 days ago") using Intl.RelativeTimeFormat.
 * Automatically picks the best unit (seconds → minutes → hours → days → weeks → months → years).
 */
export function formatRelativeTime(date: Date | string | number, locale = "en"): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = then - now;
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);
  const diffWeek = Math.round(diffDay / 7);
  const diffMonth = Math.round(diffDay / 30);
  const diffYear = Math.round(diffDay / 365);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, "second");
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, "hour");
  if (Math.abs(diffDay) < 7) return rtf.format(diffDay, "day");
  if (Math.abs(diffWeek) < 5) return rtf.format(diffWeek, "week");
  if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, "month");
  return rtf.format(diffYear, "year");
}

/**
 * Returns a compact currency range string, e.g. "PKR 2,000 – 5,000 / hr"
 */
export function formatPriceRange(
  min: number,
  max: number,
  currencyCode = "PKR",
  locale = "en",
  unit?: string
): string {
  const fmt = (n: number) => formatNumber(n, locale);
  const range = min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
  const suffix = unit ? ` / ${unit}` : "";
  return `${currencyCode} ${range}${suffix}`;
}
