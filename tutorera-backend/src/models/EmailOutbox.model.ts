import mongoose, { Schema, Types } from "mongoose";

export interface IEmailOutbox {
  emailLog: Types.ObjectId; recipientEmail: string; subject: string; html: string;
  preheader?: string; category?: string; eventType: string; templateId: string;
  status: "queued" | "processing" | "sent" | "failed"; attempts: number;
  maxAttempts: number; nextAttemptAt: Date; lastError?: string; sentAt?: Date; expiresAt: Date;
}
const schema = new Schema<IEmailOutbox>({
  emailLog: { type: Schema.Types.ObjectId, ref: "EmailLog", required: true, unique: true },
  recipientEmail: { type: String, required: true, lowercase: true }, subject: { type: String, required: true }, html: { type: String, required: true },
  preheader: String, category: String, eventType: { type: String, required: true }, templateId: { type: String, required: true },
  status: { type: String, enum: ["queued", "processing", "sent", "failed"], default: "queued", index: true },
  attempts: { type: Number, default: 0 }, maxAttempts: { type: Number, default: 5 }, nextAttemptAt: { type: Date, default: Date.now, index: true },
  lastError: String, sentAt: Date, expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 86400000), expires: 0 },
}, { timestamps: true });
schema.index({ status: 1, nextAttemptAt: 1 });
export default mongoose.model<IEmailOutbox>("EmailOutbox", schema);
