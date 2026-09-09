// backend/src/services/exchangeRate.service.ts
// Fetches live exchange rates hourly and stores them in MongoDB.
// Provides a in-memory cache so most callers never hit the DB.

import https from "https";
import ExchangeRate, { IExchangeRate } from "../models/ExchangeRate.model";
import { SUPPORTED_CURRENCIES } from "../config/countries";

// In-memory cache (refreshed by the cron job)
let _cache: Record<string, number> | null = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/** Fetch fresh rates from exchangerate.host (free tier, base USD) */
async function fetchFromApi(): Promise<Record<string, number>> {
  return new Promise((resolve, reject) => {
    const symbols = Object.keys(SUPPORTED_CURRENCIES).join(",");
    const url = `https://api.exchangerate.host/latest?base=USD&symbols=${symbols}`;
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (json.rates) resolve(json.rates as Record<string, number>);
            else reject(new Error("No rates in response"));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

/** Returns the latest rates, from cache or DB or live API (in that priority order) */
export async function getLatestRates(): Promise<Record<string, number>> {
  // 1. In-memory cache
  if (_cache && Date.now() - _cacheTime < CACHE_TTL_MS) return _cache;

  // 2. DB (last snapshot)
  const latest = await ExchangeRate.findOne().sort({ fetchedAt: -1 }).lean();
  if (latest && Date.now() - new Date(latest.fetchedAt).getTime() < CACHE_TTL_MS) {
    _cache = latest.rates as unknown as Record<string, number>;
    _cacheTime = Date.now();
    return _cache;
  }

  // 3. Live API
  return refreshRates();
}

/** Force-refresh rates from the live API and persist to DB */
export async function refreshRates(): Promise<Record<string, number>> {
  try {
    const rates = await fetchFromApi();
    _cache = rates;
    _cacheTime = Date.now();

    await ExchangeRate.create({
      base: "USD",
      rates,
      source: "exchangerate.host",
      fetchedAt: new Date(),
    });

    console.log("[ExchangeRate] Rates refreshed:", new Date().toISOString());
    return rates;
  } catch (err) {
    console.error("[ExchangeRate] Failed to refresh rates:", err);
    // Fall back to static rates from SUPPORTED_CURRENCIES
    const staticRates: Record<string, number> = {};
    for (const [code, meta] of Object.entries(SUPPORTED_CURRENCIES)) {
      staticRates[code] = 1 / (meta.rateToUSD || 1);
    }
    return staticRates;
  }
}

/**
 * Convert an amount between two currencies.
 * @param amount - The source amount
 * @param from   - ISO 4217 source currency code (e.g. "PKR")
 * @param to     - ISO 4217 target currency code (e.g. "USD")
 */
export async function convertAmount(amount: number, from: string, to: string): Promise<number> {
  if (from === to) return amount;
  const rates = await getLatestRates();
  const rateFrom = rates[from.toUpperCase()]; // rate relative to USD
  const rateTo = rates[to.toUpperCase()];
  if (!rateFrom || !rateTo) {
    throw new Error(`Unknown currency: ${!rateFrom ? from : to}`);
  }
  // Convert: amount / rateFrom → USD → * rateTo → target
  return (amount / rateFrom) * rateTo;
}

/** Synchronous conversion using cache only (for non-critical display use) */
export function convertAmountSync(amount: number, from: string, to: string): number | null {
  if (!_cache) return null;
  if (from === to) return amount;
  const rateFrom = _cache[from.toUpperCase()];
  const rateTo = _cache[to.toUpperCase()];
  if (!rateFrom || !rateTo) return null;
  return (amount / rateFrom) * rateTo;
}
