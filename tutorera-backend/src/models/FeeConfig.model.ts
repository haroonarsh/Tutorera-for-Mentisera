// src/models/FeeConfig.model.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IFeeConfig extends Document {
  version: string;
  countryCode: string;
  currency: string;
  studentFeePercent: number;
  tutorFeePercent: number;
  minimumFee: number;
  maximumFee: number;
  taxPercent: number;
  effectiveDate: Date;
  isActive: boolean;
  notes?: string;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const feeConfigSchema = new Schema<IFeeConfig>(
  {
    version: { type: String, required: true },
    countryCode: { type: String, default: "GLOBAL", index: true },
    currency: { type: String, default: "PKR" },
    studentFeePercent: { type: Number, default: 5, min: 0, max: 100 },
    tutorFeePercent: { type: Number, default: 15, min: 0, max: 100 },
    minimumFee: { type: Number, default: 100, min: 0 },
    maximumFee: { type: Number, default: 5000, min: 0 },
    taxPercent: { type: Number, default: 0, min: 0, max: 100 },
    effectiveDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true, index: true },
    notes: { type: String, default: "" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model<IFeeConfig>("FeeConfig", feeConfigSchema);
