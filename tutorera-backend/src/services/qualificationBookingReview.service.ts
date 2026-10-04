import type { ClientSession } from "mongoose";
import Request from "../models/Request.model";
import Booking from "../models/Booking.model";
import type { ITutorProfile } from "../models/TutorProfile.model";

/** Apply after a persisted replacement; never use self-declared subjects. */
export async function flagPendingQualificationBookings(profile: ITutorProfile): Promise<number> {
  const subjects = (profile.subjectEligibility || []).filter(entry => entry.status === "pending" &&
    entry.reason === "The supporting qualification changed or was removed. A fresh qualification and subject review is required.")
    .map(entry => entry.subject);
  return flagQualificationBookings(String(profile.user), subjects, "Supporting qualification changed or was removed; subject eligibility requires review.");
}

/** Qualification changes require human review of existing lessons, not cancellation. */
export async function flagQualificationBookings(tutorId: string, subjects: string[], reason: string, session?: ClientSession): Promise<number> {
  if (!subjects.length) return 0;
  const patterns = [...new Set(subjects)].map(subject => new RegExp(`^${subject.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"));
  const requests = await Request.find({ subject: { $in: patterns } }).select("_id").session(session || null).lean();
  if (!requests.length) return 0;
  const result = await Booking.updateMany({ tutor: tutorId, request: { $in: requests.map(item => item._id) }, status: { $in: ["upcoming", "ongoing"] } },
    { $set: { flaggedForReview: true, flagReason: reason, flaggedAt: new Date() } }, { session });
  return result.modifiedCount;
}
