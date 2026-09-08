import mongoose, { Schema, Document, Types } from "mongoose";

export interface IStudentProfile extends Document {
  user: Types.ObjectId;
  fullName: string;
  phone: string;
  countryCode: string;
  countryName: string;
  city: string;
  timezone: string;
  currency: string;
  country?: Types.ObjectId; region?: Types.ObjectId; cityRef?: Types.ObjectId; locality?: Types.ObjectId;
  preferredLanguage?: string; learningLanguages?: string[];
  gender: string;
  dateOfBirth: string;
  currentLevel: string;
  curriculum?: string;
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
    countryCode: { type: String, uppercase: true, trim: true },
    countryName: { type: String, trim: true },
    country: { type: Schema.Types.ObjectId, ref: "Country", index: true },
    region: { type: Schema.Types.ObjectId, ref: "Region", index: true },
    cityRef: { type: Schema.Types.ObjectId, ref: "City", index: true },
    locality: { type: Schema.Types.ObjectId, ref: "Locality", index: true },
    city: { type: String, trim: true, default: "" },
    timezone: { type: String, trim: true },
    currency: { type: String, uppercase: true, trim: true },
    preferredLanguage: { type: String, lowercase: true, trim: true, default: "en" },
    learningLanguages: [{ type: String, trim: true }],
    gender: { type: String, enum: ["male", "female", "other"], default: "male" },
    dateOfBirth: { type: String, default: "" },
    currentLevel: { type: String, default: "" },
    curriculum: { type: String, trim: true, default: "" },
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
