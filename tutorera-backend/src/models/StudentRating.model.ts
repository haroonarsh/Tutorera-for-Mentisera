import mongoose, { Schema, Document, Types } from "mongoose";

export interface IStudentRating extends Document {
  student: Types.ObjectId;
  tutor: Types.ObjectId;
  booking: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}

const studentRatingSchema = new Schema<IStudentRating>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tutor:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    rating:  { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, minlength: 10 },
  },
  { timestamps: true }
);

// One rating per booking per tutor
studentRatingSchema.index({ booking: 1, tutor: 1 }, { unique: true });

export default mongoose.model<IStudentRating>("StudentRating", studentRatingSchema);