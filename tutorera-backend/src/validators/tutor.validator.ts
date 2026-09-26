import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { EDUCATION_LEVELS } from "../config/educationLevels";

export const tutorProfileSchema = z.object({
  bio: z.string().min(20, "Bio must be at least 20 characters").optional(),
  subjects: z.array(z.string()).min(1, "At least one subject required").optional(),
  levels: z.array(z.enum(EDUCATION_LEVELS)).optional(),
  hourlyRate: z.number().min(0, "Hourly rate cannot be negative").optional(),
  experience: z.number().min(0).optional(),
  education: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    year: z.number(),
  })).optional(),
  availability: z.array(z.object({
    day: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
    slots: z.array(z.string()),
  })).optional(),
  teachingMode: z.enum(["online", "in-person", "both"]).optional(),
  city: z.string().optional(),
  payoutAccount: z.object({
    method: z.enum(["bank_transfer", "raast", "easypaisa", "jazzcash", "other"]).default("bank_transfer"),
    accountTitle: z.string().max(100).optional(),
    accountNumber: z.string().max(50).optional(),
    bankName: z.string().max(100).optional(),
    branchCode: z.string().max(20).optional(),
    swiftCode: z.string().max(20).optional(),
    routingNumber: z.string().max(30).optional(),
    notes: z.string().max(300).optional(),
  }).optional(),
});

export type TutorProfileInput = z.infer<typeof tutorProfileSchema>;

export const validate =
  (schema: z.ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => issue.message);
      res.status(400).json({ success: false, message: errors[0], errors });
      return;
    }
    req.body = result.data;
    next();
  };
