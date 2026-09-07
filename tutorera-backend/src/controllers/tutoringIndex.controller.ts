import { Response } from "express";
import { AuthRequest } from "../types";
import Request from "../models/Request.model";
import Booking from "../models/Booking.model";
import TutorProfile from "../models/TutorProfile.model";
import Bid from "../models/Bid.model";

interface TutoringIndexEntry {
  subject: string;
  totalRequests: number;
  avgBudget: number;
  minBudget: number;
  maxBudget: number;
  avgOfferRate: number;
  avgFinalRate: number;
  avgResponseHours: number;
  topCities: { city: string; count: number }[];
  topCountries: { country: string; count: number }[];
  teachingModeSplit: { online: number; inPerson: number; both: number };
}

interface TrendData {
  month: string;
  requests: number;
  bookings: number;
  avgRate: number;
}

export const getTutoringIndex = async (_req: AuthRequest, res: Response): Promise<void> => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const requests = await Request.find({
    createdAt: { $gte: sixMonthsAgo },
    status: { $ne: "draft" },
  })
    .select("subject budget pricingUnit countryName city teachingMode createdAt")
    .lean();

  const bookings = await Booking.find({
    createdAt: { $gte: sixMonthsAgo },
  })
    .populate<{ request: { subject: string } }>("request", "subject")
    .select("request finalAgreedRate pricingUnit createdAt")
    .lean();

  const bids = await Bid.find({
    createdAt: { $gte: sixMonthsAgo },
    status: { $nin: ["withdrawn", "pending"] },
  })
    .select("amount request createdAt")
    .lean();

  const subjects = [...new Set([
    ...requests.map((r) => r.subject),
    ...bookings.map((b) => (b.request as any)?.subject).filter(Boolean),
  ])];

  const subjectMap = new Map<string, {
    budgets: number[];
    finalRates: number[];
    responseMinutes: number[];
    cities: Map<string, number>;
    countries: Map<string, number>;
    online: number;
    inPerson: number;
    both: number;
    requestCount: number;
    bookingCount: number;
  }>();

  for (const s of subjects) {
    subjectMap.set(s, {
      budgets: [], finalRates: [], responseMinutes: [],
      cities: new Map(), countries: new Map(),
      online: 0, inPerson: 0, both: 0,
      requestCount: 0, bookingCount: 0,
    });
  }

  for (const req of requests) {
    const entry = subjectMap.get(req.subject);
    if (!entry) continue;
    if (req.budget) entry.budgets.push(req.budget);
    const mode = req.teachingMode || "both";
    if (mode === "online") entry.online++;
    else if (mode === "in-person") entry.inPerson++;
    else entry.both++;
    entry.requestCount++;
    const city = req.city || "Unknown";
    entry.cities.set(city, (entry.cities.get(city) || 0) + 1);
    const country = req.countryName || "Unknown";
    entry.countries.set(country, (entry.countries.get(country) || 0) + 1);
  }

  const requestSubjectMap = new Map<string, string>();
  for (const r of requests) requestSubjectMap.set(r._id.toString(), r.subject);
  for (const bid of bids) {
    const subject = requestSubjectMap.get(bid.request.toString());
    if (subject) {
      const entry = subjectMap.get(subject);
      if (entry) {
        const reqCreatedAt = requests.find((r) => r._id.toString() === bid.request.toString())?.createdAt;
        if (reqCreatedAt) {
          entry.responseMinutes.push((new Date(bid.createdAt).getTime() - new Date(reqCreatedAt).getTime()) / 60000);
        }
      }
    }
  }

  for (const booking of bookings) {
    const subject = (booking.request as any)?.subject;
    if (!subject) continue;
    const entry = subjectMap.get(subject);
    if (!entry) continue;
    if (booking.finalAgreedRate) entry.finalRates.push(booking.finalAgreedRate);
    entry.bookingCount++;
  }

  const indexData: TutoringIndexEntry[] = [];
  for (const [subject, data] of subjectMap) {
    if (data.requestCount === 0 && data.bookingCount === 0) continue;

    const topCities = Array.from(data.cities.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([city, count]) => ({ city, count }));
    const topCountries = Array.from(data.countries.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([country, count]) => ({ country, count }));

    const totalModes = data.online + data.inPerson + data.both || 1;

    indexData.push({
      subject,
      totalRequests: data.requestCount,
      avgBudget: data.budgets.length ? Math.round(data.budgets.reduce((s, v) => s + v, 0) / data.budgets.length) : 0,
      minBudget: data.budgets.length ? Math.min(...data.budgets) : 0,
      maxBudget: data.budgets.length ? Math.max(...data.budgets) : 0,
      avgOfferRate: data.budgets.length ? Math.round(data.budgets.reduce((s, v) => s + v, 0) / data.budgets.length) : 0,
      avgFinalRate: data.finalRates.length ? Math.round(data.finalRates.reduce((s, v) => s + v, 0) / data.finalRates.length) : 0,
      avgResponseHours: data.responseMinutes.length ? Math.round(data.responseMinutes.reduce((s, v) => s + v, 0) / data.responseMinutes.length / 60 * 10) / 10 : 0,
      topCities,
      topCountries,
      teachingModeSplit: {
        online: Math.round((data.online / totalModes) * 100),
        inPerson: Math.round((data.inPerson / totalModes) * 100),
        both: Math.round((data.both / totalModes) * 100),
      },
    });
  }

  indexData.sort((a, b) => b.totalRequests - a.totalRequests);

  const monthSet = new Set<string>();
  for (const req of requests) {
    const d = new Date(req.createdAt);
    monthSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const monthlyData: TrendData[] = [];
  for (const month of [...monthSet].sort()) {
    const [year, monthNum] = month.split("-");
    const start = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    const end = new Date(parseInt(year), parseInt(monthNum), 0);

    const monthRequests = requests.filter((r) => {
      const d = new Date(r.createdAt);
      return d >= start && d <= end;
    });
    const monthBookings = bookings.filter((b) => {
      const d = new Date(b.createdAt);
      return d >= start && d <= end;
    });
    const rates = monthBookings.map((b) => b.finalAgreedRate).filter(Boolean);

    monthlyData.push({
      month,
      requests: monthRequests.length,
      bookings: monthBookings.length,
      avgRate: rates.length ? Math.round(rates.reduce((s, v) => s + v, 0) / rates.length) : 0,
    });
  }

  const totalTutors = await TutorProfile.countDocuments({ verificationStatus: "approved" });
  const verifiedTutors = await TutorProfile.countDocuments({ isVerified: true });

  res.status(200).json({
    success: true,
    index: {
      publishedAt: new Date().toISOString(),
      period: { from: sixMonthsAgo.toISOString(), to: new Date().toISOString() },
      summary: {
        totalRequests: requests.length,
        totalBookings: bookings.length,
        totalTutors,
        verifiedTutors,
        subjectsCovered: indexData.length,
      },
      subjects: indexData,
      trends: monthlyData,
    },
  });
};
