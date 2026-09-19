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
      // No default on `type` either. Mongoose applies schema-level path
      // defaults to a newly-created document on an upsert insert regardless
      // of what the update payload contains — so even with no `location`
      // key sent at all, `type: "Point"` was still being stamped onto the
      // new document, leaving a partial GeoJSON Point (type but no
      // coordinates) that the 2dsphere index rejects just as hard as the
      // earlier { type: "Point", coordinates: [] } shape did. Leaving both
      // subpaths default-free means `location` stays fully absent unless
      // explicitly and completely supplied — and 2dsphere indexes are
      // sparse by default, so a document with no location field is simply
      // excluded from the index rather than erroring.
      type: { type: String, enum: ["Point"] },
      // default: undefined is required here — Mongoose auto-defaults every
      // Array-type schema path to [] unless explicitly overridden, entirely
      // independent of the `type` field above. Without this, a document
      // created with no location data still ends up with
      // { coordinates: [] } (no `type` this time, but still an invalid,
      // incomplete GeoJSON shape) and the 2dsphere index rejects it the
      // same way.
      coordinates: { type: [Number], default: undefined },
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

// The onboarding controller writes via findOneAndUpdate({ upsert: true }),
// which is QUERY middleware, not document middleware — a pre("validate")
// hook (document middleware) never fires on this path and silently does
// nothing here. This hook strips an invalid/empty location out of the
// update payload itself before Mongo ever tries to build a 2dsphere index
// entry from it, whether the write creates a new document or updates one.
studentProfileSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate() as any;
  if (!update) return;
  if (update.location && (!Array.isArray(update.location.coordinates) || update.location.coordinates.length !== 2)) {
    delete update.location;
  }
});

export default mongoose.model<IStudentProfile>("StudentProfile", studentProfileSchema);