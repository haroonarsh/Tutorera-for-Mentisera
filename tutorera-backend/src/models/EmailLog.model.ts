import mongoose, { Document, Schema, Types } from "mongoose";

export type EmailLogStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "opened"
  | "bounced"
  | "failed";

export interface IEmailLog extends Document {
  user?: Types.ObjectId;
  eventType: string;
  templateId: string;
  recipientEmail: string;
  subject: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  providerMessageId?: string;
  status: EmailLogStatus;
  queuedAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  failedAt?: Date;
  bounceReason?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const emailLogSchema = new Schema<IEmailLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    eventType: { type: String, required: true, trim: true, index: true },
    templateId: { type: String, required: true, trim: true, index: true },
    recipientEmail: { type: String, required: true, trim: true, lowercase: true, index: true },
    subject: { type: String, required: true, trim: true },
    relatedEntityType: { type: String, trim: true, index: true },
    relatedEntityId: { type: String, trim: true, index: true },
    providerMessageId: { type: String, trim: true, index: true },
    status: {
      type: String,
      enum: ["queued", "sent", "delivered", "opened", "bounced", "failed"],
      default: "queued",
      index: true,
    },
    queuedAt: { type: Date, default: Date.now, index: true },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
    openedAt: { type: Date },
    failedAt: { type: Date },
    bounceReason: { type: String, trim: true },
    retryCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

emailLogSchema.index({ createdAt: -1 });
emailLogSchema.index({ status: 1, createdAt: -1 });
emailLogSchema.index({ eventType: 1, createdAt: -1 });
emailLogSchema.index({ relatedEntityType: 1, relatedEntityId: 1 });

export default mongoose.model<IEmailLog>("EmailLog", emailLogSchema);
