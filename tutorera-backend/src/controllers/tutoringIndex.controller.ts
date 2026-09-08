import { Response } from "express";
import { AuthRequest } from "../types";
import Request from "../models/Request.model";
import Booking from "../models/Booking.model";
import TutorProfile from "../models/TutorProfile.model";
import Bid from "../models/Bid.model";

const MIN_SAMPLE = 5;
const PERIODS: Record<string, number> = { "3m": 3, "6m": 6, "12m": 12 };
const average = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;

export const getTutoringIndex = async (req: AuthRequest, res: Response): Promise<void> => {
  const country = String(req.query.country || "").toUpperCase();
  const currency = String(req.query.currency || "").toUpperCase();
  const periodKey = String(req.query.period || "6m");
  const subjectFilter = req.query.subject ? String(req.query.subject) : undefined;
  if (!/^[A-Z]{2}$/.test(country) || !/^[A-Z]{3}$/.test(currency)) {
    res.status(400).json({ success: false, code: "MARKET_FILTER_REQUIRED", message: "country (ISO alpha-2) and currency (ISO 4217) are required so unlike currencies are never combined." });
    return;
  }
  if (!PERIODS[periodKey]) {
    res.status(400).json({ success: false, message: "period must be 3m, 6m, or 12m." });
    return;
  }

  const from = new Date();
  from.setMonth(from.getMonth() - PERIODS[periodKey]);
  const filter: Record<string, unknown> = { createdAt: { $gte: from }, status: { $ne: "draft" }, countryCode: country, currency };
  if (subjectFilter) filter.subject = subjectFilter;
  const requests = await Request.find(filter).select("subject budget city teachingMode createdAt").lean();
  const requestIds = requests.map((item) => item._id);
  const [bookings, bids, totalTutors, verifiedTutors] = await Promise.all([
    Booking.find({ request: { $in: requestIds }, createdAt: { $gte: from } }).select("request finalAgreedRate createdAt").lean(),
    Bid.find({ request: { $in: requestIds }, createdAt: { $gte: from }, status: { $nin: ["withdrawn", "pending"] }, currency }).select("amount request createdAt").lean(),
    TutorProfile.countDocuments({ countryCode: country, verificationStatus: "approved" }),
    TutorProfile.countDocuments({ countryCode: country, isVerified: true }),
  ]);
  const requestById = new Map(requests.map((item) => [item._id.toString(), item]));
  const subjects = [...new Set(requests.map((item) => item.subject))].map((subject) => {
    const subjectRequests = requests.filter((item) => item.subject === subject);
    const ids = new Set(subjectRequests.map((item) => item._id.toString()));
    const subjectBids = bids.filter((item) => ids.has(item.request.toString()));
    const subjectBookings = bookings.filter((item) => ids.has(item.request.toString()));
    const responseHours = subjectBids.map((offer) => {
      const source = requestById.get(offer.request.toString());
      return source ? (new Date(offer.createdAt).getTime() - new Date(source.createdAt).getTime()) / 3_600_000 : 0;
    }).filter((value) => value >= 0);
    const cityCounts = new Map<string, number>();
    subjectRequests.forEach((item) => item.city && cityCounts.set(item.city, (cityCounts.get(item.city) || 0) + 1));
    const modeCount = { online: 0, inPerson: 0, both: 0 };
    subjectRequests.forEach((item) => item.teachingMode === "online" ? modeCount.online++ : item.teachingMode === "in-person" ? modeCount.inPerson++ : modeCount.both++);
    const totalModes = subjectRequests.length || 1;
    return {
      subject, totalRequests: subjectRequests.length, avgBudget: average(subjectRequests.map((item) => item.budget).filter(Boolean)),
      minBudget: subjectRequests.length ? Math.min(...subjectRequests.map((item) => item.budget).filter(Boolean)) : 0,
      maxBudget: subjectRequests.length ? Math.max(...subjectRequests.map((item) => item.budget).filter(Boolean)) : 0,
      avgOfferRate: average(subjectBids.map((item) => item.amount).filter(Boolean)),
      avgFinalRate: average(subjectBookings.map((item) => item.finalAgreedRate).filter(Boolean)),
      avgResponseHours: Math.round((responseHours.reduce((sum, value) => sum + value, 0) / (responseHours.length || 1)) * 10) / 10,
      topCities: [...cityCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([city, count]) => ({ city, count })),
      teachingModeSplit: { online: Math.round(modeCount.online / totalModes * 100), inPerson: Math.round(modeCount.inPerson / totalModes * 100), both: Math.round(modeCount.both / totalModes * 100) },
    };
  }).filter((item) => item.totalRequests >= MIN_SAMPLE).sort((a, b) => b.totalRequests - a.totalRequests);

  const trends = [...new Set(requests.map((item) => new Date(item.createdAt).toISOString().slice(0, 7)))].sort().map((month) => {
    const monthRequests = requests.filter((item) => new Date(item.createdAt).toISOString().startsWith(month));
    const ids = new Set(monthRequests.map((item) => item._id.toString()));
    const monthBookings = bookings.filter((item) => ids.has(item.request.toString()));
    return { month, requests: monthRequests.length, bookings: monthBookings.length, avgRate: average(monthBookings.map((item) => item.finalAgreedRate).filter(Boolean)) };
  });

  res.json({ success: true, index: {
    market: { country, currency }, methodologyVersion: "2.0", minimumSampleSize: MIN_SAMPLE,
    publishedAt: new Date().toISOString(), period: { key: periodKey, from: from.toISOString(), to: new Date().toISOString() },
    summary: { totalRequests: requests.length, totalBookings: bookings.length, totalTutors, verifiedTutors, subjectsCovered: subjects.length },
    subjects, trends,
  } });
};
