import mongoose, { Document, Schema } from "mongoose";

export interface IScheduledJobLease extends Document {
  name: string;
  holderId: string;
  leaseExpiresAt: Date;
  lastStartedAt?: Date;
  lastCompletedAt?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const scheduledJobLeaseSchema = new Schema<IScheduledJobLease>({
  name: { type: String, required: true, unique: true, trim: true },
  holderId: { type: String, required: true, trim: true },
  leaseExpiresAt: { type: Date, required: true, index: true },
  lastStartedAt: { type: Date },
  lastCompletedAt: { type: Date },
  lastError: { type: String, maxlength: 2000 },
}, { timestamps: true });

export default mongoose.model<IScheduledJobLease>("ScheduledJobLease", scheduledJobLeaseSchema);
