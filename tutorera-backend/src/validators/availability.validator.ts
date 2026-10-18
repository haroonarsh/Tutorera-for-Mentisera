import { z } from "zod";
import { Request, Response, NextFunction } from "express";

const weeklySlotSchema = z.object({
  day: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
  startTime: z.string().regex(/^([01]\\d|2[0-3]):([0-5]\\d)$/, "Start time must be in 24-hour HH:mm format"),
  endTime: z.string().regex(/^([01]\\d|2[0-3]):([0-5]\\d)$/, "End time must be in 24-hour HH:mm format"),
}).refine((slot) => slot.endTime > slot.startTime, { path: ["endTime"], message: "End time must be after start time." });

export const saveAvailabilitySchema = z.object({
  weeklySlots: z.array(weeklySlotSchema).max(70, "Too many weekly availability windows."),
  blockedDates: z.array(z.string().date()).max(365).optional(),
}).superRefine((value, context) => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  for (const day of days) {
    const sameDay = value.weeklySlots.filter(slot => slot.day === day).sort((a,b) => a.startTime.localeCompare(b.startTime));
    for (let i = 1; i < sameDay.length; i++) {
      if (sameDay[i].startTime < sameDay[i - 1].endTime) {
        context.addIssue({ code: "custom", path: ["weeklySlots"], message: `Overlapping availability windows on ${day} are not allowed.` });
        break;
      }
    }
  }
});

export type SaveAvailabilityInput = z.infer<typeof saveAvailabilitySchema>;

export const validate = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction): void => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map(issue => issue.message);
    res.status(400).json({ success: false, message: errors[0], errors });
    return;
  }
  req.body = result.data;
  next();
};
