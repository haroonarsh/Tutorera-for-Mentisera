import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBooking extends Document {
  student: Types.ObjectId;
  tutor: Types.ObjectId;
  request: Types.ObjectId;
  bid: Types.ObjectId;
  amount: number;
  schedule: string;
  teachingMode: "online" | "in-person" | "both";
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  cancelReason?: string;
  createdAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tutor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    request: { type: Schema.Types.ObjectId, ref: "Request" },
    bid: { type: Schema.Types.ObjectId, ref: "Bid" },
    amount: { type: Number, required: true },
    schedule: { type: String, required: true },
    teachingMode: {
      type: String,
      enum: ["online", "in-person", "both"],
      default: "both",
    },
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
    },
    cancelReason: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IBooking>("Booking", bookingSchema);