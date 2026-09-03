import mongoose, { Document, Schema, Types } from "mongoose";

export type AbandonedJourneyType = "student_request" | "direct_booking";

export interface IAbandonedJourney extends Document {
  user: Types.ObjectId;
  type: AbandonedJourneyType;
  data: Record<string, unknown>;
  completedAt?: Date;
  remindersSent: number[];
  lastReminderSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const abandonedJourneySchema = new Schema<IAbandonedJourney>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["student_request", "direct_booking"], required: true, index: true },
    data: { type: Schema.Types.Mixed, default: {} },
    completedAt: { type: Date, index: true },
    remindersSent: [{ type: Number, enum: [1, 3, 7] }],
    lastReminderSentAt: { type: Date },
  },
  { timestamps: true }
);

abandonedJourneySchema.index({ user: 1, type: 1, completedAt: 1, updatedAt: -1 });
abandonedJourneySchema.index({ type: 1, completedAt: 1, updatedAt: 1 });

export default mongoose.model<IAbandonedJourney>("AbandonedJourney", abandonedJourneySchema);
