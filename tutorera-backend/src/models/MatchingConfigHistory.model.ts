import mongoose, { Schema, Document, Types } from "mongoose";
import { MatchingConfigData } from "../config/matchingConfig";

export interface IMatchingConfigHistory extends Document {
  snapshot: MatchingConfigData;
  revision: number;
  changeReason: string;
  changedBy?: Types.ObjectId;
  createdAt: Date;
}

const matchingConfigHistorySchema = new Schema<IMatchingConfigHistory>({
  snapshot: { type: Schema.Types.Mixed, required: true },
  revision: { type: Number, required: true },
  changeReason: { type: String, required: true, trim: true },
  changedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

matchingConfigHistorySchema.index({ createdAt: -1 });

export default mongoose.model<IMatchingConfigHistory>("MatchingConfigHistory", matchingConfigHistorySchema);
