import mongoose, { Schema, Document, Types } from "mongoose";
import { EDUCATION_LEVELS, normalizeEducationLevels, normalizeEducationLevel } from "../config/educationLevels";

export interface ITutorProfile extends Document {
  user: Types.ObjectId;

  // Step 1 — Personal & Global Location
  fullName: string;
  phone: string;
  countryCode: string;
  countryName: string;
  city: string;
  state?: string;
  zipCode?: string;
  cityId?: string;                   // slug from location dataset e.g. "pk-lhe"
  regionCode?: string;               // ISO 3166-2 region code e.g. "PK-PB"
  postalCode?: string;
  location?: {
    type: string;
    coordinates: number[];
  };
  timezone: string;
  country?: Types.ObjectId; region?: Types.ObjectId; cityRef?: Types.ObjectId; locality?: Types.ObjectId;
  nationalityCountryCode?: string; residenceCountryCode?: string; onlineCountryReach?: string[];
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
  sessionRate?: number;              // rate per session (optional override)
  monthlyRate?: number;              // rate per month (optional override)
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
  identityDocumentType?: string;
  identityDocumentSubtype?: string;
  safetyVerificationType?: string;

  // Status
  onboardingStep: number;
  onboardingComplete: boolean;
  verificationStatus: "pending" | "approved" | "rejected";
  rejectionReason: string;
  isVerified: boolean;
  agreementAcceptanceRequired?: boolean;
  agreementAcceptedAt?: Date;
  agreementVersion?: string;
  isTestAccount: boolean;

  // Per-component verification (Tutor Application Tracking)
  cnicVerificationStatus: "not_submitted" | "pending" | "approved" | "rejected";
  cnicRejectionReason: string;
  degreeVerificationStatus: "not_submitted" | "pending" | "approved" | "rejected";
  degreeRejectionReason: string;
  demoVideoStatus: "not_submitted" | "pending" | "approved" | "rejected";
  demoVideoRejectionReason: string;
  policeVerificationStatus: "not_required" | "not_submitted" | "pending" | "approved" | "rejected";
  policeRejectionReason: string;
  // "not_submitted" forever means either the tutor hasn't reached step 1
  // yet, or (grandfathering) they completed onboarding before this
  // requirement existed - the pre-save hook only requires this to be
  // "approved" for full verification when it's actually been submitted.
  avatarVerificationStatus: "not_submitted" | "pending" | "approved" | "rejected";
  avatarRejectionReason: string;
  cnicSubmittedAt: Date;
  degreeSubmittedAt: Date;
  demoVideoSubmittedAt: Date;
  policeSubmittedAt: Date;
  avatarSubmittedAt: Date;
  cnicReviewedAt: Date;
  degreeReviewedAt: Date;
  demoVideoReviewedAt: Date;
  policeReviewedAt: Date;
  avatarReviewedAt: Date;

  // Eligibility & lifecycle
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
  averageResponseMinutes: number;
  lastActiveAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

const tutorProfileSchema = new Schema<ITutorProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    // Step 1
    fullName: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    countryCode: { type: String, uppercase: true, trim: true },
    countryName: { type: String, trim: true },
    cityId: { type: String, trim: true, lowercase: true },
    regionCode: { type: String, uppercase: true, trim: true },
    postalCode: { type: String, trim: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number] },
    },
    country: { type: Schema.Types.ObjectId, ref: "Country", index: true },
    region: { type: Schema.Types.ObjectId, ref: "Region", index: true },
    cityRef: { type: Schema.Types.ObjectId, ref: "City", index: true },
    locality: { type: Schema.Types.ObjectId, ref: "Locality", index: true },
    nationalityCountryCode: { type: String, uppercase: true, trim: true },
    residenceCountryCode: { type: String, uppercase: true, trim: true },
    onlineCountryReach: [{ type: String, uppercase: true, trim: true }],
    city: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    zipCode: { type: String, trim: true, default: "" },
    timezone: { type: String, trim: true },
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
      trim: true,
    }],
    curricula: [{ type: String, trim: true }],

    // Step 4
    bio: { type: String, trim: true, default: "" },
    hourlyRate: { type: Number, default: 0 },
    currency: { type: String, uppercase: true, trim: true },
    sessionRate: { type: Number, min: 0 },
    monthlyRate: { type: Number, min: 0 },
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
    identityDocumentType: { type: String, trim: true, default: "identity_document" },
    identityDocumentSubtype: { type: String, trim: true, select: false },
    safetyVerificationType: { type: String, trim: true, default: "background_safety_verification" },

    // Status
    onboardingStep: { type: Number, default: 1 },
    onboardingComplete: { type: Boolean, default: false },
    verificationStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    rejectionReason: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    agreementAcceptanceRequired: { type: Boolean, default: false },
    agreementAcceptedAt: { type: Date },
    agreementVersion: { type: String, trim: true },
    // Kept on the profile as well as User so every public profile query can
    // exclude test/demo records without relying on a populated user document.
    isTestAccount: { type: Boolean, default: false, index: true },

    // Per-component verification
    cnicVerificationStatus: { type: String, enum: ["not_submitted", "pending", "approved", "rejected"], default: "not_submitted" },
    cnicRejectionReason: { type: String, default: "" },
    degreeVerificationStatus: { type: String, enum: ["not_submitted", "pending", "approved", "rejected"], default: "not_submitted" },
    degreeRejectionReason: { type: String, default: "" },
    demoVideoStatus: { type: String, enum: ["not_submitted", "pending", "approved", "rejected"], default: "not_submitted" },
    demoVideoRejectionReason: { type: String, default: "" },
    policeVerificationStatus: { type: String, enum: ["not_required", "not_submitted", "pending", "approved", "rejected"], default: "not_required" },
    policeRejectionReason: { type: String, default: "" },
    avatarVerificationStatus: { type: String, enum: ["not_submitted", "pending", "approved", "rejected"], default: "not_submitted" },
    avatarRejectionReason: { type: String, default: "" },
    cnicSubmittedAt: { type: Date },
    degreeSubmittedAt: { type: Date },
    demoVideoSubmittedAt: { type: Date },
    policeSubmittedAt: { type: Date },
    avatarSubmittedAt: { type: Date },
    cnicReviewedAt: { type: Date },
    degreeReviewedAt: { type: Date },
    demoVideoReviewedAt: { type: Date },
    policeReviewedAt: { type: Date },
    avatarReviewedAt: { type: Date },

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
    averageResponseMinutes: { type: Number, default: 0 },
    lastActiveAt: { type: Date },
  },
  { timestamps: true }
);

