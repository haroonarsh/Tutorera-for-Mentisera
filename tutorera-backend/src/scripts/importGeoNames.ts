import "dotenv/config";
import fs from "fs";
import readline from "readline";
import mongoose from "mongoose";
import Country from "../models/Country.model";
import Region from "../models/Region.model";
import City from "../models/City.model";
import { ensureLaunchMarkets, LAUNCH_MARKETS } from "../services/market.service";

const source = process.argv.find((value) => value.startsWith("--file="))?.slice(7);
const apply = process.argv.includes("--apply");
if (!source || !fs.existsSync(source)) throw new Error("Provide an extracted GeoNames allCountries.txt path with --file=<path>.");

async function run() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGO_URI is required.");
  await mongoose.connect(uri);
  await ensureLaunchMarkets();
  let examined = 0, eligible = 0, written = 0;
  const countries = new Map((await Country.find()).map((item) => [item.iso2, item]));
  const regions = new Map((await Region.find()).map((item) => [`${item.countryCode}.${item.code}`, item]));
  const batch: any[] = [];
  const stream = readline.createInterface({ input: fs.createReadStream(source as string), crlfDelay: Infinity });
  for await (const line of stream) {
    examined++;
    const col = line.split("\t");
    const [geonameId, name, asciiName, , latitude, longitude, featureClass, featureCode, countryCode, , admin1, , , , population, , , timezone] = col;
    if (featureClass !== "P" || !countryCode || !Object.prototype.hasOwnProperty.call(LAUNCH_MARKETS, countryCode)) continue;
    eligible++;
    let country = countries.get(countryCode);
    if (!country && apply) {
      const seed = LAUNCH_MARKETS[countryCode as keyof typeof LAUNCH_MARKETS];
      country = await Country.findOneAndUpdate({ iso2: countryCode }, { $setOnInsert: { iso2: countryCode, name: seed.countryName, iso3: seed.iso3, dialCode: seed.dialCode, currencyCode: seed.currency, currencySymbol: seed.currencySymbol, timezones: seed.timezones, languages: ["en"], enabled: true } }, { upsert: true, new: true });
      if (country) countries.set(countryCode, country);
    }
    if (!country) continue;
    const region = regions.get(`${countryCode}.${admin1}`);
    batch.push({ updateOne: { filter: { geonameId: Number(geonameId) }, update: { $set: { country: country._id, region: region?._id, countryCode, regionCode: admin1, name, asciiName, timezone, population: Number(population) || 0, location: { type: "Point", coordinates: [Number(longitude), Number(latitude)] }, enabled: true, featureCode } }, upsert: true } });
    if (apply && batch.length >= 1000) { const result = await City.bulkWrite(batch, { ordered: false }); written += result.upsertedCount + result.modifiedCount; batch.length = 0; }
  }
  if (apply && batch.length) { const result = await City.bulkWrite(batch, { ordered: false }); written += result.upsertedCount + result.modifiedCount; }
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", examined, eligible, written }, null, 2));
  await mongoose.disconnect();
}

run().catch(async (error) => { console.error(error); await mongoose.disconnect(); process.exitCode = 1; });
