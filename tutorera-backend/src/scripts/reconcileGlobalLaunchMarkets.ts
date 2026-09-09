import "dotenv/config";
import mongoose from "mongoose";
import Country from "../models/Country.model";
import MarketConfig from "../models/MarketConfig.model";
import { ensureLaunchMarkets, LAUNCH_MARKETS } from "../services/market.service";

/**
 * One-time, additive launch-policy migration for deployments that previously
 * seeded country markets outside the approved initial set. It never deletes a
 * geography or market record. Run with --apply after reviewing the dry run.
 */
const apply = process.argv.includes("--apply");
const launchCodes = Object.keys(LAUNCH_MARKETS);

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error("MONGODB_URI or MONGO_URI is required.");
  await mongoose.connect(uri);

  const [legacyMarkets, legacyCountries] = await Promise.all([
    MarketConfig.find({ countryCode: { $nin: launchCodes }, isActive: true }).select("countryCode countryName launchStatus").lean(),
    Country.find({ iso2: { $nin: launchCodes }, enabled: true }).select("iso2 name launchStatus").lean(),
  ]);

  if (apply) {
    await ensureLaunchMarkets();
    await Promise.all([
      MarketConfig.updateMany(
        { countryCode: { $nin: launchCodes } },
        { $set: { isActive: false, launchStatus: "coming_soon", paymentsEnabled: false, payoutsEnabled: false, "featureFlags.acceptance": false } },
      ),
      Country.updateMany(
        { iso2: { $nin: launchCodes } },
        { $set: { enabled: false, launchStatus: "coming_soon" } },
      ),
      Country.updateMany(
        { iso2: { $in: launchCodes } },
        [{ $set: { enabled: true, launchStatus: { $cond: [{ $eq: ["$iso2", "PK"] }, "live", "beta"] } } }],
      ),
    ]);
  }

  console.log(JSON.stringify({
    mode: apply ? "apply" : "dry-run",
    launchMarkets: launchCodes,
    legacyActiveMarkets: legacyMarkets,
    legacyEnabledCountries: legacyCountries,
  }, null, 2));
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exitCode = 1;
});
