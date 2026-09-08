import mongoose, { Document, Schema, Types } from "mongoose";

export interface IPayoutReport extends Document {
  reportId: string;
  tutor: Types.ObjectId;
  generatedBy?: Types.ObjectId;
  generatedByRole: "admin" | "tutor";
  periodStart: Date;
  periodEnd: Date;
  snapshot: Record<string, unknown>;
  digest: string;
  expiresAt: Date;
  createdAt: Date;
}

const payoutReportSchema = new Schema<IPayoutReport>({
  reportId: { type: String, required: true, unique: true, index: true },
  tutor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  generatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  generatedByRole: { type: String, enum: ["admin", "tutor"], required: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  snapshot: { type: Schema.Types.Mixed, required: true },
  digest: { type: String, required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

payoutReportSchema.index({ tutor: 1, createdAt: -1 });
payoutReportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IPayoutReport>("PayoutReport", payoutReportSchema);
