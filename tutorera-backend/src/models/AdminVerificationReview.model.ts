import mongoose, { Schema, Document, Types } from "mongoose";

export type VerificationComponent =
  | "cnic"
  | "degree"
  | "demoVideo"
  | "police";

export type ReviewDecision = "approved" | "rejected" | "escalated";

export interface IAdminVerificationReview extends Document {
  tutor: Types.ObjectId;
  tutorProfile: Types.ObjectId;
  admin: Types.ObjectId;
  component: VerificationComponent;
  decision: ReviewDecision;
  previousStatus?: string;
  newStatus: string;
  rejectionReason?: string;
  internalNotes?: string;
  evidenceChecked?: string[];
  reviewDurationMs?: number;
  createdAt: Date;
  updatedAt: Date;
}

const adminVerificationReviewSchema = new Schema<IAdminVerificationReview>(
  {
    tutor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tutorProfile: { type: Schema.Types.ObjectId, ref: "TutorProfile", required: true, index: true },
    admin: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    component: {
      type: String,
      enum: ["cnic", "degree", "demoVideo", "police"],
      required: true,
      index: true,
    },
    decision: {
      type: String,
      enum: ["approved", "rejected", "escalated"],
      required: true,
    },
    previousStatus: { type: String },
    newStatus: { type: String, required: true },
    rejectionReason: { type: String, trim: true },
    internalNotes: { type: String, trim: true },
    evidenceChecked: [{ type: String, trim: true }],
    reviewDurationMs: { type: Number, min: 0 },
  },
  { timestamps: true }
);

adminVerificationReviewSchema.index({ tutor: 1, component: 1, createdAt: -1 });
adminVerificationReviewSchema.index({ admin: 1, createdAt: -1 });
adminVerificationReviewSchema.index({ component: 1, decision: 1, createdAt: -1 });

export default mongoose.model<IAdminVerificationReview>(
  "AdminVerificationReview",
  adminVerificationReviewSchema
);