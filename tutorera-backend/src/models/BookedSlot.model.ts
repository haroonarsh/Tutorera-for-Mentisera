import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBookedSlot extends Document {
  tutor: Types.ObjectId;
  student: Types.ObjectId;
  booking: Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  createdAt: Date;
}

const bookedSlotSchema = new Schema<IBookedSlot>(
  {
    tutor:     { type: Schema.Types.ObjectId, ref: "User", required: true },
    student:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    booking:   { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    date:      { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime:   { type: String, required: true },
  },
  { timestamps: true }
);

// Prevent double booking — same tutor, same date, same startTime
bookedSlotSchema.index({ tutor: 1, date: 1, startTime: 1 }, { unique: true });

export default mongoose.model<IBookedSlot>("BookedSlot", bookedSlotSchema);