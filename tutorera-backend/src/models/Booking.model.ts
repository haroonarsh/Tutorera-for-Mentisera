import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBooking extends Document {
  student: Types.ObjectId;
  tutor: Types.ObjectId;
  request: Types.ObjectId;
  bid: Types.ObjectId;
  amount: number;
  platformFee: number;
  tutorPayout: number;
  schedule: string;
  teachingMode: "online" | "in-person" | "both";
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  cancelReason?: string;
  paymentStatus: "pending" | "received" | "confirmed" | "refunded";
  paymentNote?: string;
  payoutStatus: "pending" | "paid";
  payoutNote?: string;
  createdAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tutor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    request: { type: Schema.Types.ObjectId, ref: "Request" },
    bid: { type: Schema.Types.ObjectId, ref: "Bid" },
    amount: { type: Number, required: true },
    platformFee: { type: Number, default: 0 },
    tutorPayout: { type: Number, default: 0 },
    schedule: { type: String, required: true },
    teachingMode: { type: String, enum: ["online", "in-person", "both"], default: "both" },
    status: { type: String, enum: ["upcoming", "ongoing", "completed", "cancelled"], default: "upcoming" },
    cancelReason: { type: String },
    paymentStatus: { type: String, enum: ["pending", "received", "confirmed", "refunded"], default: "pending" },
    paymentNote: { type: String },
    payoutStatus: { type: String, enum: ["pending", "paid"], default: "pending" },
    payoutNote: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IBooking>("Booking", bookingSchema);