import { z } from "zod";

export const updateAdminPaymentSchema = z.object({
  paymentStatus: z.enum(["pending", "received", "confirmed", "failed", "refunded", "partially_refunded", "chargeback", "disputed"]).optional(),
  paymentNote: z.string().trim().min(8).max(500).optional(),
  payoutStatus: z.enum(["pending", "approved", "processing", "paid", "failed", "held"]).optional(),
  payoutNote: z.string().trim().min(8).max(500).optional(),
}).strict().superRefine((value, context) => {
  const paymentChange = value.paymentStatus !== undefined;
  const payoutChange = value.payoutStatus !== undefined;
  if (paymentChange === payoutChange) context.addIssue({ code: "custom", message: "Change exactly one of paymentStatus or payoutStatus." });
  if (paymentChange && !value.paymentNote) context.addIssue({ code: "custom", path: ["paymentNote"], message: "A payment change reason of at least 8 characters is required." });
  if (payoutChange && !value.payoutNote) context.addIssue({ code: "custom", path: ["payoutNote"], message: "A payout change reason of at least 8 characters is required." });
});
