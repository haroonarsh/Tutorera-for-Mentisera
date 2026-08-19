import { z } from "zod";
import { Request, Response, NextFunction } from "express";

export const applyReferralCodeSchema = z.object({
    code: z.string().min(3, "Referral code is required").max(20),
});

export type ApplyReferralCodeInput = z.infer<typeof applyReferralCodeSchema>;

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