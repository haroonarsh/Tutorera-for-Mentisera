import mongoose from "mongoose";
import TutorProfile, { ITutorProfile } from "../models/TutorProfile.model";
import AuditLog from "../models/AuditLog.model";
import AdminVerificationReview from "../models/AdminVerificationReview.model";
import TutorDocumentReview from "../models/TutorDocumentReview.model";
import TutorApplicationStatusHistory from "../models/TutorApplicationStatusHistory.model";
import { qualificationFingerprint, reviewQualification } from "./qualificationReview.service";
import { syncApprovedSubjects } from "./subjectEligibility.service";
import { flagQualificationBookings } from "./qualificationBookingReview.service";

export class QualificationDecisionError extends Error {
  constructor(message: string, public readonly statusCode: number) { super(message); }
}

export function qualificationReviewToken(row: ITutorProfile["education"][number]): string {
  return JSON.stringify([qualificationFingerprint(row), row.verificationStatus || "pending",
    row.reviewedAt, row.reviewedBy?.toString(), row.verifiedDegreeLevel, row.reviewReason]);
}

/** No external side effects inside the retryable transaction. */
export async function commitQualificationDecision(input: {
  profileId: string; index: number; status: "approved" | "rejected" | "pending";
  reason: string; degreeLevel?: unknown; expectedToken: string;
  actor: { id: string; name: string };
}) {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const profile = await TutorProfile.findById(input.profileId).session(session);
      if (!profile) throw new QualificationDecisionError("Application not found.", 404);
      const row = profile.education[input.index];
      if (!row || qualificationReviewToken(row) !== input.expectedToken)
        throw new QualificationDecisionError("Qualification changed. Reload before reviewing.", 409);
      const previousStatus = row.verificationStatus || "pending";
      const result = reviewQualification(profile, input.index, input.status, input.actor.id, input.reason, input.degreeLevel);
      if (!result.success) throw new QualificationDecisionError(result.message!, 422);
      const invalidatedSubjects = input.status === "approved" ? [] : (profile.subjectEligibility || []).filter(entry =>
        entry.status === "approved" && entry.qualificationIndex === input.index);
      for (const entry of invalidatedSubjects) {
        entry.status = "pending";
        entry.levels = [];
        entry.reason = `Linked qualification ${input.index + 1} is ${input.status}; a fresh subject review is required.`;
        entry.reviewedBy = row.reviewedBy;
        entry.reviewedAt = row.reviewedAt;
      }
      syncApprovedSubjects(profile);
      const flaggedBookings = await flagQualificationBookings(profile.user.toString(), invalidatedSubjects.map(entry => entry.subject),
        `Supporting qualification ${input.index + 1} was ${input.status}; subject eligibility requires review.`, session);
      const rejected = profile.education.filter(item => item.verificationStatus === "rejected");
      profile.degreeVerificationStatus = rejected.length ? "rejected"
        : profile.education.every(item => item.verificationStatus === "approved") ? "approved" : "pending";
      profile.degreeRejectionReason = rejected.map(item => item.reviewReason).filter(Boolean).join("; ");
      profile.degreeReviewedAt = profile.lastStatusChangeAt = new Date();
      await profile.save({ session, validateModifiedOnly: true });
      const queue = await TutorDocumentReview.findOne({ tutor: profile.user, component: "degree" }).session(session);
      const now = new Date();
      if (queue) {
        if (!(profile.degreeVerificationStatus === "pending" && queue.status === "in_review")) queue.status = profile.degreeVerificationStatus;
        queue.rejectionReason = profile.degreeRejectionReason;
        queue.completedAt = profile.degreeVerificationStatus === "pending" ? undefined : now;
        await queue.save({ session });
      } else {
        await TutorDocumentReview.create([{ tutor: profile.user, tutorProfile: profile._id, component: "degree",
          status: profile.degreeVerificationStatus, rejectionReason: profile.degreeRejectionReason,
          slaHours: 24, slaDeadline: new Date(now.getTime() + 86400000),
          completedAt: profile.degreeVerificationStatus === "pending" ? undefined : now }], { session });
      }
      const message = `Qualification ${input.index + 1} ${input.status}${input.reason.trim() ? `: ${input.reason.trim()}` : ""}; overall educational review: ${profile.degreeVerificationStatus}`;
      await AdminVerificationReview.create([{ tutor: profile.user, tutorProfile: profile._id, admin: input.actor.id,
        component: "degree", decision: input.status, previousStatus, newStatus: input.status,
        rejectionReason: input.status === "rejected" ? input.reason.trim() : undefined, internalNotes: message }], { session });
      await AuditLog.create([{ action: `degree_${input.status}`, actor: input.actor.name, actorId: input.actor.id,
        entity: "TutorProfile", targetId: profile._id.toString(), targetName: profile.fullName,
        metadata: { qualificationIndex: input.index, fingerprint: qualificationFingerprint(row), previousStatus,
          status: input.status, reason: input.reason.trim(), verifiedDegreeLevel: row.verifiedDegreeLevel,
          overallStatus: profile.degreeVerificationStatus, flaggedBookings } }], { session });
      await TutorApplicationStatusHistory.create([{ tutor: profile.user, tutorProfile: profile._id,
        actor: input.actor.name, actorId: input.actor.id, actorRole: "admin", isPublic: false,
        event: input.status === "approved" ? "EDUCATIONAL_DOCUMENTS_VERIFIED" : input.status === "rejected" ? "EDUCATIONAL_DOCUMENTS_REJECTED" : "EDUCATIONAL_DOCUMENTS_PENDING",
        statusBefore: previousStatus, statusAfter: input.status, message }], { session });
      for (const entry of invalidatedSubjects) {
        await AuditLog.create([{ action: "subject_eligibility_reset_after_qualification_review", actor: input.actor.name,
          actorId: input.actor.id, entity: "TutorProfile", targetId: profile._id.toString(), targetName: profile.fullName,
          metadata: { subject: entry.subject, qualificationIndex: input.index, previousStatus: "approved", status: "pending", reason: entry.reason } }], { session });
        await TutorApplicationStatusHistory.create([{ tutor: profile.user, tutorProfile: profile._id,
          actor: input.actor.name, actorId: input.actor.id, actorRole: "admin", isPublic: false,
          event: "SUBJECT_ELIGIBILITY_REVIEW_REQUIRED", statusBefore: "approved", statusAfter: "pending",
          message: `${entry.subject}: ${entry.reason}` }], { session });
      }
      return profile;
    });
  } finally { await session.endSession(); }
}
