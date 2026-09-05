import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITutorProfile extends Document {
  user: Types.ObjectId;

  // Step 1 — Personal & Global Location
  fullName: string;
  phone: string;
  countryCode: string;
  countryName: string;
  city: string;
  timezone: string;
  gender: string;
  dateOfBirth: string;
  languages?: { language: string; proficiency: string }[];

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
  curricula?: string[];

  // Step 4 — Profile
  bio: string;
  hourlyRate: number;
  currency: string;
  teachingMode: "online" | "in-person" | "both";
  serviceAreas?: string[];
  travelRadiusKm?: number;
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

  // ── Per-component verification (Tutor Application Tracking) ──
  cnicVerificationStatus: "not_submitted" | "pending" | "approved" | "rejected";
  cnicRejectionReason: string;
  degreeVerificationStatus: "not_submitted" | "pending" | "approved" | "rejected";
  degreeRejectionReason: string;
  demoVideoStatus: "not_submitted" | "pending" | "approved" | "rejected";
  demoVideoRejectionReason: string;
  policeVerificationStatus: "not_required" | "not_submitted" | "pending" | "approved" | "rejected";
  policeRejectionReason: string;
  cnicSubmittedAt: Date;
  degreeSubmittedAt: Date;
  demoVideoSubmittedAt: Date;
  policeSubmittedAt: Date;
  cnicReviewedAt: Date;
  degreeReviewedAt: Date;
  demoVideoReviewedAt: Date;
  policeReviewedAt: Date;

  // ── Eligibility & lifecycle ──
  marketplaceEligible: boolean;
  marketplaceEligibleAt: Date;
  homeTuitionEligible: boolean;
  homeTuitionEligibleAt: Date;
  homeTuitionRequired: boolean;
  suspendedAt: Date;
  suspendedReason: string;
  reVerificationRequired: boolean;
  reVerificationReason: string;
  lastStatusChangeAt: Date;

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
    countryCode: { type: String, trim: true, default: "PK" },
    countryName: { type: String, trim: true, default: "Pakistan" },
    city: { type: String, trim: true, default: "" },
    timezone: { type: String, trim: true, default: "Asia/Karachi" },
    gender: { type: String, enum: ["male", "female", "other"], default: "male" },
    dateOfBirth: { type: String, default: "" },
    languages: [{
      language: { type: String, trim: true },
      proficiency: { type: String, enum: ["Native", "Fluent", "Professional", "Conversational"], default: "Fluent" }
    }],

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
    curricula: [{ type: String, trim: true }],

    // Step 4
    bio: { type: String, trim: true, default: "" },
    hourlyRate: { type: Number, default: 0 },
    currency: { type: String, trim: true, default: "PKR" },
    teachingMode: { type: String, enum: ["online", "in-person", "both"], default: "both" },
    serviceAreas: [{ type: String, trim: true }],
    travelRadiusKm: { type: Number, default: 10, min: 0, max: 100 },
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

    // Per-component verification
    cnicVerificationStatus: { type: String, enum: ["not_submitted", "pending", "approved", "rejected"], default: "not_submitted" },
    cnicRejectionReason: { type: String, default: "" },
    degreeVerificationStatus: { type: String, enum: ["not_submitted", "pending", "approved", "rejected"], default: "not_submitted" },
    degreeRejectionReason: { type: String, default: "" },
    demoVideoStatus: { type: String, enum: ["not_submitted", "pending", "approved", "rejected"], default: "not_submitted" },
    demoVideoRejectionReason: { type: String, default: "" },
    policeVerificationStatus: { type: String, enum: ["not_required", "not_submitted", "pending", "approved", "rejected"], default: "not_required" },
    policeRejectionReason: { type: String, default: "" },
    cnicSubmittedAt: { type: Date },
    degreeSubmittedAt: { type: Date },
    demoVideoSubmittedAt: { type: Date },
    policeSubmittedAt: { type: Date },
    cnicReviewedAt: { type: Date },
    degreeReviewedAt: { type: Date },
    demoVideoReviewedAt: { type: Date },
    policeReviewedAt: { type: Date },

    // Eligibility & lifecycle
    marketplaceEligible: { type: Boolean, default: false },
    marketplaceEligibleAt: { type: Date },
    homeTuitionEligible: { type: Boolean, default: false },
    homeTuitionEligibleAt: { type: Date },
    homeTuitionRequired: { type: Boolean, default: false },
    suspendedAt: { type: Date },
    suspendedReason: { type: String, default: "" },
    reVerificationRequired: { type: Boolean, default: false },
    reVerificationReason: { type: String, default: "" },
    lastStatusChangeAt: { type: Date },

    // Stats
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<ITutorProfile>("TutorProfile", tutorProfileSchema);