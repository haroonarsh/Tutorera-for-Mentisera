import { z } from "zod";
import { Request, Response, NextFunction } from "express";

const weeklySlotSchema = z.object({
    day: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Start time must be in HH:MM 24-hour format"),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "End time must be in HH:MM 24-hour format"),
});

export const saveAvailabilitySchema = z.object({
    weeklySlots: z.array(weeklySlotSchema).min(0),
    blockedDates: z.array(z.string()).optional(),
});

export type SaveAvailabilityInput = z.infer<typeof saveAvailabilitySchema>;

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