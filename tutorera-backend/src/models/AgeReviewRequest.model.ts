import mongoose, { Schema } from "mongoose";

const ageReviewRequestSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  status: { type: String, enum: ["pending", "closed"], default: "pending", index: true },
  reason: { type: String, enum: ["missing_date_of_birth", "incorrect_date_of_birth"], required: true },
  resolution: { type: String, enum: ["referred_to_support", "duplicate_request"] },
  reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  reviewedAt: { type: Date },
  // Never accept identity documents or raw birth dates in this request.
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

// At most one pending age review per student, including concurrent submissions.
// Historical duplicates must be reconciled before deploying this unique index.
ageReviewRequestSchema.index({ student: 1 }, {
  unique: true, partialFilterExpression: { status: "pending" },
  name: "unique_pending_student_age_review",
});
export default mongoose.model("AgeReviewRequest", ageReviewRequestSchema);
