// src/models/MarketConfig.model.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMarketConfig extends Document {
  countryCode: string;
  countryName: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  onlineEnabled: boolean;
  homeTuitionEnabled: boolean;
  studentRegistration: boolean;
  tutorRegistration: boolean;
  paymentProvider: string;
  backgroundCheckRequired: boolean;
  platformFeePercent: number;
  taxPercent: number;
  isActive: boolean;
  launchStatus: "live" | "beta" | "coming_soon" | "paused";
  supportedCities: string[];
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const marketConfigSchema = new Schema<IMarketConfig>(
  {
    countryCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    countryName: { type: String, required: true, trim: true },
    currency: { type: String, required: true, uppercase: true, trim: true },
    currencySymbol: { type: String, default: "$" },
    timezone: { type: String, default: "UTC" },
    onlineEnabled: { type: Boolean, default: true },
    homeTuitionEnabled: { type: Boolean, default: false },
    studentRegistration: { type: Boolean, default: true },
    tutorRegistration: { type: Boolean, default: true },
    paymentProvider: { type: String, default: "rapid_gateway" },
    backgroundCheckRequired: { type: Boolean, default: true },
    platformFeePercent: { type: Number, default: 15, min: 0, max: 100 },
    taxPercent: { type: Number, default: 0, min: 0, max: 100 },
    isActive: { type: Boolean, default: true, index: true },
    launchStatus: {
      type: String,
      enum: ["live", "beta", "coming_soon", "paused"],
      default: "live",
    },
    supportedCities: [{ type: String, trim: true }],
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model<IMarketConfig>("MarketConfig", marketConfigSchema);
