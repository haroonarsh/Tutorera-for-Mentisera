import mongoose, { Document, Schema } from "mongoose";

export interface ICountry extends Document {
  geonameId?: number;
  iso2: string;
  iso3?: string;
  name: string;
  dialCode?: string;
  currencyCode?: string;
  currencySymbol?: string;
  timezones: string[];
  languages: string[];
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
  timezones: [{ type: String, trim: true }],
  languages: [{ type: String, trim: true }],
  enabled: { type: Boolean, default: false, index: true },
}, { timestamps: true });

countrySchema.index({ enabled: 1, name: 1 });
export default mongoose.model<ICountry>("Country", countrySchema);
