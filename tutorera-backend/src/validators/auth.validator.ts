import { z } from "zod";
import { Request, Response, NextFunction } from "express";

// All sign-up methods validate the market before account creation. Normalize
// ISO country codes here so Zod does not silently strip the user's selection.
const registrationMarketCode = z.string().trim().toUpperCase()
  .regex(/^[A-Z]{2}$/, "Country must be a two-letter ISO code");
const preferredLanguageCode = z.string().trim().toLowerCase()
  .regex(/^[a-z]{2,3}(?:-[a-z]{2})?$/, "Invalid language code");

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "tutor", "parent"]).default("student"),
  phone: z.string().optional(),
  city: z.string().optional(),
  countryCode: registrationMarketCode.default("PK"),
  preferredLanguage: preferredLanguageCode.optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, "Google ID token is required"),
  role: z.enum(["student", "tutor", "parent"]).optional(),
  countryCode: registrationMarketCode.optional(),
  preferredLanguage: preferredLanguageCode.optional(),
});

export const selectRoleSchema = z.object({
  role: z.enum(["student", "tutor", "parent"]),
});

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