import mongoose, { Schema } from "mongoose";

const schema = new Schema({
  _id: { type: String, required: true },
  boardCode: { type: String, required: true, index: true }, boardName: { type: String, required: true },
  qualificationCode: { type: String, required: true }, qualificationName: { type: String, required: true },
  classLevel: { type: String }, subjectRef: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
  subject: { type: String, required: true }, subjectDisplay: { type: String, required: true }, aliases: [{ type: String }],
  approvalLevel: { type: String, required: true },
  status: { type: String, enum: ["active", "inactive"], required: true, default: "inactive" },
  verificationSource: { type: String }, verificationNote: { type: String },
  reviewedAt: { type: Date }, reviewedBy: { type: Schema.Types.ObjectId, ref: "User" }, reviewReason: { type: String },
}, { timestamps: true });
schema.index({ status: 1, boardCode: 1, qualificationCode: 1, classLevel: 1 });
schema.index({ subjectRef: 1, status: 1 });
export default mongoose.model("SchoolOffering", schema);
