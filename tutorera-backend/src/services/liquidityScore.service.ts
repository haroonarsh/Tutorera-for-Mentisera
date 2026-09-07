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

  const baseFilter: Record<string, unknown> = {};
  if (countryCode) baseFilter.countryCode = countryCode;
  if (city) baseFilter.city = new RegExp(city, "i");
  if (subject) baseFilter.subjects = new RegExp(subject, "i");
  if (teachingMode && teachingMode !== "both") {
    baseFilter.teachingMode = { $in: [teachingMode, "both"] };
  }

  const openStatus = ["open", "published", "receiving_offers"] as const;
  const demandFilter = { ...baseFilter, status: { $in: openStatus }, expiresAt: { $gt: now } };
  const recentFilter = { ...baseFilter, createdAt: { $gte: thirtyDaysAgo } };

  const [openRequests, recentRequests, tutors, recentBookings] = await Promise.all([
    Request.countDocuments(demandFilter),
    Request.countDocuments(recentFilter),
    TutorProfile.countDocuments({ ...baseFilter, verificationStatus: "approved", marketplaceEligible: true }),
    Booking.find({ ...baseFilter, createdAt: { $gte: thirtyDaysAgo }, status: { $in: ["completed", "upcoming", "in_progress"] } as any })
      .select("finalAgreedRate tutorPayout")
      .lean(),
  ]);

  const recentRequestIds = recentRequests > 0
    ? await Request.find(recentFilter).select("_id").lean()
    : [];
  const reqIds = (recentRequestIds as any[]).map((r) => r._id);

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

  const cities = await Request.distinct("city", { ...filter, city: { $exists: true, $ne: "" } });
  const subjects = await Request.distinct("subject", { ...filter, subject: { $exists: true, $ne: "" } });
  const modes = ["online", "in-person"] as const;

  const results: Record<string, LiquidityScore> = {};

  for (const city of cities) {
    for (const subject of subjects) {
      for (const mode of modes) {
        const key = `${city}|${subject}|${mode}`;
        results[key] = await computeLiquidityScore({ city, subject, teachingMode: mode, countryCode });
      }
    }
  }

  return results;
}
