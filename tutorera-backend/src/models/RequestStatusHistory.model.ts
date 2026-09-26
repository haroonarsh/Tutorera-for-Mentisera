import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRequestStatusHistory extends Document {
  request: Types.ObjectId;
  fromStatus: string;
  toStatus: string;
  action: string;
  reason: string;
  actor?: Types.ObjectId;
  safetyCase?: Types.ObjectId;
  createdAt: Date;
}

const schema = new Schema<IRequestStatusHistory>({
  request: { type: Schema.Types.ObjectId, ref: "Request", required: true, index: true },
  fromStatus: { type: String, required: true },
  toStatus: { type: String, required: true },
  action: { type: String, required: true, index: true },
  reason: { type: String, required: true, maxlength: 1000 },
  actor: { type: Schema.Types.ObjectId, ref: "User" },
  safetyCase: { type: Schema.Types.ObjectId, ref: "SafetyCase" },
}, { timestamps: { createdAt: true, updatedAt: false } });
schema.index({ request: 1, createdAt: -1 });
export default mongoose.model<IRequestStatusHistory>("RequestStatusHistory", schema);
