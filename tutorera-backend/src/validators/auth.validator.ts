import { z } from "zod";
import { Request, Response, NextFunction } from "express";

// All sign-up methods validate the market before account creation. Normalize
// ISO country codes here so Zod does not silently strip the user's selection.
const registrationMarketCode = z.string().trim().toUpperCase()
  .regex(/^[A-Z]{2}$/, "Country must be a two-letter ISO code");
const preferredLanguageCode = z.string().trim().toLowerCase()
  .regex(/^[a-z]{2,3}(?:-[a-z]{2})?$/, "Invalid language code");

// ISO calendar dates are self-declared and normalized; they are not evidence
// of identity. Requiring them before student account creation prevents an
// omitted date of birth from bypassing the guardian-consent gate.
const birthDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be YYYY-MM-DD");
const guardianEmailSchema = z.string().trim().toLowerCase().email("A valid guardian email is required");

function ageAtSignup(dateText: string): number {
  const date = new Date(dateText + "T00:00:00.000Z");
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== dateText) return -1;
  const now = new Date();
  let years = now.getUTCFullYear() - date.getUTCFullYear();
  if (now.getUTCMonth() < date.getUTCMonth() ||
      (now.getUTCMonth() === date.getUTCMonth() && now.getUTCDate() < date.getUTCDate())) years--;
  return years;
}

export function checkStudentAgeFields(value: {
  role?: string; dateOfBirth?: string; guardianEmail?: string;
  guardianName?: string; email?: string;
}, context: z.RefinementCtx): void {
  if (value.role !== "student") return;
  if (!value.dateOfBirth) {
    context.addIssue({ code: "custom", path: ["dateOfBirth"], message: "Student date of birth is required." });
    return;
  }
  const age = ageAtSignup(value.dateOfBirth);
  if (age < 0 || age > 110) {
    context.addIssue({ code: "custom", path: ["dateOfBirth"], message: "Enter a valid date of birth." });
  } else if (age < 13) {
    context.addIssue({ code: "custom", path: ["dateOfBirth"], message: "Children under 13 cannot register independently. Contact support for guardian-managed enrollment." });
  } else if (age < 18) {
    if (!value.guardianEmail || !guardianEmailSchema.safeParse(value.guardianEmail).success ||
        value.guardianEmail.toLowerCase() === value.email?.toLowerCase()) {
      context.addIssue({ code: "custom", path: ["guardianEmail"], message: "A guardian's separate valid email is required for student accounts under 18." });
    }
    if (!value.guardianName || value.guardianName.trim().length < 2) {
      context.addIssue({ code: "custom", path: ["guardianName"], message: "Guardian name is required for students under 18." });
    }
  }
}

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "tutor", "parent"]).default("student"),
  phone: z.string().optional(),
  city: z.string().optional(),
  countryCode: registrationMarketCode.default("PK"),
  preferredLanguage: preferredLanguageCode.optional(),
  dateOfBirth: birthDateSchema.optional(),
  guardianEmail: guardianEmailSchema.optional(),
  guardianName: z.string().trim().min(2).max(120).optional(),
}).superRefine(checkStudentAgeFields);

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, "Google ID token is required"),
  role: z.enum(["student", "tutor", "parent"]).optional(),
  countryCode: registrationMarketCode.optional(),
  preferredLanguage: preferredLanguageCode.optional(),
  dateOfBirth: birthDateSchema.optional(),
  guardianEmail: guardianEmailSchema.optional(),
  guardianName: z.string().trim().min(2).max(120).optional(),
});

// This schema is applied only when a new Google student account is created.
// Existing Google users can log in without resubmitting their DOB/guardian data.
export const newGoogleStudentSchema = z.object({
  role: z.literal("student"),
  email: z.string().email(),
  dateOfBirth: birthDateSchema.optional(),
  guardianEmail: guardianEmailSchema.optional(),
  guardianName: z.string().trim().min(2).max(120).optional(),
}).superRefine(checkStudentAgeFields);

export const selectRoleSchema = z.object({
  role: z.enum(["student", "tutor", "parent"]),
  dateOfBirth: birthDateSchema.optional(),
  guardianEmail: guardianEmailSchema.optional(),
  guardianName: z.string().trim().min(2).max(120).optional(),
}).superRefine(checkStudentAgeFields);

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type SelectRoleInput = z.infer<typeof selectRoleSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const validate =
  (schema: z.ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((e) => e.message);
      res.status(400).json({ success: false, message: errors[0], errors });
      return;
    }
    req.body = result.data;
    next();
  };