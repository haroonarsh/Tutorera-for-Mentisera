import mongoose, { Schema, Document, Types } from "mongoose";

export interface IStudentTutorRelationship extends Document {
  student: Types.ObjectId;
  tutor: Types.ObjectId;
  subject: string;
  firstBooking: Types.ObjectId;
  lastBooking: Types.ObjectId;
  completedBookings: number;
  repeatBookingCount: number;
  relationshipStatus: "active" | "paused" | "ended";
  lastSessionAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const studentTutorRelationshipSchema = new Schema<IStudentTutorRelationship>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tutor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subject: { type: String, required: true, trim: true, index: true },
    firstBooking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    lastBooking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    completedBookings: { type: Number, default: 0, min: 0 },
    repeatBookingCount: { type: Number, default: 0, min: 0 },
    relationshipStatus: { type: String, enum: ["active", "paused", "ended"], default: "active" },
    lastSessionAt: { type: Date },
  },
  { timestamps: true }
);

studentTutorRelationshipSchema.index({ student: 1, tutor: 1, subject: 1 }, { unique: true });
studentTutorRelationshipSchema.index({ relationshipStatus: 1, updatedAt: -1 });

export default mongoose.model<IStudentTutorRelationship>("StudentTutorRelationship", studentTutorRelationshipSchema);
