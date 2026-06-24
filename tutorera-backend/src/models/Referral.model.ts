import mongoose, { Schema, Document, Types } from "mongoose";

export interface IReferral extends Document {
  referrer: Types.ObjectId;     // user who shared the code
  referred: Types.ObjectId;     // user who signed up with the code
  status: "pending" | "credited";  // pending until referred user completes first booking
  creditAmount: number;         // PKR amount credited to referrer
  createdAt: Date;
}

const referralSchema = new Schema<IReferral>(
  {
    referrer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    referred: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "credited"], default: "pending" },
    creditAmount: { type: Number, default: 200 },  // Rs. 200 default
  },
  { timestamps: true }
);

export default mongoose.model<IReferral>("Referral", referralSchema);