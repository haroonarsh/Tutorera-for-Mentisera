import mongoose, { Schema, Document, Types } from "mongoose";

export type StatusEvent =
  | "APPLICATION_CREATED"
  | "PROFILE_INFORMATION_UPDATED"
  | "EDUCATIONAL_DOCUMENTS_SUBMITTED"
  | "EDUCATIONAL_DOCUMENTS_VERIFIED"
  | "EDUCATIONAL_DOCUMENTS_REJECTED"
  | "CNIC_SUBMITTED"
  | "CNIC_VERIFIED"
  | "CNIC_REJECTED"
  | "DEMO_VIDEO_SUBMITTED"
  | "DEMO_VIDEO_APPROVED"
  | "DEMO_VIDEO_REJECTED"
  | "POLICE_VERIFICATION_SUBMITTED"
  | "POLICE_VERIFICATION_APPROVED"
  | "POLICE_VERIFICATION_REJECTED"
  | "APPLICATION_SUBMITTED"
  | "MARKETPLACE_ACTIVATED"
  | "MARKETPLACE_DEACTIVATED"
  | "HOME_TUITION_ACTIVATED"
  | "HOME_TUITION_DEACTIVATED"
  | "PROFILE_APPROVED"
  | "PROFILE_REJECTED"
  | "PROFILE_SUSPENDED"
  | "PROFILE_UNSUSPENDED"
  | "RE_VERIFICATION_REQUESTED"
  | "TOKEN_ROTATED";

export interface ITutorApplicationStatusHistory extends Document {
  tutor: Types.ObjectId;
  tutorProfile?: Types.ObjectId;
  actor: string;
  actorRole: "system" | "tutor" | "admin";
  event: StatusEvent;
  statusBefore?: string;
  statusAfter?: string;
  message: string;
  isPublic: boolean;
  createdAt: Date;
}

const tutorApplicationStatusHistorySchema = new Schema<ITutorApplicationStatusHistory>(
  {
    tutor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tutorProfile: { type: Schema.Types.ObjectId, ref: "TutorProfile", index: true },
    actor: { type: String, required: true, default: "System" },
    actorRole: { type: String, enum: ["system", "tutor", "admin"], default: "system" },
    event: { type: String, required: true, index: true },
    statusBefore: { type: String },
    statusAfter: { type: String },
    message: { type: String, required: true },
    isPublic: { type: Boolean, default: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

tutorApplicationStatusHistorySchema.index({ tutor: 1, createdAt: -1 });
tutorApplicationStatusHistorySchema.index({ tutor: 1, isPublic: 1, createdAt: -1 });

export default mongoose.model<ITutorApplicationStatusHistory>(
  "TutorApplicationStatusHistory",
  tutorApplicationStatusHistorySchema
);
