import { z } from "zod";
import { Request, Response, NextFunction } from "express";

export const tutorProfileSchema = z.object({
  bio: z.string().min(20, "Bio must be at least 20 characters").optional(),
  subjects: z.array(z.string()).min(1, "At least one subject required").optional(),
  levels: z.array(z.enum(["Primary (Grades 1-5)", "Middle (Grades 6-8)", "Matric (9th & 10th)", "Intermediate / FSc", "O-Level (Cambridge / Edexcel)", "A-Level (Cambridge / Edexcel)", "IB (Middle Years / Diploma)", "University / Degree", "Test Preparation", "Other"])).optional(),
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