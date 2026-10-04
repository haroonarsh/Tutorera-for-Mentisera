import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISubject extends Document {
  /** Stable academic-framework identifier (e.g. SUB-MATH). */
  code?: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  /** Canonical category reference. `category` remains a legacy display snapshot. */
  categoryRef?: Types.ObjectId;
  level: string[];
  imageUrl?: string;
  isActive: boolean;
  /** Canonical lifecycle; retained alongside isActive while legacy consumers migrate. */
  status?: "active" | "inactive" | "archived";
  displayOrder?: number;
  archivedAt?: Date;
  sortOrder: number;
  metadata?: {
    difficultyLevel?: string;
    averagePricing?: number;
    demandLevel?: "low" | "medium" | "high";
  };
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const SubjectSchema = new Schema<ISubject>(
  {
    // Optional only during the additive migration. New academic-framework
    // writes require a code; legacy rows receive one from the reconciliation.
    code: { type: String, trim: true, uppercase: true, unique: true, sparse: true, index: true },
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: "" },
    category: { type: String, required: true },
    categoryRef: { type: Schema.Types.ObjectId, ref: "SubjectCategory", index: true },
    level: { type: [String], default: [] },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ["active", "inactive", "archived"], default: "active", index: true },
    displayOrder: { type: Number, default: 0 },
    archivedAt: { type: Date },
    sortOrder: { type: Number, default: 0 },
    metadata: {
      difficultyLevel: String,
      averagePricing: Number,
      demandLevel: { type: String, enum: ["low", "medium", "high"] },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: true }
);

SubjectSchema.index({ category: 1, isActive: 1 });
SubjectSchema.index({ categoryRef: 1, status: 1, displayOrder: 1 });
SubjectSchema.index({ level: 1 });

export default mongoose.model<ISubject>("Subject", SubjectSchema);
