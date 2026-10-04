import mongoose, { Document, Schema, Types } from "mongoose";

export type AcademicImportDataset = "categories" | "subjects" | "disciplines" | "eligibility-rules";
export type AcademicImportStatus = "dry_run" | "committed" | "failed";

export interface IAcademicImportJob extends Document {
  dataset: AcademicImportDataset;
  status: AcademicImportStatus;
  filename?: string;
  totalRows: number;
  validRows: number;
  createdCount: number;
  updatedCount: number;
  validationErrors: { row: number; field?: string; message: string }[];
  createdBy?: Types.ObjectId;
  committedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IAcademicImportJob>({
  dataset: { type: String, enum: ["categories", "subjects", "disciplines", "eligibility-rules"], required: true, index: true },
  status: { type: String, enum: ["dry_run", "committed", "failed"], required: true, index: true },
  filename: { type: String, trim: true }, totalRows: { type: Number, default: 0 }, validRows: { type: Number, default: 0 },
  createdCount: { type: Number, default: 0 }, updatedCount: { type: Number, default: 0 },
  validationErrors: [{ row: Number, field: String, message: String }],
  createdBy: { type: Schema.Types.ObjectId, ref: "User", index: true }, committedAt: Date,
}, { timestamps: true });
schema.index({ dataset: 1, createdAt: -1 });
export default mongoose.model<IAcademicImportJob>("AcademicImportJob", schema);
