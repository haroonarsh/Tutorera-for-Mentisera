import { z } from "zod";
import { Request, Response, NextFunction } from "express";

export const sendMessageSchema = z.object({
    content: z.string().min(1, "Message cannot be empty").max(2000, "Message must be under 2000 characters"),
});

export const getOrCreateConversationSchema = z.object({
    bookingId: z.string().min(1, "Booking ID is required"),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type GetOrCreateConversationInput = z.infer<typeof getOrCreateConversationSchema>;

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