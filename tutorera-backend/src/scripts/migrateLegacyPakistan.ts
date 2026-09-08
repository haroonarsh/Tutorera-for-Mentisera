import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.model";
import Request from "../models/Request.model";
import Booking from "../models/Booking.model";
import { ensureLaunchMarkets } from "../services/market.service";

const apply = process.argv.includes("--apply");
const normalizePkPhone = (phone?: string) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (/^03\d{9}$/.test(digits)) return `+92${digits.slice(1)}`;
  if (/^3\d{9}$/.test(digits)) return `+92${digits}`;
  if (/^92\d{10}$/.test(digits)) return `+${digits}`;
  return phone;
};

async function run() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGO_URI is required.");
  await mongoose.connect(uri);
  await ensureLaunchMarkets();
  const users = await User.find({ $or: [{ countryCode: { $exists: false } }, { countryCode: "PK" }] }).select("phone countryCode").lean();
  const requests = await Request.countDocuments({ countryCode: { $exists: false } });
  const bookings = await Booking.countDocuments({ countryCode: { $exists: false } });
  if (apply) {
    await Promise.all(users.map((user) => User.updateOne({ _id: user._id }, { $set: { countryCode: "PK", countryName: "Pakistan", currency: "PKR", timezone: "Asia/Karachi", phone: normalizePkPhone(user.phone) } })));
    await Request.updateMany({ countryCode: { $exists: false } }, { $set: { countryCode: "PK", countryName: "Pakistan", currency: "PKR", timezone: "Asia/Karachi" } });
    await Booking.updateMany({ countryCode: { $exists: false } }, { $set: { countryCode: "PK", currency: "PKR", timezone: "Asia/Karachi" } });
  }
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", users: users.length, requests, bookings }, null, 2));
  await mongoose.disconnect();
}
run().catch(async (error) => { console.error(error); await mongoose.disconnect(); process.exitCode = 1; });
