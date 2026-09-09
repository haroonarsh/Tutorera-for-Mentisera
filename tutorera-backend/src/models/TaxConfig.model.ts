// backend/src/models/TaxConfig.model.ts
// Per-country tax configuration for invoicing and checkout fee breakdown.
// Supports VAT, GST, service tax, and digital service tax (DST) models.

import mongoose, { Schema, Document, Types } from "mongoose";

export type TaxType = "VAT" | "GST" | "service_tax" | "DST" | "none";

export interface ITaxConfig extends Document {
  countryCode: string;           // ISO 3166-1 alpha-2 (uppercase)
  taxType: TaxType;
  rate: number;                  // percentage, e.g. 15 for 15%
  name: string;                  // display name e.g. "GST", "VAT (20%)"
  registrationThresholdUSD?: number; // annual revenue threshold to start collecting
  tutorLiable: boolean;          // true if the tutor remits tax independently
  platformCollects: boolean;     // true if platform collects on behalf of seller
  invoiceRequired: boolean;      // true if a tax invoice must be generated
  appliesOnlineServices: boolean;
  appliesHomeTuition: boolean;
  effectiveFrom?: Date;
  notes?: string;
  updatedBy?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const taxConfigSchema = new Schema<ITaxConfig>(
  {
    countryCode: { type: String, required: true, uppercase: true, trim: true, unique: true, index: true },
    taxType: { type: String, enum: ["VAT", "GST", "service_tax", "DST", "none"], default: "none" },
    rate: { type: Number, default: 0, min: 0, max: 100 },
    name: { type: String, trim: true, default: "Tax" },
    registrationThresholdUSD: { type: Number, min: 0 },
    tutorLiable: { type: Boolean, default: false },
    platformCollects: { type: Boolean, default: true },
    invoiceRequired: { type: Boolean, default: false },
    appliesOnlineServices: { type: Boolean, default: true },
    appliesHomeTuition: { type: Boolean, default: true },
    effectiveFrom: { type: Date },
    notes: { type: String, trim: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.model<ITaxConfig>("TaxConfig", taxConfigSchema);
