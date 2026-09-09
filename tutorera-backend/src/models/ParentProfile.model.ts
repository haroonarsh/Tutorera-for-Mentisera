import mongoose, { Schema, Document, Types } from "mongoose";

export interface IChildProfile extends Document {
  studentUser: Types.ObjectId;
  name: string;
  level: string;
  subjects: string[];
  relationship: string;
}

export interface IParentProfile extends Document {
  user: Types.ObjectId;
  fullName?: string;
  phone?: string;
  children: IChildProfile[];
  approvalRequiredForBookings: boolean;
  spendingLimitMonthly?: number;
  spendingLimitCurrency?: string;    // ISO 4217 — currency of the spending limit
  notificationsEnabled: boolean;
  country?: Types.ObjectId; region?: Types.ObjectId; cityRef?: Types.ObjectId; locality?: Types.ObjectId;
  countryCode?: string; countryName?: string; timezone?: string; currency?: string; preferredLanguage?: string;
  city?: string;
  cityId?: string;
  regionCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const childProfileSchema = new Schema<IChildProfile>({
  studentUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true, trim: true },
  level: { type: String, trim: true, default: "" },
  subjects: [{ type: String, trim: true }],
  relationship: { type: String, trim: true, default: "child" },
});

const parentProfileSchema = new Schema<IParentProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    fullName: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    children: [childProfileSchema],
    approvalRequiredForBookings: { type: Boolean, default: true },
    spendingLimitMonthly: { type: Number, default: undefined },
    spendingLimitCurrency: { type: String, uppercase: true, trim: true },
    notificationsEnabled: { type: Boolean, default: true },
    country: { type: Schema.Types.ObjectId, ref: "Country", index: true },
    region: { type: Schema.Types.ObjectId, ref: "Region", index: true },
    cityRef: { type: Schema.Types.ObjectId, ref: "City", index: true },
    locality: { type: Schema.Types.ObjectId, ref: "Locality", index: true },
    countryCode: { type: String, uppercase: true, trim: true, index: true },
    countryName: { type: String, trim: true },
    city: { type: String, trim: true, default: "" },
    cityId: { type: String, trim: true, lowercase: true },
    regionCode: { type: String, uppercase: true, trim: true },
    timezone: { type: String, trim: true },
    currency: { type: String, uppercase: true, trim: true },
    preferredLanguage: { type: String, lowercase: true, trim: true, default: "en" },
  },
  { timestamps: true }
);

export default mongoose.model<IParentProfile>("ParentProfile", parentProfileSchema);
