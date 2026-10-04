import mongoose from "mongoose";
import TutorProfile from "../models/TutorProfile.model";
import User from "../models/User.model";
import TutorAgreement from "../models/TutorAgreement.model";
import AuditLog from "../models/AuditLog.model";
import TutorApplicationStatusHistory from "../models/TutorApplicationStatusHistory.model";
import { hasCoreDocumentsApproved, hasApprovedTeachingSubject, isAccessBlocked } from "./eligibility.service";

/** Serialize issuance through the profile write. No email inside the retryable callback. */
export async function issueReviewedTutorAgreement(profileId: string, actor: {
  name: string; role: "system" | "admin" | "tutor"; id?: string;
}) {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const profile = await TutorProfile.findById(profileId).session(session);
      if (!profile) throw new Error("Application no longer exists.");
      const user = await User.findById(profile.user).session(session);
      if (!user) throw new Error("Tutor account no longer exists.");
      const blocked = user.isDeleted || user.suspendedAt || ["suspended", "banned", "deleted"].includes(user.moderationStatus || "");
      if (blocked || isAccessBlocked(profile) || !profile.onboardingComplete || profile.verificationStatus !== "approved" ||
        !hasCoreDocumentsApproved(profile) || !hasApprovedTeachingSubject(profile)) return { issued: false, profile };
      const existing = await TutorAgreement.findOne({ tutor: user._id, tutorProfile: profile._id,
        status: { $in: ["pending_acceptance", "active"] } }).session(session);
      if (existing) return { issued: false, profile };
      profile.agreementAcceptanceRequired = true;
      profile.agreementAcceptedAt = undefined;
      profile.agreementVersion = "TTA-2026.1";
      await profile.save({ session, validateModifiedOnly: true });
      const [agreement] = await TutorAgreement.create([{ tutor: user._id, tutorProfile: profile._id,
        version: "TTA-2026.1", approvedHourlyRate: profile.hourlyRate, currency: profile.currency || "USD",
        approvedBy: actor.role === "admin" ? actor.id : undefined, approvedAt: new Date() }], { session });
      await AuditLog.create([{ action: "tutor_agreement_issued", actor: actor.name, actorId: actor.id,
        entity: "TutorAgreement", targetId: agreement._id.toString(), targetName: profile.fullName,
        metadata: { profileId, version: agreement.version, currency: agreement.currency,
          approvedHourlyRate: agreement.approvedHourlyRate } }], { session });
      await TutorApplicationStatusHistory.create([{ tutor: user._id, tutorProfile: profile._id,
        actor: actor.name, actorId: actor.id, actorRole: actor.role, event: "TUTOR_AGREEMENT_ISSUED",
        isPublic: false, statusAfter: "pending_acceptance", message: "Tutor agreement issued; review and acceptance required." }], { session });
      return { issued: true, profile };
    });
  } finally { await session.endSession(); }
}
