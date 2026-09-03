import mongoose, { Schema, Document } from "mongoose";

export interface IApplicationCounter extends Document {
  year: number;
  seq: number;
}

const applicationCounterSchema = new Schema<IApplicationCounter>(
  {
    year: { type: Number, required: true, unique: true, index: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IApplicationCounter>("ApplicationCounter", applicationCounterSchema);
