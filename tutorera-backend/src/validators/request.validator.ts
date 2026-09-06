import { z } from "zod";
import { Request, Response, NextFunction } from "express";

export const createRequestSchema = z.object({
    subject: z.string().min(2, "Subject is required").max(100),
    level: z.enum(["Primary (Grades 1-5)", "Middle (Grades 6-8)", "Matric (9th & 10th)", "Intermediate / FSc", "O-Level (Cambridge / Edexcel)", "A-Level (Cambridge / Edexcel)", "IB (Middle Years / Diploma)", "University / Dergee", "Test Preparation", "Other"]),
    description: z.string().min(10, "Description must be at least 10 characters").max(1000),
    budget: z.number().positive("Budget must be a positive number"),
    maximumBudget: z.number().positive().optional(),
    pricingUnit: z.enum(["hour", "session", "month", "course"]).default("hour"),
    allowCounterOffers: z.boolean().default(true),
    classGrade: z.string().max(100).optional(), curriculum: z.string().max(100).optional(), examType: z.string().max(100).optional(), studentLevel: z.string().max(100).optional(),
    learningObjectives: z.string().max(1000).optional(), area: z.string().max(100).optional(), travelRadiusKm: z.number().min(0).max(100).optional(),
    tutorGenderPreference: z.enum(["male", "female", "none"]).default("none"), minimumQualification: z.string().max(150).optional(),
    minimumExperience: z.number().min(0).max(50).optional(), preferredLanguage: z.string().max(50).optional(), preferredTutorRating: z.number().min(0).max(5).optional(),
    preferredDays: z.array(z.string().max(20)).max(7).optional(), preferredStartTime: z.string().max(20).optional(), sessionDurationMinutes: z.number().min(15).max(480).optional(),
    sessionsPerWeek: z.number().min(1).max(14).optional(), expectedStartDate: z.string().datetime().optional(),
    teachingMode: z.enum(["online", "in-person", "both"]),
    city: z.string().max(100).optional(),
    schedule: z.string().min(1, "Schedule is required").max(200),
    });

    export const placeBidSchema = z.object({
    amount: z.number().positive("Offer amount must be a positive number"),
    message: z.string().max(500, "Message must be under 500 characters").default("I am available for this tuition request."),
    availability: z.string().max(300).optional(),
    });

export const createDirectBookingRequestSchema = z.object({
    tutorId: z.string().min(1, "Tutor ID is required"),
    subject: z.string().min(2, "Subject is required").max(100),
    level: z.enum(["Primary (Grades 1-5)", "Middle (Grades 6-8)", "Matric (9th & 10th)", "Intermediate / FSc", "O-Level (Cambridge / Edexcel)", "A-Level (Cambridge / Edexcel)", "IB (Middle Years / Diploma)", "University / Dergee", "Test Preparation", "Other"]),
    description: z.string().min(10, "Description must be at least 10 characters").max(1000),
    teachingMode: z.enum(["online", "in-person", "both"]).optional(),
    city: z.string().max(100).optional(),
    schedule: z.string().min(1, "Schedule is required").max(200),
    selectedDate: z.string().optional(),
    selectedStartTime: z.string().optional(),
    selectedEndTime: z.string().optional(),
    });

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type PlaceBidInput = z.infer<typeof placeBidSchema>;
export const counterOfferSchema = z.object({ amount: z.number().positive(), message: z.string().max(500).optional() });
export const renewOfferSchema = z.object({ amount: z.number().positive(), message: z.string().max(500).optional(), availability: z.string().max(300).optional() });
export type CreateDirectBookingRequestInput = z.infer<typeof createDirectBookingRequestSchema>;

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
