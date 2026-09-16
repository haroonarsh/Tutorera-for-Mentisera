import mongoose, { Schema, Document, Types } from "mongoose";

export interface IStudentProfile extends Document {
  user: Types.ObjectId;
  fullName: string;
  phone: string;
  countryCode: string;
  countryName: string;
  city: string;
  cityId?: string;              // slug from location dataset e.g. "pk-lhe"
  regionCode?: string;          // ISO 3166-2 e.g. "PK-PB"
  postalCode?: string;
  location?: {
    type: string;
    coordinates: number[];
  };
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
  budgetRange: string;          // legacy freetext field
  budgetMin?: number;           // structured min budget (in user's currency)
  budgetMax?: number;           // structured max budget (in user's currency)
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
    budgetMin: { type: Number, min: 0 },
    budgetMax: { type: Number, min: 0 },
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

// Compound indexes for global marketplace queries
studentProfileSchema.index({ countryCode: 1, cityId: 1, onboardingComplete: 1 });
studentProfileSchema.index({ countryCode: 1, currency: 1, teachingModePreference: 1 });
studentProfileSchema.index({ user: 1 });
studentProfileSchema.index({ location: "2dsphere" });

// location.type defaults to "Point" whenever the location subdocument exists
// at all, even if coordinates was never populated. MongoDB's 2dsphere index
// then rejects EVERY save of that document with "Can't extract geo keys" -
// not just location updates - because it can't build an index entry from an
// incomplete GeoJSON Point. Strip an invalid location out before validation.
studentProfileSchema.pre("validate", function () {
  const p = this as any;
  if (p.location && (!Array.isArray(p.location.coordinates) || p.location.coordinates.length !== 2)) {
    p.location = undefined;
  }
});

export default mongoose.model<IStudentProfile>("StudentProfile", studentProfileSchema);
