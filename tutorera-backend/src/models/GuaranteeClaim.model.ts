import mongoose, { Schema, Document, Types } from "mongoose";

export interface IGuaranteeClaim extends Document {
  student: Types.ObjectId;
  booking: Types.ObjectId;
  tutor: Types.ObjectId;
  reason: string;
  details: string;
  status: "pending" | "approved" | "rejected";
  adminNote: string;
  createdAt: Date;
}

const guaranteeClaimSchema = new Schema<IGuaranteeClaim>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    tutor:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason:  { type: String, required: true, trim: true },
    details: { type: String, default: "", trim: true },
    status:  { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model<IGuaranteeClaim>("GuaranteeClaim", guaranteeClaimSchema);