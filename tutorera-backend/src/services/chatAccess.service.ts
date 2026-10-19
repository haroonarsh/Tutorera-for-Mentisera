import { Types } from "mongoose";
import User from "../models/User.model";

/**
 * The message recipient is a separate principal from the authenticated tutor.
 * Guardian revocation must prevent NEW content reaching a minor even if a
 * tutor still has a valid JWT and the child has an old Socket.IO room.
 * Unknown/deactivated/non-student accounts fail closed.
 */
export async function isConversationStudentEligible(studentId: Types.ObjectId | string): Promise<boolean> {
  const student = await User.findById(studentId)
    .select("role isActive isMinor parentConsentVerified")
    .lean();
  return !!student && student.role === "student" && student.isActive === true &&
    !(student.isMinor && !student.parentConsentVerified);
}
