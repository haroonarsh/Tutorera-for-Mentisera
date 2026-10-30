import "dotenv/config";
import mongoose from "mongoose";
import { seedSchoolOfferings } from "../services/schoolOfferingSeed.service";

async function main() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
  const apply = process.argv.includes("--apply");
  if (apply && !process.argv.includes("--confirm=SEED_SCHOOL_OFFERINGS")) throw new Error("Apply requires --confirm=SEED_SCHOOL_OFFERINGS");
  await mongoose.connect(process.env.MONGO_URI, { autoIndex: false, autoCreate: false });
  try {
    const result = await seedSchoolOfferings(apply);
    console.log(JSON.stringify(result, null, 2));
    if (result.errors.length) process.exitCode = 1;
  } finally { await mongoose.disconnect(); }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Seed failed"); process.exitCode = 1; });
