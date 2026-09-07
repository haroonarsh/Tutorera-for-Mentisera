import mongoose, { Schema, Document, Types } from "mongoose";

export interface IChildProfile extends Document {
  studentUser: Types.ObjectId;
  name: string;
  level: string;
  subjects: string[];
  relationship: string;
}

export interface IParentProfile extends Document {
  user: Types.ObjectId;
  children: IChildProfile[];
  approvalRequiredForBookings: boolean;
  spendingLimitMonthly?: number;
  notificationsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const childProfileSchema = new Schema<IChildProfile>({
  studentUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true, trim: true },
  level: { type: String, trim: true, default: "" },
  subjects: [{ type: String, trim: true }],
  relationship: { type: String, trim: true, default: "child" },
});

const parentProfileSchema = new Schema<IParentProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    children: [childProfileSchema],
    approvalRequiredForBookings: { type: Boolean, default: true },
    spendingLimitMonthly: { type: Number, default: undefined },
    notificationsEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

parentProfileSchema.index({ user: 1 });

export default mongoose.model<IParentProfile>("ParentProfile", parentProfileSchema);
