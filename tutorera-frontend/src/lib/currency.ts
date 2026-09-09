// src/lib/currency.ts
// Frontend currency utilities — convert amounts, display prices, and manage
// the user's active currency preference. Rates are fetched from the backend
// and cached in sessionStorage for the browser session.

import { SUPPORTED_CURRENCIES } from "@/lib/location";

const RATES_CACHE_KEY = "tutorera_fx_rates";
const RATES_TTL_MS = 60 * 60 * 1000; // 1 hour

interface RatesCache {
  base: "USD";
  rates: Record<string, number>;
  fetchedAt: number;
}

/** Load cached rates from sessionStorage (if fresh) */
function loadCachedRates(): Record<string, number> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(RATES_CACHE_KEY);
    if (!raw) return null;
    const cache: RatesCache = JSON.parse(raw);
    if (Date.now() - cache.fetchedAt < RATES_TTL_MS) return cache.rates;
    return null;
  } catch {
    return null;
  }
}

/** Persist fresh rates to sessionStorage */
function persistRates(rates: Record<string, number>): void {
  if (typeof window === "undefined") return;
  try {
    const cache: RatesCache = { base: "USD", rates, fetchedAt: Date.now() };
    sessionStorage.setItem(RATES_CACHE_KEY, JSON.stringify(cache));
  } catch { /* quota exceeded — ignore */ }
}

let _ratesPromise: Promise<Record<string, number>> | null = null;

/** Fetch live exchange rates from the backend (with session cache) */
export async function getExchangeRates(): Promise<Record<string, number>> {
  const cached = loadCachedRates();
  if (cached) return cached;

  if (!_ratesPromise) {
    _ratesPromise = fetch("/api/v1/locations/exchange-rates")
      .then((r) => r.json())
      .then((j) => {
        const rates = j?.data as Record<string, number>;
        persistRates(rates);
        _ratesPromise = null;
        return rates;
      })
      .catch(() => {
        _ratesPromise = null;
        // Fall back to static rates from location module
        const fallback: Record<string, number> = {};
        for (const [code, meta] of Object.entries(SUPPORTED_CURRENCIES)) {
          fallback[code] = 1 / meta.rateToUSD;
        }
        return fallback;
      });
  }

  return _ratesPromise;
}

/**
 * Convert an amount from one currency to another.
 * Uses live rates if available, falls back to static SUPPORTED_CURRENCIES.
 */
export async function convertAmount(
  amount: number,
  from: string,
  to: string
): Promise<number> {
  if (from === to) return amount;
  const rates = await getExchangeRates();
  const rateFrom = rates[from.toUpperCase()];
  const rateTo = rates[to.toUpperCase()];
  if (!rateFrom || !rateTo) return amount;
  return (amount / rateFrom) * rateTo;
}

/**
 * Synchronous conversion using static fallback rates only.
 * Useful for rendering without async calls.
 */
export function convertAmountStatic(amount: number, from: string, to: string): number {
  if (from === to) return amount;
  const fromMeta = SUPPORTED_CURRENCIES[from.toUpperCase()];
  const toMeta = SUPPORTED_CURRENCIES[to.toUpperCase()];
  if (!fromMeta || !toMeta) return amount;
  // amount in USD = amount * fromMeta.rateToUSD
  return (amount * fromMeta.rateToUSD) / toMeta.rateToUSD;
}

/** Format an amount as a display string using the currency's symbol */
export function displayAmount(
  amount: number,
  currencyCode: string,
  locale = "en",
  pricingUnit?: string
): string {
  const code = (currencyCode || "USD").toUpperCase();
  const meta = SUPPORTED_CURRENCIES[code];
  const symbol = meta?.symbol ?? code;

  const rounded = Math.round(amount);
  const formatted = rounded.toLocaleString(locale);
  const price = `${symbol} ${formatted}`;
  return pricingUnit ? `${price} / ${pricingUnit}` : price;
}

/**
 * Returns a compact price range string.
 * Example: "PKR 2,000 – 5,000 / hr"
 */
export function displayPriceRange(
  min: number,
  max: number,
  currencyCode: string,
  locale = "en",
  unit?: string
): string {
  const fmt = (n: number) => Math.round(n).toLocaleString(locale);
  const code = (currencyCode || "USD").toUpperCase();
  const meta = SUPPORTED_CURRENCIES[code];
  const symbol = meta?.symbol ?? code;
  const range = min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
  const suffix = unit ? ` / ${unit}` : "";
  return `${symbol} ${range}${suffix}`;
}

/** Get currency metadata for a given ISO code */
export function getCurrencyMeta(code: string) {
  return SUPPORTED_CURRENCIES[(code || "USD").toUpperCase()] ?? null;
}

/** Sorted list of supported currencies for dropdowns */
export const CURRENCY_OPTIONS = Object.values(SUPPORTED_CURRENCIES)
  .map(({ code, symbol, name }) => ({ value: code, label: `${symbol} ${name} (${code})` }))
  .sort((a, b) => a.label.localeCompare(b.label));
