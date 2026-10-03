import { Response } from "express";
import { AuthRequest } from "../types";
import Booking from "../models/Booking.model";
import TutorProfile from "../models/TutorProfile.model";
import { getLatestRates } from "../services/exchangeRate.service";
import { SUPPORTED_CURRENCIES } from "../config/countries";

const BASE_CURRENCY = "USD";

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function hourlyEquivalent(amount: number, pricingUnit?: string): number {
  if (pricingUnit === "session") return amount * 2;
  if (pricingUnit === "month") return amount / 4;
  return amount;
}

/**
 * Rates come from the shared exchangeRate service (base USD, so a row is
 * divided by its rate). Markets whose currency is missing from that snapshot
 * fall back to the static rateToUSD table so legacy rows are never dropped or
 * silently treated as USD.
 */
async function loadUsdConverter(): Promise<(amount: number, currency?: string) => number | null> {
  let liveRates: Record<string, number> = {};
  try {
    liveRates = await getLatestRates();
  } catch {
    liveRates = {};
  }

  return (amount, currency) => {
    const code = (currency || "").toUpperCase();
    if (!code) return null;
    if (code === BASE_CURRENCY) return amount;

    const liveRate = liveRates[code];
    if (typeof liveRate === "number" && liveRate > 0) return amount / liveRate;

    const staticRate = SUPPORTED_CURRENCIES[code]?.rateToUSD;
    if (typeof staticRate === "number" && staticRate > 0) return amount * staticRate;

    return null;
  };
}

export const getPricingInsight = async (req: AuthRequest, res: Response): Promise<void> => {
  const { city, subject, teachingMode } = req.query;

  const match: Record<string, unknown> = { paymentStatus: "confirmed", status: "completed" };
  if (city) match["request.city"] = city;
  if (subject) match["request.subject"] = { $regex: subject, $options: "i" };
  if (teachingMode) match.teachingMode = teachingMode;

  const bookings = await Booking.find(match)
    .populate<{ request: { city?: string; subject?: string } }>("request", "city subject")
    .select("finalAgreedRate pricingUnit teachingMode currency")
    .lean();

  const profileMatch: Record<string, unknown> = {};
  if (city) profileMatch.city = city;
  if (subject) profileMatch.subjects = { $elemMatch: { $regex: subject, $options: "i" } };

  const profiles = profileMatch.city || profileMatch.subjects
    ? await TutorProfile.find(profileMatch).select("hourlyRate currency").lean()
    : [];

  const toUsd = await loadUsdConverter();
  const excluded = { missingCurrency: 0, unsupportedCurrency: 0 };

  const bookingRates = bookings
    .map((b) => {
      const amount = b.finalAgreedRate || 0;
      if (!amount) return null;
      const converted = toUsd(hourlyEquivalent(amount, b.pricingUnit), b.currency);
      if (converted === null) {
        if (b.currency) excluded.unsupportedCurrency += 1;
        else excluded.missingCurrency += 1;
        return null;
      }
      return converted > 0 ? converted : null;
    })
    .filter((r): r is number => r !== null);

  const profileRates = profiles
    .map((p) => {
      if (!p.hourlyRate) return null;
      const converted = toUsd(p.hourlyRate, p.currency);
      if (converted === null) {
        if (p.currency) excluded.unsupportedCurrency += 1;
        else excluded.missingCurrency += 1;
        return null;
      }
      return converted > 0 ? converted : null;
    })
    .filter((r): r is number => r !== null);

  const allRates = [...bookingRates, ...profileRates];

  const insight = {
    currency: BASE_CURRENCY,
    count: allRates.length,
    min: allRates.length ? Math.round(Math.min(...allRates)) : null,
    max: allRates.length ? Math.round(Math.max(...allRates)) : null,
    median: allRates.length ? median(allRates) : null,
    sampleSource: {
      completedBookings: bookingRates.length,
      activeProfiles: profileRates.length,
    },
    excluded: { ...excluded, total: excluded.missingCurrency + excluded.unsupportedCurrency },
  };

  res.status(200).json({ success: true, insight });
};