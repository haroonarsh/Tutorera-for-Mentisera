import mongoose, { HydratedDocument } from "mongoose";
import TutorProfile, { ITutorProfile } from "../models/TutorProfile.model";
import AuditLog from "../models/AuditLog.model";
import TutorApplicationStatusHistory from "../models/TutorApplicationStatusHistory.model";
import { flagQualificationBookings } from "./qualificationBookingReview.service";

/**
 * Persists a tutor self-service profile change and the consequential academic
 * review trail as one transaction. Email/socket delivery stays outside this
 * unit because it cannot safely participate in MongoDB retries.
 */
export async function persistTutorEducationEdit(input: {
  profileId: string;
  update: Record<string, unknown>;
  resetSubjects: string[];
  actor: { id: string; name: string };
}): Promise<HydratedDocument<ITutorProfile> | null> {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const profile = await TutorProfile.findByIdAndUpdate(input.profileId, input.update,
        { returnDocument: "after", runValidators: true, session });
      if (!profile) return null;
      const resetSubjects = [...new Set(input.resetSubjects.filter(Boolean))];
      if (resetSubjects.length) {
        await flagQualificationBookings(String(profile.user), resetSubjects,
          "Supporting qualification changed or was removed; subject eligibility requires review.", session);
      }
      for (const subject of resetSubjects) {
        const message = `${subject} requires fresh review because its supporting qualification changed or was removed.`;
        await TutorApplicationStatusHistory.create([{ tutor: profile.user, tutorProfile: profile._id,
          actor: input.actor.name, actorId: input.actor.id, actorRole: "tutor", event: "SUBJECT_ELIGIBILITY_REVIEW_REQUIRED",
          isPublic: false, statusBefore: "approved", statusAfter: "pending", message }], { session });
        await AuditLog.create([{ action: "subject_eligibility_reset_after_education_edit", actor: input.actor.name,
          actorId: input.actor.id, entity: "TutorProfile", targetId: profile._id.toString(), targetName: profile.fullName,
          metadata: { subject } }], { session });
      }
      return profile;
    });
  } finally { await session.endSession(); }
}
