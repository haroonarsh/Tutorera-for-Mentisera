import { z } from "zod";
import { Request, Response, NextFunction } from "express";

export const submitContactSchema = z.object({
    name: z.string().min(2, "Name is required").max(100),
    email: z.string().email("Invalid email address"),
    phone: z.string().max(20).optional(),
    userType: z.enum(["student", "parent", "tutor", "other"]).optional(),
    bookingReference: z.string().max(100).optional(),
    transactionReference: z.string().max(100).optional(),
    subject: z.string().min(2, "Subject is required").max(150),
    message: z.string().min(5, "Message is required").max(2000),
});

export const submitSupportRequestSchema = z.object({
    subject: z.string().min(2, "Subject is required").max(150),
    message: z.string().min(5, "Message is required").max(2000),
    bookingId: z.string().max(100).optional(),
    priority: z.enum(["normal", "urgent"]).optional(),
});

export type SubmitContactInput = z.infer<typeof submitContactSchema>;
export type SubmitSupportRequestInput = z.infer<typeof submitSupportRequestSchema>;

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
