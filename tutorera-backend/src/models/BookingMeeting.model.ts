import mongoose, { Schema } from "mongoose";
const schema = new Schema({
  booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true, unique: true, index: true },
  provider: { type: String, enum: ["google_meet", "microsoft_teams"], required: true },
  url: { type: String, required: true, maxlength: 2048, select: false },
  submittedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
export default mongoose.model("BookingMeeting", schema);
