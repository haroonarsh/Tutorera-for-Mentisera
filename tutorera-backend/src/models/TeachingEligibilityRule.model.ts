import mongoose, { Document, Schema, Types } from "mongoose";
import { AcademicRecordStatus } from "./SubjectCategory.model";

export type TeachingEligibilityType = "direct" | "conditional";

export interface ITeachingEligibilityRule extends Document {
  discipline: Types.ObjectId;
  subject: Types.ObjectId;
  eligibilityType: TeachingEligibilityType;
  evidenceRequired: boolean;
  minimumDegreeLevel?: string;
  notes?: string;
  status: AcademicRecordStatus;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<ITeachingEligibilityRule>({
  discipline: { type: Schema.Types.ObjectId, ref: "AcademicDiscipline", required: true, index: true },
  subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
  eligibilityType: { type: String, enum: ["direct", "conditional"], required: true },
  evidenceRequired: { type: Boolean, default: false },
  minimumDegreeLevel: { type: String, trim: true },
  notes: { type: String, default: "" },
  status: { type: String, enum: ["active", "inactive", "archived"], default: "active", index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  archivedAt: { type: Date },
}, { timestamps: true });

schema.index({ discipline: 1, subject: 1 }, { unique: true });
schema.index({ discipline: 1, status: 1, eligibilityType: 1 });
schema.index({ subject: 1, status: 1 });

export default mongoose.model<ITeachingEligibilityRule>("TeachingEligibilityRule", schema);
