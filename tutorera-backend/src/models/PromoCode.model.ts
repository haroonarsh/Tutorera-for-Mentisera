import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPromoCode extends Document {
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscountAmount?: number;
  minBookingAmount: number;
  maxRedemptions?: number;
  maxRedemptionsPerUser: number;
  redemptionCount: number;
  applicableRoles: ("student" | "parent")[];
  validFrom: Date;
  validUntil?: Date;
  isActive: boolean;
  createdBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const promoCodeSchema = new Schema<IPromoCode>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: "", trim: true },
    discountType: { type: String, enum: ["percentage", "fixed"], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    maxDiscountAmount: { type: Number },
    minBookingAmount: { type: Number, default: 0 },
    maxRedemptions: { type: Number },
    maxRedemptionsPerUser: { type: Number, default: 1 },
    redemptionCount: { type: Number, default: 0 },
    applicableRoles: { type: [String], enum: ["student", "parent"], default: ["student", "parent"] },
    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

promoCodeSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });

export default mongoose.model<IPromoCode>("PromoCode", promoCodeSchema);
