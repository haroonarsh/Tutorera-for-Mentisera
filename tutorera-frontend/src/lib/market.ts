// Plain data types/helpers for the current-market concept - kept separate
// from context/MarketContext.tsx (a "use client" module) because this needs
// to be callable from server components/layouts too (e.g.
// (countries)/[countryCode]/layout.tsx), and a client-directive module can't
// export a plain function for server code to call.
import type { CountryData } from "@/lib/location";

export interface MarketInfo {
  countryCode: string; // ISO 3166-1 alpha-2, e.g. "PK"
  countryName: string;
  currency: string; // ISO 4217, e.g. "PKR"
  currencySymbol: string;
  locale: string; // BCP-47, e.g. "en-PK"
  route: string; // canonical public route segment, e.g. "pk"
  launchStatus: "live" | "beta" | "coming_soon" | "disabled";
  paymentsEnabled: boolean;
  onlineEnabled: boolean;
  homeTuitionEnabled: boolean;
  curricula: string[];
}

/** Country -> BCP-47 locale. Only markets actually in LAUNCH_MARKETS need an
 * entry; anything else falls back to "en-<CODE>" which is a reasonable
 * default for an English-only launch (see LocaleBridge - non-English UI
 * isn't published yet regardless of market). */
const LOCALE_BY_COUNTRY: Record<string, string> = {
  PK: "en-PK", GB: "en-GB", AE: "en-AE", US: "en-US", SA: "en-SA", IN: "en-IN", CA: "en-CA", AU: "en-AU",
};

export function toMarketInfo(country: CountryData, routeSegment: string): MarketInfo {
  const code = country.code.toUpperCase();
  return {
    countryCode: code,
    countryName: country.name,
    currency: country.currency,
    currencySymbol: country.currencySymbol,
    locale: LOCALE_BY_COUNTRY[code] || `en-${code}`,
    route: routeSegment.toLowerCase(),
    launchStatus: country.launchStatus || "live",
    paymentsEnabled: country.paymentsEnabled ?? false,
    onlineEnabled: country.onlineEnabled,
    homeTuitionEnabled: country.homeTuitionEnabled,
    curricula: country.curricula || [],
  };
}
