import { z } from "zod";
import { Request, Response, NextFunction } from "express";

export const submitClaimSchema = z.object({
    bookingId: z.string().min(1, "Booking ID is required"),
    reason: z.string().min(3, "Reason is required").max(200, "Reason must be under 200 characters"),
    details: z.string().max(1000, "Details must be under 1000 characters").optional(),
    });

export const updateClaimStatusSchema = z.object({
    status: z.enum(["approved", "rejected"], {
        message: "Status must be 'approved' or 'rejected'",
    }),
    adminNote: z.string().max(500, "Note must be under 500 characters").optional(),
    });

export type SubmitClaimInput = z.infer<typeof submitClaimSchema>;
export type UpdateClaimStatusInput = z.infer<typeof updateClaimStatusSchema>;

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