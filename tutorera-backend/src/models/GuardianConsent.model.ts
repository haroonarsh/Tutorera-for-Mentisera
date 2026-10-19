import mongoose, { Schema, Document, Types } from "mongoose";

export interface IGuardianConsent extends Document {
  student: Types.ObjectId;
  guardianEmail: string;
  guardianName: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  resendCount: number;
  lastSentAt: Date;
  status: "pending" | "verified" | "expired";
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  createdAt: Date;
}

const guardianConsentSchema = new Schema<IGuardianConsent>({
  student: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  guardianEmail: { type: String, lowercase: true, trim: true, required: true },
  guardianName: { type: String, trim: true, required: true },
  codeHash: { type: String, required: true, select: false },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  resendCount: { type: Number, default: 0 },
  lastSentAt: { type: Date, required: true },
  status: { type: String, enum: ["pending", "verified", "expired"], default: "pending", index: true },
  verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
  verifiedAt: Date,
}, { timestamps: true });
guardianConsentSchema.index({ guardianEmail: 1, status: 1, expiresAt: 1 });
export default mongoose.model<IGuardianConsent>("GuardianConsent", guardianConsentSchema);
