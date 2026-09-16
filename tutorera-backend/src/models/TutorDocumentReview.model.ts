import mongoose, { Schema, Document, Types } from "mongoose";

export type VerificationComponent =
  | "cnic"
  | "degree"
  | "demoVideo"
  | "police";

export type QueueStatus = "pending" | "in_review" | "approved" | "rejected" | "escalated";

export interface ITutorDocumentReview extends Document {
  tutor: Types.ObjectId;
  tutorProfile: Types.ObjectId;
  component: VerificationComponent;
  status: QueueStatus;
  priority: number;
  slaHours: number;
  slaDeadline: Date;
  assignedTo?: Types.ObjectId;
  assignedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  rejectionReason?: string;
  adminNotes?: string;
  autoEscalated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const tutorDocumentReviewSchema = new Schema<ITutorDocumentReview>(
  {
    tutor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tutorProfile: { type: Schema.Types.ObjectId, ref: "TutorProfile", required: true, index: true },
    component: {
      type: String,
      enum: ["cnic", "degree", "demoVideo", "police"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "in_review", "approved", "rejected", "escalated"],
      default: "pending",
      index: true,
    },
    priority: { type: Number, default: 0, min: 0, max: 100, index: true },
    slaHours: { type: Number, required: true, min: 1, max: 168 },
    slaDeadline: { type: Date, required: true, index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", index: true },
    assignedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    rejectionReason: { type: String, trim: true },
    adminNotes: { type: String, trim: true },
    autoEscalated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

tutorDocumentReviewSchema.index({ status: 1, priority: -1, createdAt: 1 });
tutorDocumentReviewSchema.index({ assignedTo: 1, status: 1 });
tutorDocumentReviewSchema.index({ tutor: 1, component: 1 }, { unique: true });

export default mongoose.model<ITutorDocumentReview>(
  "TutorDocumentReview",
  tutorDocumentReviewSchema
);
