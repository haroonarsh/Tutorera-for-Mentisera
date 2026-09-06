import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRequest extends Document {
  student: Types.ObjectId;
  subject: string;
  level: string;
  description: string;
  budget: number;
  maximumBudget?: number;
  pricingUnit: "hour" | "session" | "month" | "course";
  currency: string;
  allowCounterOffers: boolean;
  classGrade?: string; curriculum?: string; examType?: string; studentLevel?: string;
  learningObjectives?: string;
  countryCode?: string; countryName?: string; city?: string; timezone?: string;
  area?: string; travelRadiusKm?: number;
  isWorldwideEligible?: boolean;
  preferredTutorCountries?: string[];
  tutorGenderPreference?: "male" | "female" | "none";
  minimumQualification?: string; minimumExperience?: number; preferredLanguage?: string; preferredTutorRating?: number;
  preferredDays?: string[]; preferredStartTime?: string; sessionDurationMinutes?: number;
  sessionsPerWeek?: number; expectedStartDate?: Date;
  teachingMode: "online" | "in-person" | "both";
  schedule: string;
  status: "draft" | "open" | "published" | "receiving_offers" | "negotiating" | "offer_accepted" | "awaiting_payment" | "booked" | "in_progress" | "completed" | "closed" | "cancelled" | "expired" | "disputed" | "archived";
  publishedAt?: Date;
  expiresAt?: Date;
  expiredAt?: Date;
  extensionCount?: number;
  maxExtensions?: number;
  repostedFromRequestId?: Types.ObjectId;
  archivedAt?: Date;
  legalHold?: boolean;
  expiryWarningSentAt?: Date;
  day5InterventionSentAt?: Date;
  acceptedOffer?: Types.ObjectId;
  finalAgreedRate?: number;
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
      enum: ["Primary (Grades 1-5)", "Middle (Grades 6-8)", "Matric (9th & 10th)", "Intermediate / FSc", "O-Level (Cambridge / Edexcel)", "A-Level (Cambridge / Edexcel)", "IB (Middle Years / Diploma)", "University / Degree", "Test Preparation", "Other"],
    },
    description: { type: String, required: true, trim: true },
    budget: { type: Number, required: true, min: 0 },
    maximumBudget: { type: Number, min: 0, select: false },
    pricingUnit: { type: String, enum: ["hour", "session", "month", "course"], default: "hour" },
    currency: { type: String, trim: true, default: "PKR" },
    allowCounterOffers: { type: Boolean, default: true },
    classGrade: { type: String, trim: true }, curriculum: { type: String, trim: true }, examType: { type: String, trim: true }, studentLevel: { type: String, trim: true },
    learningObjectives: { type: String, trim: true }, 
    countryCode: { type: String, trim: true, default: "PK" },
    countryName: { type: String, trim: true, default: "Pakistan" },
    city: { type: String, trim: true },
    timezone: { type: String, trim: true, default: "Asia/Karachi" },
    area: { type: String, trim: true }, 
    travelRadiusKm: { type: Number, min: 0, max: 100 },
    isWorldwideEligible: { type: Boolean, default: true },
    preferredTutorCountries: [{ type: String, trim: true }],
    tutorGenderPreference: { type: String, enum: ["male", "female", "none"], default: "none" },
    minimumQualification: { type: String, trim: true }, minimumExperience: { type: Number, min: 0, max: 50 }, preferredLanguage: { type: String, trim: true }, preferredTutorRating: { type: Number, min: 0, max: 5 },
    preferredDays: [{ type: String }], preferredStartTime: { type: String }, sessionDurationMinutes: { type: Number, min: 15, max: 480 }, sessionsPerWeek: { type: Number, min: 1, max: 14 }, expectedStartDate: { type: Date },
    teachingMode: {
      type: String,
      enum: ["online", "in-person", "both"],
      default: "both",
    },
    schedule: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "open", "published", "receiving_offers", "negotiating", "offer_accepted", "awaiting_payment", "booked", "in_progress", "completed", "closed", "cancelled", "expired", "disputed", "archived"],
      default: "open",
    },
    publishedAt: { type: Date },
    expiresAt: { type: Date, index: true },
    expiredAt: { type: Date },
    extensionCount: { type: Number, default: 0, min: 0 },
    maxExtensions: { type: Number, default: 2, min: 0 },
    repostedFromRequestId: { type: Schema.Types.ObjectId, ref: "Request" },
    archivedAt: { type: Date },
    legalHold: { type: Boolean, default: false },
    expiryWarningSentAt: { type: Date },
    day5InterventionSentAt: { type: Date },
    acceptedOffer: { type: Schema.Types.ObjectId, ref: "Bid" },
    finalAgreedRate: { type: Number, min: 0 },
    targetTutor: { type: Schema.Types.ObjectId, ref: "User", default: null },
    isDirect: { type: Boolean, default: false }, 
    selectedDate: { type: String, default: "" },
    selectedStartTime: { type: String, default: "" },
    selectedEndTime: { type: String, default: "" },
  },
  { timestamps: true }
);

// High-performance compound indexes for marketplace freshness & candidate matching
requestSchema.index({ status: 1, expiresAt: 1 });
requestSchema.index({ student: 1, status: 1, createdAt: -1 });
requestSchema.index({ teachingMode: 1, countryCode: 1, status: 1, expiresAt: 1 });

export default mongoose.model<IRequest>("Request", requestSchema);
