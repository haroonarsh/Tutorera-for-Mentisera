import { Response } from "express";
import { AuthRequest } from "../types";
import GuardianConsent from "../models/GuardianConsent.model";
import { issueGuardianConsent, verifyGuardianConsent, GuardianConsentError } from "../services/guardianConsent.service";
import { logAudit } from "../utils/logAudit";

// A restricted minor can request a new code, but cannot change the guardian
// destination. Email changes require an identity-support workflow.
export const resendGuardianConsent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== "student" || !req.user.isMinor || req.user.parentConsentVerified) {
      res.status(403).json({ success: false, code: "CONSENT_NOT_REQUIRED" }); return;
    }
    await issueGuardianConsent(req.user._id);
    res.json({ success: true, message: "A new code was sent to the guardian email on file." });
  } catch (err: any) {
    res.status(err instanceof GuardianConsentError ? err.statusCode : 503)
      .json({ success: false, code: err?.code || "GUARDIAN_EMAIL_UNAVAILABLE",
        message: err instanceof GuardianConsentError ? err.message : "Unable to send guardian verification at present." });
  }
};

// No student profile details are disclosed until the destination mailbox is
// verified by OTP. A parent who merely claims the email must not receive PII.
export const listGuardianConsentRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user?.role !== "parent") {
    res.status(403).json({ success: false, code: "PARENT_ACCOUNT_REQUIRED" }); return;
  }
  const requests = await GuardianConsent.find({
    guardianEmail: req.user.email.toLowerCase(), status: "pending", expiresAt: { $gt: new Date() },
  }).select("student expiresAt").limit(25).sort("-createdAt").lean();
  res.setHeader("Cache-Control", "no-store");
  res.json({ success: true, requests: requests.map(item => ({
    studentId: item.student.toString(), expiresAt: item.expiresAt,
  })) });
};

export const approveGuardianConsent = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user?.role !== "parent") {
    res.status(403).json({ success: false, code: "PARENT_ACCOUNT_REQUIRED" }); return;
  }
  const { studentId, code, adultAttestation, guardianDateOfBirth } = req.body || {};
  if (typeof studentId !== "string" || typeof code !== "string" || typeof guardianDateOfBirth !== "string") {
    res.status(400).json({ success: false, code: "INVALID_CONSENT_DETAILS" }); return;
  }
  try {
    await verifyGuardianConsent({
      parentId: req.user._id, studentId, code, adultAttestation: adultAttestation === true,
      guardianDateOfBirth,
    });
    await logAudit({ action: "student_guardian_consent_verified", actor: req.user.name,
      actorId: req.user._id.toString(), entity: "User", targetId: studentId,
      metadata: { verification: "authenticated_parent_email_otp", guardian: req.user._id.toString() } });
    res.json({ success: true, message: "Guardian email verified and student account supervision activated." });
  } catch (err: any) {
    res.status(err instanceof GuardianConsentError ? err.statusCode : 500)
      .json({ success: false, code: err?.code || "GUARDIAN_VERIFICATION_FAILED",
        message: err instanceof GuardianConsentError ? err.message : "Unable to verify guardian consent." });
  }
};
