import mongoose, { Document, Schema } from "mongoose";

export interface ICountry extends Document {
  geonameId?: number;
  iso2: string;
  iso3?: string;
  name: string;
  dialCode?: string;
  currencyCode?: string;
  currencySymbol?: string;
  flag?: string;                   // emoji flag
  timezones: string[];
  languages: string[];             // ISO 639-1 language codes
  defaultLanguage?: string;
  supportedLanguages?: string[];
  rtlSupported?: boolean;
  curricula?: string[];            // default curricula for this market
  launchStatus?: "live" | "beta" | "coming_soon" | "paused";
  enabled: boolean;
}

const countrySchema = new Schema<ICountry>({
  geonameId: { type: Number, unique: true, sparse: true },
  iso2: { type: String, required: true, uppercase: true, trim: true, unique: true, index: true },
  iso3: { type: String, uppercase: true, trim: true, sparse: true, index: true },
  name: { type: String, required: true, trim: true, index: true },
  dialCode: { type: String, trim: true },
  currencyCode: { type: String, uppercase: true, trim: true },
  currencySymbol: { type: String, trim: true },
  flag: { type: String, trim: true },
  timezones: [{ type: String, trim: true }],
  languages: [{ type: String, trim: true }],
  defaultLanguage: { type: String, lowercase: true, trim: true, default: "en" },
  supportedLanguages: [{ type: String, lowercase: true, trim: true }],
  rtlSupported: { type: Boolean, default: false },
  curricula: [{ type: String, trim: true }],
  launchStatus: { type: String, enum: ["live", "beta", "coming_soon", "paused"], default: "coming_soon" },
  enabled: { type: Boolean, default: false, index: true },
}, { timestamps: true });

countrySchema.index({ enabled: 1, name: 1 });
export default mongoose.model<ICountry>("Country", countrySchema);
