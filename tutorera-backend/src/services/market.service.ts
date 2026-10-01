import MarketConfig, { IMarketConfig } from "../models/MarketConfig.model";
import { seedTaxConfigs } from "./pricing.service";
import { getSwichCapabilities } from "./swichProvider.service";

export const LAUNCH_MARKETS = {
  PK: {
    countryName: "Pakistan", iso3: "PAK", dialCode: "+92", currency: "PKR", currencySymbol: "Rs.",
    timezone: "Asia/Karachi", timezones: ["Asia/Karachi"], launchStatus: "live", paymentProvider: "swich",
    paymentsEnabled: true, payoutsEnabled: false, onlineEnabled: true, homeTuitionEnabled: true,
    featureFlags: { profiles: true, requests: true, offers: true, negotiation: true, acceptance: true },
  },
  AE: {
    countryName: "United Arab Emirates", iso3: "ARE", dialCode: "+971", currency: "AED", currencySymbol: "AED",
    timezone: "Asia/Dubai", timezones: ["Asia/Dubai"], launchStatus: "beta", paymentProvider: "none",
    paymentsEnabled: false, payoutsEnabled: false, onlineEnabled: true, homeTuitionEnabled: true,
    featureFlags: { profiles: true, requests: true, offers: true, negotiation: true, acceptance: false },
  },
  GB: {
    countryName: "United Kingdom", iso3: "GBR", dialCode: "+44", currency: "GBP", currencySymbol: "£",
    timezone: "Europe/London", timezones: ["Europe/London"], launchStatus: "beta", paymentProvider: "none",
    paymentsEnabled: false, payoutsEnabled: false, onlineEnabled: true, homeTuitionEnabled: true,
    featureFlags: { profiles: true, requests: true, offers: true, negotiation: true, acceptance: false },
  },
  US: {
    countryName: "United States", iso3: "USA", dialCode: "+1", currency: "USD", currencySymbol: "$",
    timezone: "America/New_York", timezones: ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles"], launchStatus: "coming_soon", paymentProvider: "none",
    paymentsEnabled: false, payoutsEnabled: false, onlineEnabled: false, homeTuitionEnabled: false,
    featureFlags: { profiles: false, requests: false, offers: false, negotiation: false, acceptance: false },
  },
  SA: {
    countryName: "Saudi Arabia", iso3: "SAU", dialCode: "+966", currency: "SAR", currencySymbol: "SAR",
    timezone: "Asia/Riyadh", timezones: ["Asia/Riyadh"], launchStatus: "coming_soon", paymentProvider: "none",
    paymentsEnabled: false, payoutsEnabled: false, onlineEnabled: false, homeTuitionEnabled: false,
    featureFlags: { profiles: false, requests: false, offers: false, negotiation: false, acceptance: false },
  },
  IN: {
    countryName: "India", iso3: "IND", dialCode: "+91", currency: "INR", currencySymbol: "₹",
    timezone: "Asia/Kolkata", timezones: ["Asia/Kolkata"], launchStatus: "coming_soon", paymentProvider: "none",
    paymentsEnabled: false, payoutsEnabled: false, onlineEnabled: false, homeTuitionEnabled: false,
    featureFlags: { profiles: false, requests: false, offers: false, negotiation: false, acceptance: false },
  },
} as const;

