// src/models/SafetyCase.model.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISafetyCase extends Document {
  caseId: string;
  reporter?: Types.ObjectId;
  reportedUser: Types.ObjectId;
  booking?: Types.ObjectId;
  request?: Types.ObjectId;
  conversation?: Types.ObjectId;
  category:
    | "identity_fraud"
    | "document_fraud"
    | "payment_fraud"
    | "harassment"
    | "unsafe_conduct"
    | "home_tuition_incident"
    | "student_protection"
    | "tutor_misconduct"
    | "student_misconduct"
    | "off_platform_payment"
    | "spam"
    | "fake_review";
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "under_investigation" | "action_taken" | "resolved" | "dismissed";
  evidence: {
    type: string;
    url?: string;
    note?: string;
    submittedAt: Date;
  }[];
  assignedOfficer?: Types.ObjectId;
  actionTaken?: "warning_issued" | "account_suspended" | "account_banned" | "refund_processed" | "none";
  internalNotes: {
    author: Types.ObjectId;
    text: string;
    createdAt: Date;
  }[];
  resolutionSummary?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const safetyCaseSchema = new Schema<ISafetyCase>(
  {
    caseId: { type: String, unique: true, required: true, index: true },
    reporter: { type: Schema.Types.ObjectId, ref: "User" },
    reportedUser: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    booking: { type: Schema.Types.ObjectId, ref: "Booking" },
    request: { type: Schema.Types.ObjectId, ref: "Request" },
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation" },
    category: {
      type: String,
      enum: [
        "identity_fraud",
        "document_fraud",
        "payment_fraud",
        "harassment",
        "unsafe_conduct",
        "home_tuition_incident",
        "student_protection",
        "tutor_misconduct",
        "student_misconduct",
        "off_platform_payment",
        "spam",
        "fake_review",
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "under_investigation", "action_taken", "resolved", "dismissed"],
      default: "open",
      index: true,
    },
    evidence: [
      {
        type: { type: String, default: "message" },
        url: { type: String },
        note: { type: String },
        submittedAt: { type: Date, default: Date.now },
      },
    ],
    assignedOfficer: { type: Schema.Types.ObjectId, ref: "User" },
    actionTaken: {
      type: String,
      enum: ["warning_issued", "account_suspended", "account_banned", "refund_processed", "none"],
      default: "none",
    },
    internalNotes: [
      {
        author: { type: Schema.Types.ObjectId, ref: "User", required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    resolutionSummary: { type: String },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<ISafetyCase>("SafetyCase", safetyCaseSchema);
