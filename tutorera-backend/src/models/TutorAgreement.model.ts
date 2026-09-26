import mongoose, { Document, Schema, Types } from "mongoose";

export interface ITutorAgreement extends Document {
  tutor: Types.ObjectId;
  tutorProfile: Types.ObjectId;
  version: string;
  approvedHourlyRate: number;
  currency: string;
  status: "active" | "superseded";
  approvedBy?: Types.ObjectId;
  approvedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const tutorAgreementSchema = new Schema<ITutorAgreement>({
  tutor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  tutorProfile: { type: Schema.Types.ObjectId, ref: "TutorProfile", required: true, index: true },
  version: { type: String, required: true, default: "tutor-marketplace-v1" },
  approvedHourlyRate: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, uppercase: true, trim: true },
  status: { type: String, enum: ["active", "superseded"], default: "active", index: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  approvedAt: { type: Date, required: true, default: Date.now },
}, { timestamps: true });

tutorAgreementSchema.index({ tutor: 1, status: 1, approvedAt: -1 });

export default mongoose.model<ITutorAgreement>("TutorAgreement", tutorAgreementSchema);
