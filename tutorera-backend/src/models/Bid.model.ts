import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBid extends Document {
  request: Types.ObjectId;
  tutor: Types.ObjectId;
  amount: number;
  message: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
}

const bidSchema = new Schema<IBid>(
  {
    request: { type: Schema.Types.ObjectId, ref: "Request", required: true },
    tutor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0 },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IBid>("Bid", bidSchema);