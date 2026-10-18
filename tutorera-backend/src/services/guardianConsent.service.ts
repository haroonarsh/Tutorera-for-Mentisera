import crypto from "crypto";
import mongoose from "mongoose";
import User from "../models/User.model";
import ParentProfile from "../models/ParentProfile.model";
import GuardianConsent from "../models/GuardianConsent.model";
import sendEmail from "../utils/sendEmail";

export class GuardianConsentError extends Error {
  constructor(public code: string, message: string, public statusCode = 409) { super(message); }
}

// The date is self-declared. Identity/age document verification, if required
// by an applicable market, belongs in a separate supervised verification flow.
export function ageOnDate(dateString: string, today = new Date()): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return -1;
  const date = new Date(dateString + "T00:00:00.000Z");
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== dateString) return -1;
  let age = today.getUTCFullYear() - date.getUTCFullYear();
  const month = today.getUTCMonth() - date.getUTCMonth();
  if (month < 0 || (month === 0 && today.getUTCDate() < date.getUTCDate())) age--;
  return age;
}

function codeHash(studentId: string, code: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required to hash guardian consent codes.");
  return crypto.createHmac("sha256", secret).update(studentId + ":" + code).digest("hex");
}

function safeCompare(left: string, right: string) {
  const a = Buffer.from(left, "hex");
  const b = Buffer.from(right, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function issueGuardianConsent(studentId: mongoose.Types.ObjectId | string): Promise<void> {
  const student = await User.findById(studentId).select("name email role isMinor parentConsentVerified parentGuardianEmail parentGuardianName");
  if (!student || student.role !== "student" || !student.isMinor || student.parentConsentVerified ||
    !student.parentGuardianEmail || !student.parentGuardianName) {
    throw new GuardianConsentError("CONSENT_NOT_REQUIRED", "No guardian approval request is needed.", 409);
  }
  const existing = await GuardianConsent.findOne({ student: student._id });
  if (existing?.status === "verified" && student.parentConsentVerified) throw new GuardianConsentError("ALREADY_VERIFIED", "Consent has already been verified.");
  if (existing && Date.now() - existing.lastSentAt.getTime() < 60_000) {
    throw new GuardianConsentError("RESEND_TOO_SOON", "Please wait before requesting another guardian code.", 429);
  }
  if (existing && existing.status !== "verified" && existing.resendCount >= 5) {
    throw new GuardianConsentError("RESEND_LIMIT_REACHED", "Contact support to restart guardian verification.", 429);
  }
  const code = crypto.randomInt(0, 100_000_000).toString().padStart(8, "0");
  const now = new Date();
  // Preserve a valid one-time verification request even when email delivery
  // fails; the student can request a new code after the cooldown.
  await GuardianConsent.findOneAndUpdate({ student: student._id }, {
    $set: { guardianEmail: student.parentGuardianEmail.toLowerCase(),
      guardianName: student.parentGuardianName, codeHash: codeHash(student._id.toString(), code),
      status: "pending", expiresAt: new Date(now.getTime() + 24 * 60 * 60_000), attempts: 0, lastSentAt: now },
    $setOnInsert: { resendCount: 0 },
    ...(existing ? { $inc: { resendCount: existing.status === "verified" ? 0 : 1 } } : {}),
  }, { upsert: true, new: true });
  await sendEmail({
    to: student.parentGuardianEmail,
    subject: "TUTORERA — Guardian verification required",
    html: `<p>Hello ${student.parentGuardianName.replace(/[&<>"']/g, "")},</p><p>A student entered your email address as their parent or guardian for a TUTORERA tutoring account.</p><p>If you are an adult responsible for this student and agree to supervise their use of TUTORERA, sign in to your separate parent account and enter this code:</p><p style="font-size:22px;font-weight:700;letter-spacing:3px">${code}</p><p>The code expires after 24 hours. Do not share it with the student. If you did not expect this, you can ignore the message.</p>`,
  });
}

export async function verifyGuardianConsent(args: {
  parentId: mongoose.Types.ObjectId;
  studentId: string;
  code: string;
  adultAttestation: boolean;
  guardianDateOfBirth: string;
}): Promise<void> {
  const { parentId, studentId, code, adultAttestation, guardianDateOfBirth } = args;
  if (!adultAttestation || ageOnDate(guardianDateOfBirth) < 18) {
    throw new GuardianConsentError("ADULT_GUARDIAN_REQUIRED", "An adult guardian must confirm their age and responsibility.", 422);
  }
  if (!mongoose.isValidObjectId(studentId) || !/^\d{8}$/.test(code)) {
    throw new GuardianConsentError("INVALID_CONSENT_CODE", "Guardian verification details are invalid.", 400);
  }
  const parent = await User.findOne({ _id: parentId, role: "parent", isActive: true });
  if (!parent) throw new GuardianConsentError("PARENT_ACCOUNT_REQUIRED", "Sign in with a parent account.", 403);
  const approval = await GuardianConsent.findOne({ student: studentId, guardianEmail: parent.email.toLowerCase(),
    status: "pending", expiresAt: { $gt: new Date() }, attempts: { $lt: 5 } }).select("+codeHash");
  if (!approval) throw new GuardianConsentError("CONSENT_EXPIRED", "The request has expired or is unavailable.", 409);
  const suppliedHash = codeHash(studentId, code);
  if (!safeCompare(suppliedHash, approval.codeHash)) {
    await GuardianConsent.updateOne({ _id: approval._id, status: "pending" }, { $inc: { attempts: 1 } });
    throw new GuardianConsentError("INVALID_CONSENT_CODE", "Invalid guardian verification code.", 400);
  }
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const consent = await GuardianConsent.findOneAndUpdate({
        _id: approval._id, guardianEmail: parent.email.toLowerCase(), status: "pending",
        expiresAt: { $gt: new Date() }, attempts: { $lt: 5 },
      }, { $set: { status: "verified", verifiedBy: parent._id, verifiedAt: new Date() } },
        { session, new: true });
      if (!consent) throw new GuardianConsentError("CONSENT_ALREADY_USED", "Guardian approval has already been processed.");
      const student = await User.findOneAndUpdate({
        _id: consent.student, role: "student", isMinor: true,
        parentConsentVerified: false, parentGuardianEmail: parent.email.toLowerCase(),
      }, { $set: { parentConsentVerified: true, parentGuardianName: parent.name } }, { session, new: true });
      if (!student) throw new GuardianConsentError("STUDENT_UNAVAILABLE", "Student record cannot be approved.", 409);
      let profile = await ParentProfile.findOne({ user: parent._id }).session(session);
      if (!profile) {
        [profile] = await ParentProfile.create([{ user: parent._id, children: [], approvalRequiredForBookings: true }], { session });
      }
      if (!profile.children.some(child => child.studentUser.toString() === student._id.toString())) {
        profile.children.push({ studentUser: student._id, name: student.name, level: "",
          subjects: [], relationship: "guardian" } as any);
      }
      // A linked minor must never inherit a parent profile's optional
      // "approve each booking" toggle as false.
      profile.approvalRequiredForBookings = true;
      await profile.save({ session });
      const guardianBirthDate = new Date(guardianDateOfBirth + "T00:00:00.000Z");
      const savedGuardianDob = parent.dateOfBirth;
      if (savedGuardianDob && savedGuardianDob.getTime() !== guardianBirthDate.getTime()) {
        throw new GuardianConsentError("GUARDIAN_AGE_MISMATCH", "The guardian's date of birth differs from their account.", 409);
      }
      await User.updateOne({ _id: parent._id }, { $set: { dateOfBirth: guardianBirthDate } }, { session });
    });
  } finally { await session.endSession(); }
}
