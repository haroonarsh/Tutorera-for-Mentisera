// backend/src/models/FeatureFlag.model.ts
// Simple DB-backed feature flag system — supports global and per-country scopes

import mongoose, { Schema, Document, Types } from "mongoose";

export interface IFeatureFlag extends Document {
  key: string;                         // e.g. "ENABLE_GLOBAL_PLATFORM"
  enabled: boolean;
  scope: "global" | "country";
  countryCodes?: string[];             // Only relevant when scope = "country"
  description?: string;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const featureFlagSchema = new Schema<IFeatureFlag>(
  {
    key: { type: String, required: true, unique: true, trim: true, uppercase: true },
    enabled: { type: Boolean, default: false },
    scope: { type: String, enum: ["global", "country"], default: "global" },
    countryCodes: { type: [String], default: [] },
    description: { type: String, default: "" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model<IFeatureFlag>("FeatureFlag", featureFlagSchema);
