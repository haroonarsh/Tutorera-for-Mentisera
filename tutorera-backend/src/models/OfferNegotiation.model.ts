import mongoose, { Schema, Document, Types } from "mongoose";

export interface IOfferNegotiation extends Document {
  offer: Types.ObjectId; senderUser: Types.ObjectId; senderRole: "student" | "tutor";
  amount: number; message?: string; sequenceNumber: number; expiresAt: Date;
  status: "active" | "superseded" | "accepted" | "declined" | "expired";
  flaggedForModeration: boolean; createdAt: Date;
}
const schema = new Schema<IOfferNegotiation>({
  offer: { type: Schema.Types.ObjectId, ref: "Bid", required: true, index: true },
  senderUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
  senderRole: { type: String, enum: ["student", "tutor"], required: true },
  amount: { type: Number, required: true, min: 1 }, message: { type: String, trim: true, maxlength: 500 },
  sequenceNumber: { type: Number, required: true, min: 1 }, expiresAt: { type: Date, required: true },
  status: { type: String, enum: ["active", "superseded", "accepted", "declined", "expired"], default: "active" },
  flaggedForModeration: { type: Boolean, default: false },
}, { timestamps: true });
schema.index({ offer: 1, sequenceNumber: 1 }, { unique: true });
export default mongoose.model<IOfferNegotiation>("OfferNegotiation", schema);
