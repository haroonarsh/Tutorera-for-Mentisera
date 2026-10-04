import mongoose from "mongoose";
import TutorProfile from "../models/TutorProfile.model";
import User from "../models/User.model";
import AuditLog from "../models/AuditLog.model";
import TutorApplicationStatusHistory from "../models/TutorApplicationStatusHistory.model";
import { evaluateTutorActivation, policeIsRequired } from "./tutorActivation.service";

/** Profile visibility, account lifecycle, audit and history are one write unit. */
export async function synchronizeReviewVisibility(profileId: string, actor: {
  name: string; role: "system" | "admin" | "tutor"; id?: string;
}) {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const profile = await TutorProfile.findById(profileId).session(session);
      if (!profile) throw new Error("Application not found.");
      const user = await User.findById(profile.user).session(session);
      if (!user) throw new Error("Tutor account not found.");
      const activation = await evaluateTutorActivation(user._id, { session });
      const marketplace = activation.isEligible;
      const home = marketplace && policeIsRequired(profile) && profile.policeVerificationStatus === "approved";
      const previousMarketplace = Boolean(profile.marketplaceEligible);
      const previousHome = Boolean(profile.homeTuitionEligible);
      const marketplaceChanged = marketplace !== previousMarketplace;
      const homeChanged = home !== previousHome;
      // Repair lifecycle drift even if flags already happen to be correct.
      const desiredAccountStatus = marketplace ? "verified" : user.accountStatus === "verified" ? "submitted" : user.accountStatus;
      const accountChanged = desiredAccountStatus !== user.accountStatus;
      const statusChanged = profile.tutorStatus !== activation.tutorStatus;
      if (!marketplaceChanged && !homeChanged && !accountChanged && !statusChanged) return { profile, marketplace, home, marketplaceChanged, homeChanged };
      const now = new Date();
      profile.marketplaceEligible = marketplace;
      profile.homeTuitionEligible = home;
      profile.tutorStatus = activation.tutorStatus;
      profile.set("marketplaceEligibleAt", marketplace ? profile.marketplaceEligibleAt || now : undefined);
      profile.set("homeTuitionEligibleAt", home ? profile.homeTuitionEligibleAt || now : undefined);
      profile.lastStatusChangeAt = now;
      // A profile save hook still supports grandfathered legacy visibility.
      // Persist these strictly evaluated flags without allowing that bypass.
      await TutorProfile.updateOne({ _id: profile._id }, { $set: {
        marketplaceEligible: marketplace, homeTuitionEligible: home, lastStatusChangeAt: now,
        tutorStatus: activation.tutorStatus,
        ...(marketplace ? { marketplaceEligibleAt: profile.marketplaceEligibleAt } : {}),
        ...(home ? { homeTuitionEligibleAt: profile.homeTuitionEligibleAt } : {}),
      }, ...(!marketplace || !home ? { $unset: { ...(!marketplace ? { marketplaceEligibleAt: 1 } : {}), ...(!home ? { homeTuitionEligibleAt: 1 } : {}) } } : {}) }, { session, runValidators: true });
      // Always write the account row when visibility changes, serializing
      // against concurrent moderation updates that also write that row.
      await User.updateOne({ _id: user._id }, { $set: { accountStatus: desiredAccountStatus } }, { session });
      const changes = [
        ...(marketplaceChanged ? [{ event: marketplace ? "MARKETPLACE_ACTIVATED" as const : "MARKETPLACE_DEACTIVATED" as const, before: previousMarketplace, after: marketplace }] : []),
        ...(homeChanged ? [{ event: home ? "HOME_TUITION_ACTIVATED" as const : "HOME_TUITION_DEACTIVATED" as const, before: previousHome, after: home }] : []),
      ];
      for (const change of changes) {
        await TutorApplicationStatusHistory.create([{ tutor: user._id, tutorProfile: profile._id,
          actor: actor.name, actorId: actor.id, actorRole: actor.role, event: change.event, isPublic: false,
          statusBefore: change.before ? "active" : "inactive", statusAfter: change.after ? "active" : "inactive",
          message: change.event.replace(/_/g, " ").toLowerCase() }], { session });
      }
      await AuditLog.create([{ action: "tutor_visibility_synchronized", actor: actor.name, actorId: actor.id,
        entity: "TutorProfile", targetId: profileId, targetName: profile.fullName,
        metadata: { previousMarketplace, marketplace, previousHome, home, accountStatus: desiredAccountStatus } }], { session });
      return { profile, marketplace, home, marketplaceChanged, homeChanged };
    });
  } finally { await session.endSession(); }
}
