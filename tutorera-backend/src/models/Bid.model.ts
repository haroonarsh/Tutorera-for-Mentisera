import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBid extends Document {
  request: Types.ObjectId;
  tutor: Types.ObjectId;
  amount: number;
  message: string;
  status: "pending" | "accepted" | "rejected";
  isDirect: boolean;
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
    isDirect: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One bid per tutor per request — backs up the application-level check in placeBid,
// so a race condition (two simultaneous bid requests) can't create duplicates.
bidSchema.index({ request: 1, tutor: 1 }, { unique: true });

export default mongoose.model<IBid>("Bid", bidSchema);