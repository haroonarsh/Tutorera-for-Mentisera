import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRecurringBooking extends Document {
  student: Types.ObjectId;
  tutor: Types.ObjectId;
  subject: string;
  plan: Types.ObjectId;
  planType: "weekly" | "twice_weekly" | "package_4" | "package_8" | "monthly";
  sessionsRemaining: number;
  sessionsCompleted: number;
  sessionsUsed: number[];
  dayOfWeek?: number;
  timeOfDay?: string;
  startDate: Date;
  nextBillingDate?: Date;
  endDate?: Date;
  status: "active" | "paused" | "completed" | "cancelled";
  totalPaid: number;
  createdAt: Date;
  updatedAt: Date;
}

const recurringBookingSchema = new Schema<IRecurringBooking>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tutor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subject: { type: String, required: true, trim: true },
    plan: { type: Schema.Types.ObjectId, ref: "RecurringPlan", required: true },
    planType: {
      type: String,
      enum: ["weekly", "twice_weekly", "package_4", "package_8", "monthly"],
      required: true,
    },
    sessionsRemaining: { type: Number, required: true, min: 0 },
    sessionsCompleted: { type: Number, default: 0, min: 0 },
    sessionsUsed: [{ type: Number }],
    dayOfWeek: { type: Number, min: 0, max: 6 },
    timeOfDay: { type: String, trim: true, default: "" },
    startDate: { type: Date, required: true, default: Date.now },
    nextBillingDate: { type: Date },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ["active", "paused", "completed", "cancelled"],
      default: "active",
      index: true,
    },
    totalPaid: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

recurringBookingSchema.index({ student: 1, tutor: 1, status: 1 });
recurringBookingSchema.index({ nextBillingDate: 1 });

export default mongoose.model<IRecurringBooking>("RecurringBooking", recurringBookingSchema);
