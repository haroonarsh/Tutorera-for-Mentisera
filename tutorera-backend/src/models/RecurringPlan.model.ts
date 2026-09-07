import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRecurringPlan extends Document {
  name: string;
  type: "weekly" | "twice_weekly" | "package_4" | "package_8" | "monthly";
  sessionCount: number;
  durationWeeks: number;
  pricePerSession: number;
  totalPrice: number;
  discountPercent: number;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const recurringPlanSchema = new Schema<IRecurringPlan>(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["weekly", "twice_weekly", "package_4", "package_8", "monthly"],
      required: true,
      unique: true,
    },
    sessionCount: { type: Number, required: true, min: 1 },
    durationWeeks: { type: Number, required: true, min: 1 },
    pricePerSession: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

recurringPlanSchema.index({ type: 1, isActive: 1 });

export default mongoose.model<IRecurringPlan>("RecurringPlan", recurringPlanSchema);
