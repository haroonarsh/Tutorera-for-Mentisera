import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICity extends Document {
  geonameId?: number;
  country: Types.ObjectId;
  region?: Types.ObjectId;
  countryCode: string;
  regionCode?: string;
  name: string;
  asciiName?: string;
  timezone?: string;
  population?: number;
  location?: { type: "Point"; coordinates: [number, number] };
  enabled: boolean;
}

const citySchema = new Schema<ICity>({
  geonameId: { type: Number, unique: true, sparse: true },
  country: { type: Schema.Types.ObjectId, ref: "Country", required: true, index: true },
  region: { type: Schema.Types.ObjectId, ref: "Region", index: true },
  countryCode: { type: String, required: true, uppercase: true, trim: true, index: true },
  regionCode: { type: String, trim: true },
  name: { type: String, required: true, trim: true },
  asciiName: { type: String, trim: true },
  timezone: { type: String, trim: true },
  population: { type: Number, min: 0, default: 0 },
  location: { type: { type: String, enum: ["Point"] }, coordinates: [{ type: Number }] },
  enabled: { type: Boolean, default: true, index: true },
}, { timestamps: true });

citySchema.index({ countryCode: 1, region: 1, name: 1 });
citySchema.index({ name: "text", asciiName: "text" });
citySchema.index({ location: "2dsphere" }, { sparse: true });
export default mongoose.model<ICity>("City", citySchema);
