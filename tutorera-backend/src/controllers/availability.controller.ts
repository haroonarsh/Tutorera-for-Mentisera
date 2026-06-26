import { Response } from "express";
import { AuthRequest } from "../types";
import TutorAvailability from "../models/TutorAvailability.model";
import BookedSlot from "../models/BookedSlot.model";

// @desc    Save tutor's weekly availability
// @route   POST /api/tutors/availability
// @access  Private (tutor)
export const saveAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  const { weeklySlots, blockedDates } = req.body;

  const availability = await TutorAvailability.findOneAndUpdate(
    { tutor: req.user?._id },
    { tutor: req.user?._id, weeklySlots, blockedDates: blockedDates || [] },
    { upsert: true, new: true }
  );

  res.status(200).json({ success: true, availability });
};

// @desc    Get tutor's availability + generate next 14 days of open slots
// @route   GET /api/tutors/:tutorUserId/availability
// @access  Public
export const getTutorAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  const { tutorUserId } = req.params;

  const availability = await TutorAvailability.findOne({ tutor: tutorUserId });

  if (!availability || availability.weeklySlots.length === 0) {
    res.status(200).json({ success: true, slots: [], hasAvailability: false });
    return;
  }

  // Generate next 14 days of available slots
  const slots: { date: string; dayName: string; startTime: string; endTime: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayName = dayNames[date.getDay()];

    // Check if this date is blocked
    const isBlocked = availability.blockedDates.some(bd => {
      const blocked = new Date(bd);
      return blocked.toDateString() === date.toDateString();
    });
    if (isBlocked) continue;

    // Find weekly slots for this day
    const daySlots = availability.weeklySlots.filter(s => s.day === dayName);

    for (const slot of daySlots) {
      // Check if this specific slot is already booked
      const isBooked = await BookedSlot.findOne({
        tutor: tutorUserId,
        date: {
          $gte: new Date(date.setHours(0, 0, 0, 0)),
          $lte: new Date(date.setHours(23, 59, 59, 999)),
        },
        startTime: slot.startTime,
      });

      if (!isBooked) {
        slots.push({
          date: date.toISOString().split("T")[0],   // "2026-07-07"
          dayName,
          startTime: slot.startTime,
          endTime: slot.endTime,
        });
      }
    }
  }

  res.status(200).json({ success: true, slots, hasAvailability: true });
};

// @desc    Get my availability (tutor)
// @route   GET /api/tutors/availability/me
// @access  Private (tutor)
export const getMyAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  const availability = await TutorAvailability.findOne({ tutor: req.user?._id });
  res.status(200).json({ success: true, availability: availability || null });
};