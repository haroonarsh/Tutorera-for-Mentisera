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

async function run() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
  await mongoose.connect(process.env.MONGO_URI);
  const capabilities = getSwichCapabilities();
  const markets = await MarketConfig.find();
  for (const market of markets) {
    const enabled = capabilities.markets.has(market.countryCode) && capabilities.currencies.has(market.currency);
    market.paymentProvider = enabled ? "swich" : "none";
    market.paymentsEnabled = enabled;
    market.payoutsEnabled = false;
    if (market.featureFlags instanceof Map) market.featureFlags.set("acceptance", enabled);
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
