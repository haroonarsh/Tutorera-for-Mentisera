import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBid extends Document {
  request: Types.ObjectId;
  tutor: Types.ObjectId;
  amount: number;
  currency: string;
  originalAmount?: number;
  originalCurrency?: string;
  convertedRequestAmount?: number;
  exchangeRate?: number;
  message: string;
  initialStudentRate: number;
  pricingUnit: "hour" | "session" | "month" | "course";
  availability?: string;
  expiresAt: Date;
  viewedAt?: Date;
  renewedAt?: Date;
  renewalCount: number;
  flaggedForModeration: boolean;
  moderationReasons: string[];
  expiryReminderSentAt?: Date;
  status: "pending" | "submitted" | "viewed" | "countered" | "payment_pending" | "accepted" | "rejected" | "withdrawn" | "expired" | "not_selected";
  paymentPendingExpiresAt?: Date;
  isDirect: boolean;
  createdAt: Date;
}

const bidSchema = new Schema<IBid>(
  {
    request: { type: Schema.Types.ObjectId, ref: "Request", required: true },
    tutor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, trim: true, default: "PKR" },
    originalAmount: { type: Number },
    originalCurrency: { type: String, trim: true },
    convertedRequestAmount: { type: Number },
    exchangeRate: { type: Number, default: 1.0 },
    initialStudentRate: { type: Number, required: true, min: 0 },
    pricingUnit: { type: String, enum: ["hour", "session", "month", "course"], default: "hour" },
    availability: { type: String, trim: true, maxlength: 300 },
    expiresAt: { type: Date, required: true },
    viewedAt: { type: Date },
    renewedAt: { type: Date },
    renewalCount: { type: Number, default: 0, min: 0 },
    flaggedForModeration: { type: Boolean, default: false },
    moderationReasons: [{ type: String }],
    expiryReminderSentAt: { type: Date },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "submitted", "viewed", "countered", "payment_pending", "accepted", "rejected", "withdrawn", "expired", "not_selected"],
      default: "submitted",
    },
    paymentPendingExpiresAt: { type: Date },
    isDirect: { type: Boolean, default: false },
  },
  { timestamps: true }
);

bidSchema.index({ request: 1, tutor: 1 }, { unique: true });
bidSchema.index({ expiresAt: 1, status: 1 });
bidSchema.index({ tutor: 1, createdAt: -1 });

export default mongoose.model<IBid>("Bid", bidSchema);
