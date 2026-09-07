import { Response } from "express";
import { AuthRequest } from "../types";
import Booking from "../models/Booking.model";
import TutorProfile from "../models/TutorProfile.model";

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export const getPricingInsight = async (req: AuthRequest, res: Response): Promise<void> => {
  const { city, subject, teachingMode } = req.query;

  const match: Record<string, unknown> = { paymentStatus: "confirmed", status: "completed" };
  if (city) match["request.city"] = city;
  if (subject) match["request.subject"] = { $regex: subject, $options: "i" };
  if (teachingMode) match.teachingMode = teachingMode;

  const bookings = await Booking.find(match)
    .populate<{ request: { city?: string; subject?: string } }>("request", "city subject")
    .select("finalAgreedRate pricingUnit teachingMode")
    .lean();

  const profileMatch: Record<string, unknown> = {};
  if (city) profileMatch.city = city;
  if (subject) profileMatch.subjects = { $elemMatch: { $regex: subject, $options: "i" } };

  const profiles = profileMatch.city || profileMatch.subjects
    ? await TutorProfile.find(profileMatch).select("hourlyRate currency").lean()
    : [];

  const bookingRates = bookings
    .map((b) => {
      const amount = b.finalAgreedRate || 0;
      if (b.pricingUnit === "hour") return amount;
      if (b.pricingUnit === "session") return amount * 2;
      if (b.pricingUnit === "month") return amount / 4;
      return amount;
    })
    .filter(Boolean);

  const profileRates = profiles
    .map((p) => (p.currency === "PKR" ? p.hourlyRate : 0))
    .filter((r) => r > 0);

  const allRates = [...bookingRates, ...profileRates];

  const insight = {
    count: allRates.length,
    min: allRates.length ? Math.min(...allRates) : null,
    max: allRates.length ? Math.max(...allRates) : null,
    median: allRates.length ? median(allRates) : null,
    sampleSource: {
      completedBookings: bookingRates.length,
      activeProfiles: profileRates.length,
    },
  };

  res.status(200).json({ success: true, insight });
};
