import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITutorProfile extends Document {
  user: Types.ObjectId;
  bio: string;
  subjects: string[];
  levels: string[];
  hourlyRate: number;
  experience: number;
  education: {
    degree: string;
    institution: string;
    year: number;
  }[];
  availability: {
    day: string;
    slots: string[];
  }[];
  teachingMode: "online" | "in-person" | "both";
  city: string;
  averageRating: number;
  totalReviews: number;
  isVerified: boolean;
  verificationStatus: "pending" | "approved" | "rejected";
  verificationDocs: {
    cnic?: string;
    degree?: string;
    videoIntro?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const tutorProfileSchema = new Schema<ITutorProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    bio: {
      type: String,
      trim: true,
      default: "",
    },
    subjects: [{
      type: String,
      trim: true,
    }],
    levels: [{
      type: String,
      enum: ["Primary", "Middle", "Matric", "Intermediate", "O-Level", "A-Level", "University", "Other"],
    }],
    hourlyRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    experience: {
      type: Number,
      default: 0,
      min: 0,
    },
    education: [
      {
        degree: { type: String, trim: true },
        institution: { type: String, trim: true },
        year: { type: Number },
      },
    ],
    availability: [
      {
        day: {
          type: String,
          enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        },
        slots: [{ type: String }],
      },
    ],
    teachingMode: {
      type: String,
      enum: ["online", "in-person", "both"],
      default: "both",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    verificationDocs: {
      cnic: { type: String, default: "" },
      degree: { type: String, default: "" },
      videoIntro: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export default mongoose.model<ITutorProfile>("TutorProfile", tutorProfileSchema);