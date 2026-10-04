import TutorProfile from "../models/TutorProfile.model";
import User from "../models/User.model";

/** Re-read authoritative data after a review commits; never activate from the
 * controller's pre-review user/profile snapshot. */
export async function loadReviewActivationSnapshot(profileId: string) {
  const profile = await TutorProfile.findById(profileId);
  if (!profile) throw new Error("Application no longer exists during activation synchronization.");
  const user = await User.findById(profile.user);
  if (!user) throw new Error("Tutor account no longer exists during activation synchronization.");
  return { profile, user };
}
