import mongoose, { Schema, Document, Types } from "mongoose";

// Singleton document - there is always exactly one. Referral.controller.ts
// reads this at runtime instead of hardcoded constants, so admins can adjust
// the reward without a code deploy.
export interface IReferralConfig extends Document {
  referrerRewardAmount: number;
  referredDiscountAmount: number;
  isActive: boolean;
  updatedBy?: Types.ObjectId;
  updatedAt?: Date;
}

const referralConfigSchema = new Schema<IReferralConfig>(
  {
    referrerRewardAmount: { type: Number, default: 200, min: 0 },
    referredDiscountAmount: { type: Number, default: 200, min: 0 },
    isActive: { type: Boolean, default: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model<IReferralConfig>("ReferralConfig", referralConfigSchema);
