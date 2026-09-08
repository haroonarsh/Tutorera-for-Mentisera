import mongoose, { Document, Schema, Types } from "mongoose";

export interface IRegion extends Document {
  geonameId?: number;
  country: Types.ObjectId;
  countryCode: string;
  code?: string;
  name: string;
  enabled: boolean;
}

const regionSchema = new Schema<IRegion>({
  geonameId: { type: Number, unique: true, sparse: true },
  country: { type: Schema.Types.ObjectId, ref: "Country", required: true, index: true },
  countryCode: { type: String, required: true, uppercase: true, trim: true, index: true },
  code: { type: String, trim: true },
  name: { type: String, required: true, trim: true },
  enabled: { type: Boolean, default: true, index: true },
}, { timestamps: true });

regionSchema.index({ countryCode: 1, code: 1 }, { unique: true, sparse: true });
regionSchema.index({ countryCode: 1, name: 1 });
export default mongoose.model<IRegion>("Region", regionSchema);
