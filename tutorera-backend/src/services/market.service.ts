import MarketConfig, { IMarketConfig } from "../models/MarketConfig.model";

export const LAUNCH_MARKETS = {
  PK: {
    countryName: "Pakistan", iso3: "PAK", dialCode: "+92", currency: "PKR", currencySymbol: "Rs.",
    timezone: "Asia/Karachi", timezones: ["Asia/Karachi"], launchStatus: "live", paymentProvider: "rapid_gateway",
    paymentsEnabled: true, payoutsEnabled: false, onlineEnabled: true, homeTuitionEnabled: true,
    featureFlags: { profiles: true, requests: true, offers: true, negotiation: true, acceptance: true },
  },
  AE: {
    countryName: "United Arab Emirates", iso3: "ARE", dialCode: "+971", currency: "AED", currencySymbol: "AED",
    timezone: "Asia/Dubai", timezones: ["Asia/Dubai"], launchStatus: "live", paymentProvider: "stripe",
    paymentsEnabled: true, payoutsEnabled: true, onlineEnabled: true, homeTuitionEnabled: true,
    featureFlags: { profiles: true, requests: true, offers: true, negotiation: true, acceptance: true },
  },
  GB: {
    countryName: "United Kingdom", iso3: "GBR", dialCode: "+44", currency: "GBP", currencySymbol: "£",
    timezone: "Europe/London", timezones: ["Europe/London"], launchStatus: "beta", paymentProvider: "none",
    paymentsEnabled: false, payoutsEnabled: false, onlineEnabled: true, homeTuitionEnabled: true,
    featureFlags: { profiles: true, requests: true, offers: true, negotiation: true, acceptance: false },
  },
  US: {
    countryName: "United States", iso3: "USA", dialCode: "+1", currency: "USD", currencySymbol: "$",
    timezone: "America/New_York", timezones: ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles"], launchStatus: "live", paymentProvider: "stripe",
    paymentsEnabled: true, payoutsEnabled: true, onlineEnabled: true, homeTuitionEnabled: true,
    featureFlags: { profiles: true, requests: true, offers: true, negotiation: true, acceptance: true },
  },
  SA: {
    countryName: "Saudi Arabia", iso3: "SAU", dialCode: "+966", currency: "SAR", currencySymbol: "SAR",
    timezone: "Asia/Riyadh", timezones: ["Asia/Riyadh"], launchStatus: "live", paymentProvider: "stripe",
    paymentsEnabled: true, payoutsEnabled: true, onlineEnabled: true, homeTuitionEnabled: true,
    featureFlags: { profiles: true, requests: true, offers: true, negotiation: true, acceptance: true },
  },
  IN: {
    countryName: "India", iso3: "IND", dialCode: "+91", currency: "INR", currencySymbol: "₹",
    timezone: "Asia/Kolkata", timezones: ["Asia/Kolkata"], launchStatus: "live", paymentProvider: "stripe",
    paymentsEnabled: true, payoutsEnabled: true, onlineEnabled: true, homeTuitionEnabled: true,
    featureFlags: { profiles: true, requests: true, offers: true, negotiation: true, acceptance: true },
  },
} as const;

export async function ensureLaunchMarkets(): Promise<void> {
  await Promise.all(Object.entries(LAUNCH_MARKETS).map(([countryCode, config]) => {
    const safetyLock = countryCode === "PK"
      ? { paymentProvider: "rapid_gateway", paymentsEnabled: true, payoutsEnabled: false, launchStatus: "live", featureFlags: config.featureFlags }
      : ["AE", "US", "SA", "IN"].includes(countryCode)
      ? { paymentProvider: "stripe", paymentsEnabled: true, payoutsEnabled: true, launchStatus: "live", featureFlags: config.featureFlags }
      : { paymentProvider: "none", paymentsEnabled: false, payoutsEnabled: false, launchStatus: "beta", featureFlags: config.featureFlags };
    return MarketConfig.updateOne(
      { countryCode },
      { $setOnInsert: {
        countryCode, countryName: config.countryName, iso3: config.iso3, dialCode: config.dialCode,
        currency: config.currency, currencySymbol: config.currencySymbol, timezone: config.timezone,
        timezones: config.timezones, supportedLanguages: ["en"], defaultLanguage: "en",
        studentRegistration: true, tutorRegistration: true, isActive: true,
        onlineEnabled: config.onlineEnabled, homeTuitionEnabled: config.homeTuitionEnabled,
        backgroundCheckRequired: true, platformFeePercent: 20, taxPercent: countryCode === "PK" ? 15 : 0,
      }, $set: safetyLock },
      { upsert: true },
    );
  }));
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
  if (market.countryCode !== "PK" || market.paymentProvider !== "rapid_gateway") {
    const error = new Error("No compliant payment provider is configured for this market.") as Error & { statusCode: number; code: string };
    error.statusCode = 409;
    error.code = "PAYMENT_PROVIDER_UNAVAILABLE";
    throw error;
  }
  return market;
}
