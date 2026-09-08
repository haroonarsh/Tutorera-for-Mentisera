// src/models/MarketConfig.model.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMarketConfig extends Document {
  countryCode: string;
  countryName: string;
  iso3?: string;
  dialCode?: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  timezones: string[];
  defaultLanguage: string;
  supportedLanguages: string[];
  onlineEnabled: boolean;
  homeTuitionEnabled: boolean;
  studentRegistration: boolean;
  tutorRegistration: boolean;
  paymentProvider: string;
  paymentsEnabled: boolean;
  payoutsEnabled: boolean;
  backgroundCheckRequired: boolean;
  platformFeePercent: number;
  taxPercent: number;
  isActive: boolean;
  launchStatus: "live" | "beta" | "coming_soon" | "paused";
  supportedCities: string[];
  featureFlags: Record<string, boolean>;
  verificationPolicy: {
    onlineIdentityRequired: boolean;
    educationRequired: boolean;
    demoRequired: boolean;
    homeSafetyCheckRequired: boolean;
  };
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const marketConfigSchema = new Schema<IMarketConfig>(
  {
    countryCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    countryName: { type: String, required: true, trim: true },
    iso3: { type: String, uppercase: true, trim: true },
    dialCode: { type: String, trim: true },
    currency: { type: String, required: true, uppercase: true, trim: true },
    currencySymbol: { type: String, default: "$" },
    timezone: { type: String, default: "UTC" },
    timezones: [{ type: String, trim: true }],
    defaultLanguage: { type: String, default: "en", lowercase: true, trim: true },
    supportedLanguages: { type: [String], default: ["en"] },
    onlineEnabled: { type: Boolean, default: true },
    homeTuitionEnabled: { type: Boolean, default: false },
    studentRegistration: { type: Boolean, default: true },
    tutorRegistration: { type: Boolean, default: true },
    paymentProvider: { type: String, default: "none" },
    paymentsEnabled: { type: Boolean, default: false },
    payoutsEnabled: { type: Boolean, default: false },
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
    featureFlags: {
      type: Map,
      of: Boolean,
      default: () => ({ profiles: true, requests: true, offers: true, negotiation: true, acceptance: false }),
    },
    verificationPolicy: {
      onlineIdentityRequired: { type: Boolean, default: true },
      educationRequired: { type: Boolean, default: true },
      demoRequired: { type: Boolean, default: true },
      homeSafetyCheckRequired: { type: Boolean, default: true },
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model<IMarketConfig>("MarketConfig", marketConfigSchema);
