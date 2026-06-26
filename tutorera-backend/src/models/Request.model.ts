import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRequest extends Document {
  student: Types.ObjectId;
  subject: string;
  level: string;
  description: string;
  budget: number;
  teachingMode: "online" | "in-person" | "both";
  city?: string;
  schedule: string;
  status: "open" | "closed" | "cancelled";
  targetTutor?: Types.ObjectId;       // set only for direct booking requests
  isDirect: boolean;                  // flags this as a direct booking, not open bidding
  selectedDate?: string;
  selectedStartTime?: string;
  selectedEndTime?: string;
  createdAt: Date;
  updatedAt: Date;
}

const requestSchema = new Schema<IRequest>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: { type: String, required: true, trim: true },
    level: {
      type: String,
      required: true,
      enum: ["Primary", "Middle", "Matric", "Intermediate", "O-Level", "A-Level", "University", "Other"],
    },
    description: { type: String, required: true, trim: true },
    budget: { type: Number, required: true, min: 0 },
    teachingMode: {
      type: String,
      enum: ["online", "in-person", "both"],
      default: "both",
    },
    city: { type: String, trim: true },
    schedule: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "closed", "cancelled"],
      default: "open",
    },
    targetTutor: { type: Schema.Types.ObjectId, ref: "User", default: null },
    isDirect: { type: Boolean, default: false }, 
    selectedDate: { type: String, default: "" },
    selectedStartTime: { type: String, default: "" },
    selectedEndTime: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model<IRequest>("Request", requestSchema);