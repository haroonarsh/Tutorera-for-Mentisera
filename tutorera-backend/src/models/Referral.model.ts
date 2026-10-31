import mongoose, { Schema, Document, Types } from "mongoose";

export interface IReferral extends Document {
  referrer: Types.ObjectId;
  referred: Types.ObjectId;
  status: "pending" | "credited" | "reversed" | "fraud_hold";
  creditAmount: number;
  creditCurrency: string;
  milestoneIndex?: number;
  reversedAt?: Date;
  fraudFlag: boolean;
  fraudReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const referralSchema = new Schema<IReferral>(
  {
    referrer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    referred: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    status: {
      type: String,
      enum: ["pending", "credited", "reversed", "fraud_hold"],
      default: "pending",
    },
    creditAmount: { type: Number, default: 200 },
    creditCurrency: { type: String, uppercase: true, trim: true, default: "PKR" },
    milestoneIndex: { type: Number },
    reversedAt: { type: Date },
    fraudFlag: { type: Boolean, default: false },
    fraudReason: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IReferral>("Referral", referralSchema);
