import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBid extends Document {
  request: Types.ObjectId;
  tutor: Types.ObjectId;
  amount: number;
  message: string;
  initialStudentRate: number;
  pricingUnit: "hour" | "session" | "month" | "course";
  availability?: string;
  expiresAt: Date;
  viewedAt?: Date;
  status: "pending" | "submitted" | "viewed" | "countered" | "accepted" | "rejected" | "withdrawn" | "expired" | "not_selected";
  isDirect: boolean;
  createdAt: Date;
}

const bidSchema = new Schema<IBid>(
  {
    request: { type: Schema.Types.ObjectId, ref: "Request", required: true },
    tutor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0 },
    initialStudentRate: { type: Number, required: true, min: 0 },
    pricingUnit: { type: String, enum: ["hour", "session", "month", "course"], default: "hour" },
    availability: { type: String, trim: true, maxlength: 300 },
    expiresAt: { type: Date, required: true },
    viewedAt: { type: Date },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "submitted", "viewed", "countered", "accepted", "rejected", "withdrawn", "expired", "not_selected"],
      default: "submitted",
    },
    isDirect: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One bid per tutor per request — backs up the application-level check in placeBid,
// so a race condition (two simultaneous bid requests) can't create duplicates.
bidSchema.index({ request: 1, tutor: 1 }, { unique: true });
bidSchema.index({ expiresAt: 1, status: 1 });

export default mongoose.model<IBid>("Bid", bidSchema);
