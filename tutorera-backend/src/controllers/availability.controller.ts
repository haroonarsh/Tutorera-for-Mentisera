import { Response } from "express";
import { isValidObjectId } from "mongoose";
import { AuthRequest } from "../types";
import TutorAvailability from "../models/TutorAvailability.model";
import TutorProfile from "../models/TutorProfile.model";
import { listTutorOpenSlots, normalizeTutorTimezone } from "../services/availability.service";

// Save the canonical calendar the matching engine also reads.
export const saveAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  const { weeklySlots, blockedDates } = req.body;
  const availability = await TutorAvailability.findOneAndUpdate(
    { tutor: req.user?._id },
    { $set: { weeklySlots, ...(blockedDates !== undefined ? { blockedDates } : {}) } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.status(200).json({ success: true, availability });
};

// Every advertised slot is evaluated in the tutor's own timezone, and a
// partial overlap against confirmed teaching time hides the entire window.
export const getTutorAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  const { tutorUserId } = req.params;
  if (!isValidObjectId(tutorUserId)) {
    res.status(400).json({ success: false, message: "Invalid tutor reference." });
    return;
  }
  const [calendar, profile] = await Promise.all([
    TutorAvailability.findOne({ tutor: tutorUserId }).lean(),
    TutorProfile.findOne({ user: tutorUserId }).select("timezone").lean(),
  ]);
  const timezone = normalizeTutorTimezone(profile?.timezone);
  if (!calendar || calendar.weeklySlots.length === 0) {
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ success: true, slots: [], hasAvailability: false, timezone });
    return;
  }
  const slots = await listTutorOpenSlots(tutorUserId, calendar, timezone);
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ success: true, slots, hasAvailability: slots.length > 0, timezone });
};

export const getMyAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  const [availability, profile] = await Promise.all([
    TutorAvailability.findOne({ tutor: req.user?._id }),
    TutorProfile.findOne({ user: req.user?._id }).select("timezone").lean(),
  ]);
  res.status(200).json({ success: true, availability: availability || null, timezone: normalizeTutorTimezone(profile?.timezone) });
};
