import mongoose, { Schema, Document, Types } from "mongoose";

export interface IParentBookingApproval extends Document {
  parent: Types.ObjectId;
  student: Types.ObjectId;
  request: Types.ObjectId;
  bid: Types.ObjectId;
  amount: number;
  currency: string;
  status: "pending" | "approved" | "rejected";
  decidedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const parentBookingApprovalSchema = new Schema<IParentBookingApproval>({
  parent: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  student: { type: Schema.Types.ObjectId, ref: "User", required: true },
  request: { type: Schema.Types.ObjectId, ref: "Request", required: true },
  bid: { type: Schema.Types.ObjectId, ref: "Bid", required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, uppercase: true, trim: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  decidedAt: Date,
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

parentBookingApprovalSchema.index({ parent: 1, bid: 1 }, { unique: true });
parentBookingApprovalSchema.index({ parent: 1, status: 1, createdAt: -1 });

export default mongoose.model<IParentBookingApproval>("ParentBookingApproval", parentBookingApprovalSchema);
