import TutorProfile from "../models/TutorProfile.model";
import Request from "../models/Request.model";
import Bid from "../models/Bid.model";
import Booking from "../models/Booking.model";

interface LiquidityInput {
  countryCode?: string;
  city?: string;
  subject?: string;
  teachingMode?: string;
}

interface LiquidityScore {
  score: number; // 0-100
  grade: "High" | "Moderate" | "Low" | "Very Low";
  components: {
    demandScore: number;      // 0-100
    supplyScore: number;      // 0-100
    fillRateScore: number;    // 0-100
    competitionScore: number; // 0-100
  };
  meta: {
    openRequests: number;
    eligibleTutors: number;
    fillRate: number;         // 0-1
    avgOffersPerRequest: number;
    avgSessionPrice: number;
    sampleSize: number;
  };
}

const GRADE_THRESHOLDS = { high: 75, moderate: 50, low: 25 };

function gradeFromScore(score: number): "High" | "Moderate" | "Low" | "Very Low" {
  if (score >= GRADE_THRESHOLDS.high) return "High";
  if (score >= GRADE_THRESHOLDS.moderate) return "Moderate";
  if (score >= GRADE_THRESHOLDS.low) return "Low";
  return "Very Low";
}

function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}

function percentileScore(value: number, min: number, max: number): number {
  if (max <= min) return 50;
  return clamp(((value - min) / (max - min)) * 100);
}

export async function computeLiquidityScore(input: LiquidityInput): Promise<LiquidityScore> {
  const { countryCode, city, subject, teachingMode } = input;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const requestFilter: Record<string, unknown> = {};
  const tutorFilter: Record<string, unknown> = {};
  if (countryCode) requestFilter.countryCode = tutorFilter.countryCode = countryCode.toUpperCase();
  if (city) requestFilter.city = tutorFilter.city = new RegExp(`^${escapeRegExp(city)}$`, "i");
  if (subject) {
    requestFilter.subject = new RegExp(`^${escapeRegExp(subject)}$`, "i");
    tutorFilter.subjects = new RegExp(`^${escapeRegExp(subject)}$`, "i");
  }
  if (teachingMode && teachingMode !== "both") {
    requestFilter.teachingMode = tutorFilter.teachingMode = { $in: [teachingMode, "both"] };
  }

  const openStatus = ["open", "published", "receiving_offers"] as const;
  const demandFilter = { ...requestFilter, status: { $in: openStatus }, expiresAt: { $gt: now } };
  // Demand filters must exclude drafts/cancelled requests; those records are
  // not actionable marketplace demand and otherwise inflate liquidity.
  const recentFilter = {
    ...requestFilter,
    status: { $nin: ["draft", "cancelled"] },
    createdAt: { $gte: thirtyDaysAgo },
  };

  const [openRequests, recentRequestDocs, tutors] = await Promise.all([
    Request.countDocuments(demandFilter),
    Request.find(recentFilter as any).select("_id").lean(),
    TutorProfile.countDocuments({ ...tutorFilter, verificationStatus: "approved", marketplaceEligible: true }),
  ]);

  const recentRequestIds = recentRequestDocs.map((r) => r._id);
  const recentRequests = recentRequestIds.length;
  // Booking stores its market dimensions through `request`; applying the
  // Request filter directly to Booking silently returned zero price samples.
  const recentBookings = recentRequestIds.length
    ? await Booking.find({
        request: { $in: recentRequestIds },
        createdAt: { $gte: thirtyDaysAgo },
        status: { $in: ["completed", "upcoming", "ongoing"] },
      }).select("finalAgreedRate tutorPayout").lean()
    : [];

  const reqIds = recentRequestIds;

  let fillRate = 0;
  let avgOffersPerRequest = 0;
  let avgSessionPrice = 0;

  if (reqIds.length > 0) {
    const bids = await Bid.find({ request: { $in: reqIds } })
      .select("request amount")
      .lean();

    const bidsByRequest = new Map<string, typeof bids>();
    for (const bid of bids) {
      const key = bid.request.toString();
      if (!bidsByRequest.has(key)) bidsByRequest.set(key, []);
      bidsByRequest.get(key)!.push(bid);
    }

    const filledRequests = Array.from(bidsByRequest.values()).filter((b) => b.length > 0).length;
    fillRate = filledRequests / reqIds.length;

    const totalOffers = bids.length;
    avgOffersPerRequest = totalOffers / reqIds.length;
  }

  if (recentBookings.length > 0) {
    const prices = (recentBookings as any[]).map((b) => b.finalAgreedRate || b.tutorPayout || 0).filter(Boolean);
    avgSessionPrice = prices.length > 0 ? prices.reduce((s, p) => s + p, 0) / prices.length : 0;
  }

  const demandScore = clamp(Math.min(openRequests * 8, 100) + Math.min(recentRequests * 3, 50), 0, 100);
  const supplyScore = clamp(Math.min(tutors * 5, 100), 0, 100);
  const fillRateScore = clamp(fillRate * 100, 0, 100);
  const competitionScore = clamp(avgOffersPerRequest * 12, 0, 100);

  const rawScore = (demandScore * 0.25) + (supplyScore * 0.25) + (fillRateScore * 0.30) + (competitionScore * 0.20);
  const score = Math.round(clamp(rawScore, 0, 100));

  const sampleSize = recentRequests + tutors;

  return {
    score,
    grade: gradeFromScore(score),
    components: {
      demandScore: Math.round(demandScore),
      supplyScore: Math.round(supplyScore),
      fillRateScore: Math.round(fillRateScore),
      competitionScore: Math.round(competitionScore),
    },
    meta: {
      openRequests,
      eligibleTutors: tutors,
      fillRate: Math.round(fillRate * 100) / 100,
      avgOffersPerRequest: Math.round(avgOffersPerRequest * 10) / 10,
      avgSessionPrice: Math.round(avgSessionPrice),
      sampleSize,
    },
  };
}

export async function getAllLiquidityScores(countryCode?: string): Promise<Record<string, LiquidityScore>> {
  const filter: Record<string, unknown> = {};
  if (countryCode) filter.countryCode = countryCode;

  const requests = await Request.find({
    ...filter,
    city: { $exists: true, $ne: "" },
    subject: { $exists: true, $ne: "" },
    status: { $nin: ["draft", "cancelled", "archived"] },
  }).select("city subject teachingMode").lean();
  const segments = new Map<string, { city: string; subject: string; teachingMode: "online" | "in-person" }>();
  for (const request of requests) {
    const modes: Array<"online" | "in-person"> = request.teachingMode === "both" ? ["online", "in-person"] : [request.teachingMode];
    for (const teachingMode of modes) {
      const key = `${request.city}|${request.subject}|${teachingMode}`;
      segments.set(key.toLocaleLowerCase(), { city: request.city!, subject: request.subject, teachingMode });
    }
  }
  const scored = await Promise.all(Array.from(segments.values()).map(async (segment) => ({
    key: `${segment.city}|${segment.subject}|${segment.teachingMode}`,
    value: await computeLiquidityScore({ ...segment, countryCode }),
  })));
  return Object.fromEntries(scored.map(({ key, value }) => [key, value]));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
