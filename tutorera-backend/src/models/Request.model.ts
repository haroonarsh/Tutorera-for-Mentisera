import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRequest extends Document {
  student: Types.ObjectId;
  subject: string;
  level: string;
  description: string;
  budget: number;
  maximumBudget?: number;
  pricingUnit: "hour" | "session" | "month" | "course";
  allowCounterOffers: boolean;
  classGrade?: string; curriculum?: string; examType?: string; studentLevel?: string;
  learningObjectives?: string;
  area?: string; travelRadiusKm?: number;
  tutorGenderPreference?: "male" | "female" | "none";
  minimumQualification?: string; minimumExperience?: number; preferredLanguage?: string; preferredTutorRating?: number;
  preferredDays?: string[]; preferredStartTime?: string; sessionDurationMinutes?: number;
  sessionsPerWeek?: number; expectedStartDate?: Date;
  teachingMode: "online" | "in-person" | "both";
  city?: string;
  schedule: string;
  status: "draft" | "open" | "published" | "receiving_offers" | "negotiating" | "offer_accepted" | "awaiting_payment" | "booked" | "in_progress" | "completed" | "closed" | "cancelled" | "expired" | "disputed" | "archived";
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
      enum: ["Primary", "Middle", "Matric", "Intermediate", "O-Level", "A-Level", "University", "Other"],
    },
    description: { type: String, required: true, trim: true },
    budget: { type: Number, required: true, min: 0 },
    maximumBudget: { type: Number, min: 0, select: false },
    pricingUnit: { type: String, enum: ["hour", "session", "month", "course"], default: "hour" },
    allowCounterOffers: { type: Boolean, default: true },
    classGrade: { type: String, trim: true }, curriculum: { type: String, trim: true }, examType: { type: String, trim: true }, studentLevel: { type: String, trim: true },
    learningObjectives: { type: String, trim: true }, area: { type: String, trim: true }, travelRadiusKm: { type: Number, min: 0, max: 100 },
    tutorGenderPreference: { type: String, enum: ["male", "female", "none"], default: "none" },
    minimumQualification: { type: String, trim: true }, minimumExperience: { type: Number, min: 0, max: 50 }, preferredLanguage: { type: String, trim: true }, preferredTutorRating: { type: Number, min: 0, max: 5 },
    preferredDays: [{ type: String }], preferredStartTime: { type: String }, sessionDurationMinutes: { type: Number, min: 15, max: 480 }, sessionsPerWeek: { type: Number, min: 1, max: 14 }, expectedStartDate: { type: Date },
    teachingMode: {
      type: String,
      enum: ["online", "in-person", "both"],
      default: "both",
    },
    city: { type: String, trim: true },
    schedule: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "open", "published", "receiving_offers", "negotiating", "offer_accepted", "awaiting_payment", "booked", "in_progress", "completed", "closed", "cancelled", "expired", "disputed", "archived"],
      default: "open",
    },
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

export default mongoose.model<IRequest>("Request", requestSchema);
