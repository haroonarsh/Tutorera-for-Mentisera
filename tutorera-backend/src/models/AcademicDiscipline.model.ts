import mongoose, { Document, Schema, Types } from "mongoose";
import { AcademicRecordStatus } from "./SubjectCategory.model";

export interface IAcademicDiscipline extends Document {
  code: string;
  name: string;
  slug: string;
  description?: string;
  status: AcademicRecordStatus;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IAcademicDiscipline>({
  code: { type: String, required: true, trim: true, uppercase: true, unique: true, index: true },
  name: { type: String, required: true, trim: true, unique: true },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
  description: { type: String, default: "" },
  status: { type: String, enum: ["active", "inactive", "archived"], default: "active", index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  archivedAt: { type: Date },
}, { timestamps: true });

schema.index({ status: 1, name: 1 });

export default mongoose.model<IAcademicDiscipline>("AcademicDiscipline", schema);
