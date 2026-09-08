import mongoose, { Schema, Document, Types } from "mongoose";

export interface IParentLinkRequest extends Document {
  parent: Types.ObjectId;
  student: Types.ObjectId;
  codeHash: string;
  name: string;
  level: string;
  subjects: string[];
  relationship: string;
  status: "pending" | "confirmed" | "expired" | "cancelled";
  attempts: number;
  expiresAt: Date;
  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const parentLinkRequestSchema = new Schema<IParentLinkRequest>({
  parent: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  codeHash: { type: String, required: true, select: false },
  name: { type: String, required: true, trim: true },
  level: { type: String, trim: true, default: "" },
  subjects: [{ type: String, trim: true }],
  relationship: { type: String, enum: ["child", "sibling", "other"], default: "child" },
  status: { type: String, enum: ["pending", "confirmed", "expired", "cancelled"], default: "pending", index: true },
  attempts: { type: Number, default: 0, min: 0 },
  expiresAt: { type: Date, required: true },
  confirmedAt: { type: Date },
}, { timestamps: true });

parentLinkRequestSchema.index({ parent: 1, student: 1, status: 1 });
parentLinkRequestSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { status: "pending" } }
);

export default mongoose.model<IParentLinkRequest>("ParentLinkRequest", parentLinkRequestSchema);
