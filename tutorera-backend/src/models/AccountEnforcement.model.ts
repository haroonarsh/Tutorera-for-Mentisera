import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAccountEnforcement extends Document {
  user: Types.ObjectId;
  action: "suspended" | "banned" | "reinstated" | "deleted";
  reason: string;
  actor: Types.ObjectId;
  safetyCase?: Types.ObjectId;
  suspendedUntil?: Date;
  previousStatus: string;
  resultingStatus: string;
  createdAt: Date;
}

const accountEnforcementSchema = new Schema<IAccountEnforcement>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  action: { type: String, enum: ["suspended", "banned", "reinstated", "deleted"], required: true, index: true },
  reason: { type: String, required: true, trim: true, maxlength: 1000 },
  actor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  safetyCase: { type: Schema.Types.ObjectId, ref: "SafetyCase" },
  suspendedUntil: { type: Date },
  previousStatus: { type: String, required: true },
  resultingStatus: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

accountEnforcementSchema.index({ user: 1, createdAt: -1 });
export default mongoose.model<IAccountEnforcement>("AccountEnforcement", accountEnforcementSchema);
