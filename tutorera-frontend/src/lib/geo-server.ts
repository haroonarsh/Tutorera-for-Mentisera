// src/lib/geo-server.ts
// Server-side (build/request time) helpers for resolving GeoNames-backed
// country and city data on statically/server-rendered pages. Falls back to
// the bundled static list in @/lib/location when the backend is briefly
// unreachable, so country landing pages never hard-fail at build time.

import { getCountryByCode, COUNTRIES, CountryData, CityData } from "@/lib/location";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://tutorera-backend.onrender.com/api/v1";

export async function fetchLiveCountries(): Promise<CountryData[]> {
  try {
    const res = await fetch(`${API_URL}/geo/countries`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.countries || [];
  } catch {
    return [];
  }
}

export async function fetchLiveCities(code: string, limit = 12): Promise<CityData[]> {
  try {
    const res = await fetch(`${API_URL}/geo/cities?country=${encodeURIComponent(code)}&limit=${limit}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.cities || []).map((c: { _id?: string; name: string }) => ({ id: c._id || c.name, name: c.name }));
  } catch {
    return [];
  }
}

/** Resolves a country landing page's data from the live market registry,
 * merged over the static bundled entry (if any) so fields like flag/currency
 * still have sane defaults, and backfills `cities` since the live
 * `/geo/countries` endpoint intentionally never inlines them. */
export async function resolveCountry(countryCode: string): Promise<CountryData | undefined> {
  const live = await fetchLiveCountries();
  const liveMatch = live.find((c) => c.code.toLowerCase() === countryCode.toLowerCase());
  const staticMatch = getCountryByCode(countryCode);
  if (!liveMatch && !staticMatch) return undefined;
  const merged: CountryData = { ...(staticMatch || (liveMatch as CountryData)), ...liveMatch };
  if (!merged.cities || merged.cities.length === 0) {
    merged.cities = staticMatch?.cities?.length ? staticMatch.cities : await fetchLiveCities(merged.code);
  }
  return merged;
}

/** Static params covering both the bundled fallback markets and whatever is
 * currently live/beta in the market registry, so newly launched countries
 * get pre-rendered without a code change. */
export async function liveCountryCodeParams(): Promise<{ countryCode: string }[]> {
  const live = await fetchLiveCountries();
  const codes = new Set<string>([...COUNTRIES.map((c) => c.code), ...live.map((c) => c.code)]);
  // Countries that have their own dedicated landing hub (e.g.
  // src/app/pk/page.tsx, src/app/ae/page.tsx) must be excluded from the
  // (countries)/[countryCode] catch-all's static params so the same URL
  // isn't resolved by two routes. Static wins over dynamic in Next.js,
  // but letting both enumerate the slug is brittle under OpenNext's
  // route table generation.
  const EXPLICIT_HUBS = new Set(["pk", "ae"]);
  return Array.from(codes)
    .filter((code) => !EXPLICIT_HUBS.has(code.toLowerCase()))
    .map((code) => ({ countryCode: code.toLowerCase() }));
}