// Compound indexes for global marketplace queries
tutorProfileSchema.index({ location: "2dsphere" });
tutorProfileSchema.index({ countryCode: 1, isVerified: 1, teachingMode: 1 });
tutorProfileSchema.index({ countryCode: 1, cityId: 1, subjects: 1, isVerified: 1 });
tutorProfileSchema.index({ onlineCountryReach: 1, isVerified: 1, averageRating: -1 });
tutorProfileSchema.index({ verificationStatus: 1, onboardingComplete: 1, createdAt: -1 });

function policeIsRequired(profile: ITutorProfile): boolean {
  const inPerson = profile.teachingMode === "in-person" || profile.teachingMode === "both";
  const homeCountries = ["PK", "SA", "AE", "IN", "GB"];
  const country = profile.countryCode || "PK";
  return inPerson && homeCountries.includes(country);
}

// location.type defaults to "Point" whenever the location subdocument exists
// at all, even if coordinates was never populated (e.g. an online-only tutor
// who never went through geocoding). MongoDB's 2dsphere index on `location`
// then rejects EVERY save of that document with "Can't extract geo keys" -
// not just location updates - because it can't build an index entry from an
// incomplete GeoJSON Point. Strip an invalid location out so any save can
// proceed and self-heals previously-corrupted documents. This must run from
// pre("save"), not just pre("validate") - callers that intentionally skip
// validation (profile.save({ validateBeforeSave: false }), e.g. admin
// verification decisions that shouldn't revalidate legacy application data)
// still always run pre("save"), so putting this fix only in pre("validate")
// left every such save able to trip the same index error again.
function repairInvalidLocation(p: any) {
  if (p.location && (!Array.isArray(p.location.coordinates) || p.location.coordinates.length !== 2)) {
    p.location = undefined;
  }
}

tutorProfileSchema.pre("validate", function () {
  const p = this as any;
  if (p.isModified && p.isModified("levels") && Array.isArray(p.levels)) {
    p.levels = normalizeEducationLevels(p.levels) as any;
  }
  repairInvalidLocation(p);
});

tutorProfileSchema.pre("save", function () {
  const p = this as any;
  if (p.isModified && p.isModified("levels") && Array.isArray(p.levels)) {
    p.levels = normalizeEducationLevels(p.levels) as any;
  }
  repairInvalidLocation(p);
  // avatarVerificationStatus "not_submitted" means either a tutor who
  // hasn't reached onboarding step 1 yet, or (grandfathering) one who
  // completed onboarding before the mandatory-photo requirement existed -
  // only require approval here once a photo has actually been submitted,
  // so existing verified tutors are never retroactively downgraded.
  const allApproved =
    p.cnicVerificationStatus === "approved" &&
    p.degreeVerificationStatus === "approved" &&
    p.demoVideoStatus === "approved" &&
    (!policeIsRequired(p) || p.policeVerificationStatus === "approved") &&
    (p.avatarVerificationStatus === "not_submitted" || p.avatarVerificationStatus === "approved");

  if (allApproved) {
    p.verificationStatus = "approved";
    p.isVerified = true;
  } else if (p.verificationStatus !== "rejected") {
    p.verificationStatus = "pending";
    p.isVerified = false;
  } else {
    p.isVerified = false;
  }
});

export default mongoose.model<ITutorProfile>("TutorProfile", tutorProfileSchema);
