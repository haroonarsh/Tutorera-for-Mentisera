import mongoose, { Schema, Document, Types } from "mongoose";

// Admin-managed mapping from a degree discipline (e.g. "Computer Science")
// to the subjects and levels a tutor with that qualification is ELIGIBLE to
// request approval for. This is deliberately a suggestion/eligibility-scope
// list, not an auto-approval mechanism - per the feature spec, a tutor's
// selections (even ones that match a mapping here) must still go through
// explicit admin approval (see TutorProfile.subjectEligibility). A subject
// outside any mapping for the tutor's discipline (e.g. Mathematics for a
// Computer Science degree) is not blocked outright, but is flagged to the
// admin as "adjacent - requires supporting evidence" rather than
// "directly matches degree" when they review it.
export interface IDisciplineSubjectMap extends Document {
  discipline: string; // e.g. "Computer Science" - matched against the tutor's onboarding discipline selection
  eligibleSubjects: string[]; // e.g. ["Computer Science", "Programming", "Computing", "Information Technology"]
  eligibleLevels: string[]; // e.g. ["O-Level", "A-Level", "University"]; empty = no level restriction
  isActive: boolean;
  notes?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const disciplineSubjectMapSchema = new Schema<IDisciplineSubjectMap>(
  {
    discipline: { type: String, required: true, trim: true, unique: true, index: true },
    eligibleSubjects: { type: [String], default: [], set: (arr: string[]) => arr.map((s) => s.trim()).filter(Boolean) },
    eligibleLevels: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    notes: { type: String, trim: true, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

disciplineSubjectMapSchema.index({ isActive: 1 });

export default mongoose.model<IDisciplineSubjectMap>("DisciplineSubjectMap", disciplineSubjectMapSchema);
