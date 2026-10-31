// src/models/AdminApprovalRequest.model.ts
//
// Stores sensitive admin actions that require approval from a second authorised
// admin before they are executed. The Supervisor Agent creates these when an
// action requires human sign-off.

import mongoose, { Schema, Document } from "mongoose";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired";

export interface IAdminApprovalRequest extends Document {
  // Who requested it
  requestedByAdminId: string;
  requestedByAdminName: string;

  // What they want to do
  action: string;            // e.g. "tutor.suspend", "user.ban"
  targetEntity: string;      // e.g. "TutorProfile"
  targetId: string;
  targetName?: string;
  payload: Record<string, unknown>;
  rationale: string;

  // Review
  status: ApprovalStatus;
  reviewedByAdminId?: string;
  reviewedByAdminName?: string;
  reviewNote?: string;
  reviewedAt?: Date;

  // TTL — requests auto-expire after 48 h if not acted on
  expiresAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IAdminApprovalRequest>(
  {
    requestedByAdminId:   { type: String, required: true, index: true },
    requestedByAdminName: { type: String, required: true },
    action:       { type: String, required: true, index: true },
    targetEntity: { type: String, required: true },
    targetId:     { type: String, required: true },
    targetName:   { type: String },
    payload:      { type: Schema.Types.Mixed, default: {} },
    rationale:    { type: String, required: true },
    status:       { type: String, enum: ["pending", "approved", "rejected", "expired"], default: "pending", index: true },
    reviewedByAdminId:   { type: String },
    reviewedByAdminName: { type: String },
    reviewNote:   { type: String },
    reviewedAt:   { type: Date },
    expiresAt:    { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true }
);

schema.index({ status: 1, expiresAt: 1 });
schema.index({ requestedByAdminId: 1, status: 1 });

export default mongoose.model<IAdminApprovalRequest>("AdminApprovalRequest", schema);
