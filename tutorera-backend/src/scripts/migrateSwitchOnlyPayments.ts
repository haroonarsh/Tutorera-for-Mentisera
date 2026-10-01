/**
 * Additive Switch-only payment migration.
 *
 * It never changes historical PaymentLedger provider values: those records are
 * financial evidence. It removes obsolete prior-provider configuration from
 * active market settings and disables checkout until Switch capability
 * approval is explicitly supplied through environment configuration.
 */
import mongoose from "mongoose";
import "dotenv/config";
import MarketConfig from "../models/MarketConfig.model";
import { getSwichCapabilities } from "../services/swichProvider.service";
import { LAUNCH_MARKETS } from "../services/market.service";

async function run() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
  await mongoose.connect(process.env.MONGO_URI);
  const capabilities = getSwichCapabilities();
  const markets = await MarketConfig.find();
  for (const market of markets) {
    const launchMarket = LAUNCH_MARKETS[market.countryCode as keyof typeof LAUNCH_MARKETS];
    if (!launchMarket) continue;
    // New activity is settled in USD. Historic requests, bookings and
    // payment ledgers retain their stored currency snapshots.
    market.currency = launchMarket.currency;
    market.currencySymbol = launchMarket.currencySymbol;
    const enabled = capabilities.markets.has(market.countryCode) && capabilities.currencies.has("USD");
    market.paymentProvider = enabled ? "swich" : "none";
    market.paymentsEnabled = enabled;
    market.payoutsEnabled = false;
    market.launchStatus = enabled ? "live" : launchMarket.launchStatus;
    market.onlineEnabled = launchMarket.onlineEnabled;
    market.homeTuitionEnabled = launchMarket.homeTuitionEnabled;
    if (market.featureFlags instanceof Map) {
      for (const feature of ["profiles", "requests", "offers", "negotiation", "acceptance"]) market.featureFlags.set(feature, enabled);
    }
    await market.save();
  }
  console.log(`Migrated ${markets.length} market configurations to Switch-only checkout.`);
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
