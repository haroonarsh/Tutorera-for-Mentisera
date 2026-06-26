import mongoose, { Schema, Document, Types } from "mongoose";

export interface IWeeklySlot {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  startTime: string;   // "17:00"
  endTime: string;     // "19:00"
}

export interface ITutorAvailability extends Document {
  tutor: Types.ObjectId;
  weeklySlots: IWeeklySlot[];
  blockedDates: Date[];
  createdAt: Date;
  updatedAt: Date;
}

const tutorAvailabilitySchema = new Schema<ITutorAvailability>(
  {
    tutor: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    weeklySlots: [{
      day: {
        type: String,
        enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        required: true,
      },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
    }],
    blockedDates: [{ type: Date }],
  },
  { timestamps: true }
);

export default mongoose.model<ITutorAvailability>("TutorAvailability", tutorAvailabilitySchema);