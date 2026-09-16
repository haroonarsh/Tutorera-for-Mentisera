import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPromoCodeRedemption extends Document {
  promoCode: Types.ObjectId;
  user: Types.ObjectId;
  booking?: Types.ObjectId;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: "reserved" | "applied" | "cancelled";
  createdAt?: Date;
  updatedAt?: Date;
}

const promoCodeRedemptionSchema = new Schema<IPromoCodeRedemption>(
  {
    promoCode: { type: Schema.Types.ObjectId, ref: "PromoCode", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    booking: { type: Schema.Types.ObjectId, ref: "Booking" },
    originalAmount: { type: Number, required: true },
    discountAmount: { type: Number, required: true },
    finalAmount: { type: Number, required: true },
    status: { type: String, enum: ["reserved", "applied", "cancelled"], default: "applied" },
  },
  { timestamps: true }
);

export default mongoose.model<IPromoCodeRedemption>("PromoCodeRedemption", promoCodeRedemptionSchema);
