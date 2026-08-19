import { z } from "zod";
import { Request, Response, NextFunction } from "express";

export const createRequestSchema = z.object({
    subject: z.string().min(2, "Subject is required").max(100),
    level: z.enum(["Primary", "Middle", "Matric", "Intermediate", "O-Level", "A-Level", "University", "Other"]),
    description: z.string().min(10, "Description must be at least 10 characters").max(1000),
    budget: z.number().positive("Budget must be a positive number"),
    teachingMode: z.enum(["online", "in-person", "both"]),
    city: z.string().max(100).optional(),
    schedule: z.string().min(1, "Schedule is required").max(200),
    });

    export const placeBidSchema = z.object({
    amount: z.number().positive("Bid amount must be a positive number"),
    message: z.string().max(500, "Message must be under 500 characters").optional(),
    });

export const createDirectBookingRequestSchema = z.object({
    tutorId: z.string().min(1, "Tutor ID is required"),
    subject: z.string().min(2, "Subject is required").max(100),
    level: z.enum(["Primary", "Middle", "Matric", "Intermediate", "O-Level", "A-Level", "University", "Other"]),
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