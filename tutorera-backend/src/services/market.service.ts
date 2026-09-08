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
} as const;

export async function ensureLaunchMarkets(): Promise<void> {
  await Promise.all(Object.entries(LAUNCH_MARKETS).map(([countryCode, config]) => {
    const safetyLock = countryCode === "PK"
      ? { paymentProvider: "rapid_gateway", paymentsEnabled: true, launchStatus: "live", featureFlags: config.featureFlags }
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

export async function assertAcceptanceAvailable(countryCode?: string): Promise<IMarketConfig> {
  const market = await resolveMarket(countryCode);
  const acceptance = market?.featureFlags instanceof Map
    ? market.featureFlags.get("acceptance")
    : (market?.featureFlags as Record<string, boolean> | undefined)?.acceptance;
  if (!market || market.launchStatus !== "live" || !market.paymentsEnabled || acceptance === false) {
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
