import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITutorProfile extends Document {
  user: Types.ObjectId;

  // Step 1 — Personal
  fullName: string;
  phone: string;
  city: string;
  gender: string;
  dateOfBirth: string;

  // Step 2 — Education
  education: {
    degree: string;
    institution: string;
    year: number;
    degreeDoc: string;
    degreeDocPublicId: string;
  }[];

  // Step 3 — Experience
  experience: number;
  previousInstitutions: string[];
  subjects: string[];
  levels: string[];

  // Step 4 — Profile
  bio: string;
  hourlyRate: number;
  teachingMode: "online" | "in-person" | "both";
  availability: {
    day: string;
    slots: string[];
  }[];

  // Step 5 — Verification
  cnicFront: string;
  cnicFrontPublicId: string;
  cnicBack: string;
  cnicBackPublicId: string;
  videoIntro: string;
  videoIntroPublicId: string;
  policeCertificate: string;
  policeCertificatePublicId: string;

  // Status
  onboardingStep: number;
  onboardingComplete: boolean;
  verificationStatus: "pending" | "approved" | "rejected";
  rejectionReason: string;
  isVerified: boolean;

  // Stats
  averageRating: number;
  totalReviews: number;

  createdAt: Date;
  updatedAt: Date;
}

const tutorProfileSchema = new Schema<ITutorProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    // Step 1
    fullName: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    gender: { type: String, enum: ["male", "female", "other"], default: "male" },
    dateOfBirth: { type: String, default: "" },

    // Step 2
    education: [{
      degree: { type: String, trim: true },
      institution: { type: String, trim: true },
      year: { type: Number },
      degreeDoc: { type: String, default: "" },
      degreeDocPublicId: { type: String, default: "" },
    }],

    // Step 3
    experience: { type: Number, default: 0 },
    previousInstitutions: [{ type: String, trim: true }],
    subjects: [{ type: String, trim: true }],
    levels: [{
      type: String,
      enum: ["Primary", "Middle", "Matric", "Intermediate", "O-Level", "A-Level", "University", "Other"],
    }],

    // Step 4
    bio: { type: String, trim: true, default: "" },
    hourlyRate: { type: Number, default: 0 },
    teachingMode: { type: String, enum: ["online", "in-person", "both"], default: "both" },
    availability: [{
      day: { type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
      slots: [{ type: String }],
    }],

    // Step 5
    cnicFront: { type: String, default: "" },
    cnicFrontPublicId: { type: String, default: "" },
    cnicBack: { type: String, default: "" },
    cnicBackPublicId: { type: String, default: "" },
    videoIntro: { type: String, default: "" },
    videoIntroPublicId: { type: String, default: "" },
    policeCertificate: { type: String, default: "" },
    policeCertificatePublicId: { type: String, default: "" },

    // Status
    onboardingStep: { type: Number, default: 1 },
    onboardingComplete: { type: Boolean, default: false },
    verificationStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    rejectionReason: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },

    // Stats
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<ITutorProfile>("TutorProfile", tutorProfileSchema);