import { z } from "zod";
import { Request, Response, NextFunction } from "express";

export const updateBookingStatusSchema = z.object({
    status: z.enum(["ongoing", "cancelled"], {
        message: "Status must be 'ongoing' or 'cancelled'",
    }),
    cancelReason: z.string().max(500, "Reason must be under 500 characters").optional(),
    });

export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;

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