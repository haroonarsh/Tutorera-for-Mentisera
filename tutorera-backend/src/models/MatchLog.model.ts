import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMatchLog extends Document {
  request: Types.ObjectId;
  student: Types.ObjectId;
  tutor: Types.ObjectId;
  score: number;
  tier: "excellent" | "strong" | "good" | "other";
  scoreBreakdown: Record<string, number>;
  reasons: string[];
  algorithmVersion: string;
  mode: "online" | "in-person" | "both";
  notificationTier?: 1 | 2 | 3;
  notificationSentAt?: Date;
  offerViewedAt?: Date;
  offerReceivedAt?: Date;
  offerAcceptedAt?: Date;
  bookingCompletedAt?: Date;
  feedbackScore?: number; // 1 to 5: "Was this tutor a good match?"
  feedbackComment?: string;
  feedbackTags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const matchLogSchema = new Schema<IMatchLog>(
  {
    request: { type: Schema.Types.ObjectId, ref: "Request", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tutor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    tier: { type: String, enum: ["excellent", "strong", "good", "other"], required: true },
    scoreBreakdown: { type: Schema.Types.Mixed, default: {} },
    reasons: [{ type: String }],
    algorithmVersion: { type: String, required: true, default: "RULE_V1" },
    mode: { type: String, enum: ["online", "in-person", "both"], required: true },
    notificationTier: { type: Number, enum: [1, 2, 3] },
    notificationSentAt: { type: Date },
    offerViewedAt: { type: Date },
    offerReceivedAt: { type: Date },
    offerAcceptedAt: { type: Date },
    bookingCompletedAt: { type: Date },
    feedbackScore: { type: Number, min: 1, max: 5 },
    feedbackComment: { type: String, trim: true },
    feedbackTags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

matchLogSchema.index({ request: 1, tutor: 1 }, { unique: true });
matchLogSchema.index({ score: -1, createdAt: -1 });
matchLogSchema.index({ tutor: 1, createdAt: -1 });

export default mongoose.model<IMatchLog>("MatchLog", matchLogSchema);
