import mongoose, { Schema, Document, Types } from "mongoose";

export interface IStudentProfile extends Document {
  user: Types.ObjectId;
  fullName: string;
  phone: string;
  city: string;
  gender: string;
  dateOfBirth: string;
  currentLevel: string;
  institution: string;
  subjectsNeeded: string[];
  budgetRange: string;
  teachingModePreference: "online" | "in-person" | "both";
  onboardingComplete: boolean;
  favouriteTutors: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const studentProfileSchema = new Schema<IStudentProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    fullName: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    gender: { type: String, enum: ["male", "female", "other"], default: "male" },
    dateOfBirth: { type: String, default: "" },
    currentLevel: { type: String, default: "" },
    institution: { type: String, trim: true, default: "" },
    subjectsNeeded: [{ type: String, trim: true }],
    budgetRange: { type: String, default: "" },
    teachingModePreference: {
      type: String,
      enum: ["online", "in-person", "both"],
      default: "both",
    },
    onboardingComplete: { type: Boolean, default: false },
    favouriteTutors: [{ type: Schema.Types.ObjectId, ref: "TutorProfile", default: [] }],
  },
  { timestamps: true }
);

export default mongoose.model<IStudentProfile>("StudentProfile", studentProfileSchema);