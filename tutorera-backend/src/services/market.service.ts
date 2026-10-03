import MarketConfig, { IMarketConfig } from "../models/MarketConfig.model";
import { seedTaxConfigs } from "./pricing.service";
import { getSwichCapabilities } from "./swichProvider.service";
import { httpError } from "../utils/httpError";

export const LAUNCH_MARKETS = {
  PK: {
    countryName: "Pakistan", iso3: "PAK", dialCode: "+92", currency: "USD", currencySymbol: "$",
    timezone: "Asia/Karachi", timezones: ["Asia/Karachi"], launchStatus: "live", paymentProvider: "swich",
    paymentsEnabled: true, payoutsEnabled: false, onlineEnabled: true, homeTuitionEnabled: true,
    featureFlags: { profiles: true, requests: true, offers: true, negotiation: true, acceptance: true },
  },
  AE: {
    countryName: "United Arab Emirates", iso3: "ARE", dialCode: "+971", currency: "USD", currencySymbol: "$",
    timezone: "Asia/Dubai", timezones: ["Asia/Dubai"], launchStatus: "live", paymentProvider: "swich",
    paymentsEnabled: true, payoutsEnabled: false, onlineEnabled: true, homeTuitionEnabled: true,
    featureFlags: { profiles: true, requests: true, offers: true, negotiation: true, acceptance: true },
  },
  GB: {
    countryName: "United Kingdom", iso3: "GBR", dialCode: "+44", currency: "USD", currencySymbol: "$",
    timezone: "Europe/London", timezones: ["Europe/London"], launchStatus: "live", paymentProvider: "swich",
    paymentsEnabled: true, payoutsEnabled: false, onlineEnabled: true, homeTuitionEnabled: true,
    featureFlags: { profiles: true, requests: true, offers: true, negotiation: true, acceptance: true },
  },
  US: {
    countryName: "United States", iso3: "USA", dialCode: "+1", currency: "USD", currencySymbol: "$",
    timezone: "America/New_York", timezones: ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles"], launchStatus: "live", paymentProvider: "swich",
    paymentsEnabled: true, payoutsEnabled: false, onlineEnabled: true, homeTuitionEnabled: true,
    featureFlags: { profiles: true, requests: true, offers: true, negotiation: true, acceptance: true },
  },
  SA: {
    countryName: "Saudi Arabia", iso3: "SAU", dialCode: "+966", currency: "USD", currencySymbol: "$",
    timezone: "Asia/Riyadh", timezones: ["Asia/Riyadh"], launchStatus: "live", paymentProvider: "swich",
    paymentsEnabled: true, payoutsEnabled: false, onlineEnabled: true, homeTuitionEnabled: true,
    featureFlags: { profiles: true, requests: true, offers: true, negotiation: true, acceptance: true },
  },
  IN: {
    countryName: "India", iso3: "IND", dialCode: "+91", currency: "USD", currencySymbol: "$",
    timezone: "Asia/Kolkata", timezones: ["Asia/Kolkata"], launchStatus: "live", paymentProvider: "swich",
    paymentsEnabled: true, payoutsEnabled: false, onlineEnabled: true, homeTuitionEnabled: true,
    featureFlags: { profiles: true, requests: true, offers: true, negotiation: true, acceptance: true },
  },
} as const;

export async function ensureLaunchMarkets(): Promise<void> {
  const swichCapabilities = getSwichCapabilities();
  await Promise.all(Object.entries(LAUNCH_MARKETS).map(([countryCode, config]) => {
    // Switch settles the configured launch markets in USD.  Historical
    // requests, bookings and ledger rows retain their own currency snapshot;
    // this configuration affects newly created marketplace activity only.
    //
    // Everything else - including launchStatus and featureFlags - is seeded
    // on INSERT ONLY. This used to be a blanket $set applied on every call
    // (this function runs on nearly every admin market-rules page load and
    // every public country-list request), which silently reverted any
    // deliberate admin change - e.g. pausing a market during an incident, or
    // disabling a feature flag - back to the hardcoded default within
    // seconds of it being made.
    const switchApproved = swichCapabilities.markets.has(countryCode) && swichCapabilities.currencies.has(config.currency);
    const marketSafety = switchApproved
      ? {
          currency: config.currency, currencySymbol: config.currencySymbol,
          paymentProvider: "swich", paymentsEnabled: true, payoutsEnabled: false,
          launchStatus: "live", onlineEnabled: config.onlineEnabled, homeTuitionEnabled: config.homeTuitionEnabled,
          "featureFlags.profiles": true, "featureFlags.requests": true, "featureFlags.offers": true,
          "featureFlags.negotiation": true, "featureFlags.acceptance": true,
        }
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
    throw httpError("This marketplace feature is not available in the selected market.", 422, "MARKET_FEATURE_UNAVAILABLE");
  }
  return market;
}

export async function assertAcceptanceAvailable(countryCode?: string): Promise<IMarketConfig> {
  const market = await resolveMarket(countryCode);
if (!market || market.launchStatus !== "live" || !market.paymentsEnabled || !marketFeatureEnabled(market, "acceptance")) {
    throw httpError("Offer acceptance and payment are not available in this discovery-beta market yet.", 409, "MARKET_DISCOVERY_ONLY");
  }
if (market.paymentProvider !== "swich") {
    throw httpError("No compliant payment provider is configured for this market.", 409, "PAYMENT_PROVIDER_UNAVAILABLE");
  }
  const capabilities = getSwichCapabilities();
if (!capabilities.markets.has(market.countryCode) || !capabilities.currencies.has(market.currency)) {
    throw httpError("Switch is not approved for this market and currency yet.", 409, "SWICH_MARKET_OR_CURRENCY_UNSUPPORTED");
  }
  return market;
}
