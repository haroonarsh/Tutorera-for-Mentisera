import mongoose, { Schema, Document, Types } from "mongoose";

export type RefundReason =
  | "tutor_cancelled"
  | "session_not_delivered"
  | "quality_issue"
  | "scheduling_conflict"
  | "duplicate_charge"
  | "other";

export interface IRefundRequest extends Document {
  student: Types.ObjectId;
  booking: Types.ObjectId;
  tutor: Types.ObjectId;
  amount: number;
  reason: RefundReason;
  details: string;
  status: "pending" | "approved" | "rejected" | "processed";
  adminNote: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const refundRequestSchema = new Schema<IRefundRequest>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    tutor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    reason: {
      type: String,
      enum: ["tutor_cancelled", "session_not_delivered", "quality_issue", "scheduling_conflict", "duplicate_charge", "other"],
      required: true,
    },
    details: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected", "processed"], default: "pending" },
    adminNote: { type: String, default: "" },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

refundRequestSchema.index({ student: 1, createdAt: -1 });
refundRequestSchema.index({ status: 1, createdAt: -1 });
refundRequestSchema.index({ booking: 1 }, { unique: true });

export default mongoose.model<IRefundRequest>("RefundRequest", refundRequestSchema);
