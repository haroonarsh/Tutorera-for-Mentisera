import mongoose from "mongoose";
import TutorProfile from "../models/TutorProfile.model";
import AuditLog from "../models/AuditLog.model";
import TutorApplicationStatusHistory from "../models/TutorApplicationStatusHistory.model";
import { reviewSubjectEvidence } from "./subjectEvidenceReview.service";

export class EvidenceDecisionError extends Error {
  constructor(message: string, public readonly statusCode: number) { super(message); }
}

/** Decision, audit, and tracking history commit together. External notifications
 * run only after this returns; MongoDB may retry this callback on conflicts. */
export async function commitSubjectEvidenceDecision(input: {
  profileId: string; subject: string; index: number; status: "approved" | "rejected"; reason: string;
  actor: { id: string; name: string };
}) {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const profile = await TutorProfile.findById(input.profileId).session(session);
      if (!profile) throw new EvidenceDecisionError("Tutor application no longer exists.", 404);
      const entry = profile.subjectEligibility?.find((item) => item.subject.trim().toLowerCase() === input.subject.trim().toLowerCase());
      if (!entry) throw new EvidenceDecisionError("Subject request not found.", 404);
      const previousStatus = entry.evidence?.[input.index]?.status || "pending";
      const result = reviewSubjectEvidence(entry, input.index, input.status, input.reason, input.actor.id);
      if (!result.success) throw new EvidenceDecisionError(result.message || "Evidence changed. Reload the application before reviewing.", 409);
      await profile.save({ session, validateModifiedOnly: true });
      await AuditLog.create([{
        action: `subject_evidence_${input.status}`, actor: input.actor.name, actorId: input.actor.id,
        entity: "TutorProfile", targetId: profile._id.toString(), targetName: profile.fullName,
        metadata: { subject: entry.subject, index: input.index, reason: input.reason.trim(),
          publicId: entry.evidence![input.index].publicId, previousStatus, status: input.status },
      }], { session });
      await TutorApplicationStatusHistory.create([{
        tutor: profile.user, tutorProfile: profile._id, actor: input.actor.name, actorId: input.actor.id,
        actorRole: "admin", event: "SUBJECT_EVIDENCE_REVIEWED", isPublic: false,
        statusBefore: previousStatus, statusAfter: input.status,
        message: `${entry.subject} evidence ${input.index + 1} ${input.status}: ${input.reason.trim()}`,
      }], { session });
      return entry;
    });
  } finally { await session.endSession(); }
}