export async function ensureLaunchMarkets(): Promise<void> {
  await Promise.all(Object.entries(LAUNCH_MARKETS).map(([countryCode, config]) => {
    // Only PK has an implemented checkout provider. Re-enforce every
    // non-PK market's discovery/disabled state on each seed so historic
    // records cannot continue advertising payments that this code cannot
    // process safely.
    //
    // Everything else - including launchStatus and featureFlags - is seeded
    // on INSERT ONLY. This used to be a blanket $set applied on every call
    // (this function runs on nearly every admin market-rules page load and
    // every public country-list request), which silently reverted any
    // deliberate admin change - e.g. pausing a market during an incident, or
    // disabling a feature flag - back to the hardcoded default within
    // seconds of it being made.
    const marketSafety = countryCode === "PK"
      ? { paymentProvider: "swich", paymentsEnabled: true, payoutsEnabled: false, launchStatus: "live", "featureFlags.acceptance": true }
      : {
          paymentProvider: "none", paymentsEnabled: false, payoutsEnabled: false,
          launchStatus: config.launchStatus, "featureFlags.acceptance": false,
        };
    // MongoDB rejects an update that touches the same field path in both
    // $set and $setOnInsert - "would create a conflict" - regardless of
    // whether the document is being inserted or matched. Any field forced
    // via $set (GB's payment lock) must therefore be left out of
    // $setOnInsert entirely; $set already covers seeding it on insert too.
    const setOnInsert: Record<string, unknown> = {
      countryCode, countryName: config.countryName, iso3: config.iso3, dialCode: config.dialCode,
      currency: config.currency, currencySymbol: config.currencySymbol, timezone: config.timezone,
      timezones: config.timezones, supportedLanguages: ["en"], defaultLanguage: "en",
      studentRegistration: true, tutorRegistration: true, isActive: true,
      onlineEnabled: config.onlineEnabled, homeTuitionEnabled: config.homeTuitionEnabled,
      backgroundCheckRequired: true,
      launchStatus: config.launchStatus, featureFlags: config.featureFlags,
      paymentProvider: config.paymentProvider, paymentsEnabled: config.paymentsEnabled, payoutsEnabled: config.payoutsEnabled,
    };
    for (const key of Object.keys(marketSafety)) {
      delete setOnInsert[key];
      // MongoDB treats a parent map and a nested map field as conflicting
      // update paths (e.g. `featureFlags` and `featureFlags.acceptance`).
      if (key.startsWith("featureFlags.")) delete setOnInsert.featureFlags;
    }
    return MarketConfig.updateOne(
      { countryCode },
      {
        $setOnInsert: setOnInsert,
        $set: marketSafety,
      },
      { upsert: true },
    );
  }));

  // Guarantees TaxConfig rows exist for every launch market - this was
  // previously a defined-but-never-called function, meaning tax could be
  // silently 0% for every booking in every country if TaxConfig was ever
  // empty in production. Upsert-only ($setOnInsert), so it can never
  // overwrite a rate an admin has already configured.
  await seedTaxConfigs();
}

export async function resolveMarket(countryCode?: string): Promise<IMarketConfig | null> {
  const code = (countryCode || "PK").toUpperCase();
  let market = await MarketConfig.findOne({ countryCode: code, isActive: true });
  if (!market && Object.prototype.hasOwnProperty.call(LAUNCH_MARKETS, code)) {
    await ensureLaunchMarkets();
    market = await MarketConfig.findOne({ countryCode: code, isActive: true });
  }
  return market;
}

export function marketFeatureEnabled(market: IMarketConfig, feature: string): boolean {
  const flags = market.featureFlags;
  if (flags instanceof Map) return flags.get(feature) !== false;
  return (flags as Record<string, boolean> | undefined)?.[feature] !== false;
}

/** Reject an operation when its market has not been launched for that feature. */
export async function assertMarketFeature(countryCode: string | undefined, feature: string): Promise<IMarketConfig> {
  const market = await resolveMarket(countryCode);
  if (!market || !market.isActive || !marketFeatureEnabled(market, feature)) {
    const error = new Error("This marketplace feature is not available in the selected market.") as Error & { statusCode: number; code: string };
    error.statusCode = 422;
    error.code = "MARKET_FEATURE_UNAVAILABLE";
    throw error;
  }
  return market;
}

export async function assertAcceptanceAvailable(countryCode?: string): Promise<IMarketConfig> {
  const market = await resolveMarket(countryCode);
  if (!market || market.launchStatus !== "live" || !market.paymentsEnabled || !marketFeatureEnabled(market, "acceptance")) {
    const error = new Error("Offer acceptance and payment are not available in this discovery-beta market yet.") as Error & { statusCode: number; code: string };
    error.statusCode = 409;
    error.code = "MARKET_DISCOVERY_ONLY";
    throw error;
  }
  if (market.paymentProvider !== "swich") {
    const error = new Error("No compliant payment provider is configured for this market.") as Error & { statusCode: number; code: string };
    error.statusCode = 409;
    error.code = "PAYMENT_PROVIDER_UNAVAILABLE";
    throw error;
  }
  const capabilities = getSwichCapabilities();
  if (!capabilities.markets.has(market.countryCode) || !capabilities.currencies.has(market.currency)) {
    const error = new Error("Switch is not approved for this market and currency yet.") as Error & { statusCode: number; code: string };
    error.statusCode = 409;
    error.code = "SWICH_MARKET_OR_CURRENCY_UNSUPPORTED";
    throw error;
  }
  return market;
}
