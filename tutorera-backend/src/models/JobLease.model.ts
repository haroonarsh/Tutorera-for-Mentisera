import mongoose, { Schema } from "mongoose";

interface IJobLease {
  _id: string;
  owner: string;
  leaseUntil: Date;
  updatedAt: Date;
}

const jobLeaseSchema = new Schema<IJobLease>({
  _id: { type: String, required: true },
  owner: { type: String, required: true },
  leaseUntil: { type: Date, required: true, index: true },
}, { timestamps: true });

export default mongoose.model<IJobLease>("JobLease", jobLeaseSchema);
