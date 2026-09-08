import mongoose, { Document, Schema, Types } from "mongoose";

export interface ILocality extends Document {
  geonameId?: number;
  country: Types.ObjectId;
  city: Types.ObjectId;
  countryCode: string;
  name: string;
  location?: { type: "Point"; coordinates: [number, number] };
  enabled: boolean;
}

const localitySchema = new Schema<ILocality>({
  geonameId: { type: Number, unique: true, sparse: true },
  country: { type: Schema.Types.ObjectId, ref: "Country", required: true, index: true },
  city: { type: Schema.Types.ObjectId, ref: "City", required: true, index: true },
  countryCode: { type: String, required: true, uppercase: true, trim: true, index: true },
  name: { type: String, required: true, trim: true },
  location: { type: { type: String, enum: ["Point"] }, coordinates: [{ type: Number }] },
  enabled: { type: Boolean, default: true, index: true },
}, { timestamps: true });

localitySchema.index({ city: 1, name: 1 });
localitySchema.index({ name: "text" });
localitySchema.index({ location: "2dsphere" }, { sparse: true });
export default mongoose.model<ILocality>("Locality", localitySchema);
