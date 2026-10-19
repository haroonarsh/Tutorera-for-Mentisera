import { Types } from "mongoose";
import User from "../models/User.model";

/**
 * The message recipient is a separate principal from the authenticated tutor.
 * Guardian revocation must prevent NEW content reaching a minor even if a
 * tutor still has a valid JWT and the child has an old Socket.IO room.
 * Unknown/deactivated/non-student accounts fail closed.
 */
export function isRealtimeStudentAllowed(user: {
  role: string;
  isActive?: boolean;
  isMinor?: boolean;
  parentConsentVerified?: boolean;
  dateOfBirth?: Date | null;
} | null): boolean {
  if (!user || user.isActive !== true || user.role === "pending") return false;
  if (user.role !== "student") return true;
  if (user.isMinor && !user.parentConsentVerified) return false;
  if (process.env.LEGACY_STUDENT_AGE_ENFORCEMENT === "true" &&
      (!user.dateOfBirth || !Number.isFinite(new Date(user.dateOfBirth).getTime()))) return false;
  return true;
}

export async function isConversationStudentEligible(studentId: Types.ObjectId | string): Promise<boolean> {
  const student = await User.findById(studentId)
    .select("role isActive isMinor parentConsentVerified dateOfBirth")
    .lean();
  return !!student && student.role === "student" && isRealtimeStudentAllowed(student);
}
