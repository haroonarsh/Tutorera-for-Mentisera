import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBooking extends Document {
  student: Types.ObjectId;
  tutor: Types.ObjectId;
  request: Types.ObjectId;
  bid: Types.ObjectId;
  amount: number;
  finalAgreedRate: number;
  pricingUnit: "hour" | "session" | "month" | "course";
  sessionCount: number;
  subtotal: number;
  studentFee: number;
  tutorFee: number;
  tax: number;
  studentTotal: number;
  tutorNet: number;
  feeConfig: Record<string, unknown>;
  platformFee: number;
  tutorPayout: number;
  schedule: string;
  teachingMode: "online" | "in-person" | "both";
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  cancelReason?: string;
  paymentStatus: "pending" | "received" | "confirmed" | "failed" | "refunded" | "partially_refunded" | "chargeback" | "disputed";
  paymentNote?: string;
  payoutStatus: "pending" | "approved" | "processing" | "paid" | "failed" | "held";
  payoutNote?: string;
  isFirstSession: boolean;
  createdAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tutor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    request: { type: Schema.Types.ObjectId, ref: "Request" },
    bid: { type: Schema.Types.ObjectId, ref: "Bid" },
    amount: { type: Number, required: true },
    finalAgreedRate: { type: Number, required: true },
    pricingUnit: { type: String, enum: ["hour", "session", "month", "course"], default: "hour" },
    sessionCount: { type: Number, default: 1, min: 1 },
    subtotal: { type: Number, required: true },
    studentFee: { type: Number, default: 0 },
    tutorFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    studentTotal: { type: Number, required: true },
    tutorNet: { type: Number, required: true },
    feeConfig: { type: Schema.Types.Mixed, required: true },
    platformFee: { type: Number, default: 0 },
    tutorPayout: { type: Number, default: 0 },
    schedule: { type: String, required: true },
    teachingMode: { type: String, enum: ["online", "in-person", "both"], default: "both" },
    status: { type: String, enum: ["upcoming", "ongoing", "completed", "cancelled"], default: "upcoming" },
    cancelReason: { type: String },
    paymentStatus: {
      type: String,
      enum: ["pending", "received", "confirmed", "failed", "refunded", "partially_refunded", "chargeback", "disputed"],
      default: "pending",
    },
    paymentNote: { type: String, default: "" },
    payoutStatus: {
      type: String,
      enum: ["pending", "approved", "processing", "paid", "failed", "held"],
      default: "pending",
    },
    payoutNote: { type: String, default: "" },
    isFirstSession: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IBooking>("Booking", bookingSchema);
