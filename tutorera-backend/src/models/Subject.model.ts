import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISubject extends Document {
  name: string;
  slug: string;
  description: string;
  category: string;
  level: string[];
  imageUrl?: string;
  isActive: boolean;
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
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: "" },
    category: { type: String, required: true },
    level: { type: [String], default: [] },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
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
SubjectSchema.index({ level: 1 });

export default mongoose.model<ISubject>("Subject", SubjectSchema);
