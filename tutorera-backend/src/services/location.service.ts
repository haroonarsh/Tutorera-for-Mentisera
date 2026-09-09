// backend/src/services/location.service.ts
// Provides lookup, search, and hierarchy navigation for the global location dataset.
// Uses the static COUNTRIES map from config/geo/location.ts as the primary source,
// falling back to MarketConfig in MongoDB for runtime overrides.

import { COUNTRIES, getCountryByCode, getCitiesForCountry, Country, City } from "../config/geo/location";
import MarketConfig from "../models/MarketConfig.model";

export interface CountrySummary {
  code: string;
  name: string;
  flag: string;
  currency: string;
  phoneCode: string;
  timezone: string;
  homeTuitionEnabled: boolean;
  onlineEnabled: boolean;
  cityCount: number;
}

/** Return all countries (static dataset), enriched with live MarketConfig overrides */
export async function listCountries(activeOnly = true): Promise<CountrySummary[]> {
  // Fetch any DB overrides
  const configs = await MarketConfig.find(activeOnly ? { isActive: true } : {}).lean();
  const configMap = new Map(configs.map((c) => [c.countryCode, c]));

  return Object.values(COUNTRIES)
    .filter((c) => {
      if (!activeOnly) return true;
      const cfg = configMap.get(c.code);
      // Include if explicitly active in DB, or not in DB at all (static-only market)
      return !cfg || cfg.isActive;
    })
    .map((c) => {
      const cfg = configMap.get(c.code);
      return {
        code: c.code,
        name: c.name,
        flag: c.flag,
        currency: cfg?.currency ?? c.currency,
        phoneCode: c.phoneCode,
        timezone: cfg?.timezone ?? c.timezone,
        homeTuitionEnabled: cfg?.homeTuitionEnabled ?? c.homeTuitionEnabled,
        onlineEnabled: cfg?.onlineEnabled ?? c.onlineEnabled,
        cityCount: c.cities?.length ?? 0,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Return full country detail including cities */
export async function getCountryDetail(code: string): Promise<(Country & { marketConfig?: object }) | null> {
  const country = getCountryByCode(code);
  if (!country) return null;

  const cfg = await MarketConfig.findOne({ countryCode: code.toUpperCase() }).lean();
  return { ...country, marketConfig: cfg ?? undefined };
}

/** Return cities for a country, optionally filtered by a search query */
export function searchCities(countryCode: string, query?: string): City[] {
  const cities = getCitiesForCountry(countryCode);
  if (!query || query.trim() === "") return cities;

  const q = query.toLowerCase().trim();
  return cities.filter(
    (city) =>
      city.name.toLowerCase().includes(q) ||
      (city.region as string | undefined)?.toLowerCase().includes(q) ||
      city.areas?.some((a) => a.toLowerCase().includes(q))
  );
}

/** Fuzzy search across all countries and cities — returns scored results */
export function globalSearch(query: string, limit = 20): Array<{ type: "country" | "city"; code: string; name: string; countryCode?: string; score: number }> {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  const results: Array<{ type: "country" | "city"; code: string; name: string; countryCode?: string; score: number }> = [];

  for (const country of Object.values(COUNTRIES)) {
    const countryScore = country.name.toLowerCase().startsWith(q)
      ? 100
      : country.name.toLowerCase().includes(q)
      ? 60
      : country.code.toLowerCase() === q
      ? 80
      : 0;

    if (countryScore > 0) {
      results.push({ type: "country", code: country.code, name: country.name, score: countryScore });
    }

    for (const city of country.cities ?? []) {
      const cityScore = city.name.toLowerCase().startsWith(q)
        ? 90
        : city.name.toLowerCase().includes(q)
        ? 50
        : 0;
      if (cityScore > 0) {
        results.push({ type: "city", code: city.id ?? city.name, name: city.name, countryCode: country.code, score: cityScore });
      }
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Check whether a feature is enabled for a given country */
export async function isFeatureEnabledForCountry(feature: string, countryCode: string): Promise<boolean> {
  const cfg = await MarketConfig.findOne({ countryCode: countryCode.toUpperCase() }).lean();
  if (!cfg) return false;
  const flags = cfg.featureFlags as Map<string, boolean> | Record<string, boolean>;
  if (flags instanceof Map) return flags.get(feature) ?? false;
  return (flags as Record<string, boolean>)[feature] ?? false;
}
