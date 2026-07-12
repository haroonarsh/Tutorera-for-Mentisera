import mongoose, { Schema, Document } from "mongoose";

export interface IBroadcast extends Document {
  title: string;
  message: string;
  audience: "all" | "students" | "tutors" | "premium";
  sentCount: number;
  sentBy?: mongoose.Types.ObjectId;
  sentByName?: string;
  createdAt: Date;
}

const broadcastSchema = new Schema<IBroadcast>(
  {
    title:      { type: String, required: true, trim: true },
    message:    { type: String, required: true, trim: true },
    audience:   { type: String, enum: ["all", "students", "tutors", "premium"], required: true },
    sentCount:  { type: Number, default: 0 },
    sentBy:     { type: Schema.Types.ObjectId, ref: "User" },
    sentByName: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IBroadcast>("Broadcast", broadcastSchema);