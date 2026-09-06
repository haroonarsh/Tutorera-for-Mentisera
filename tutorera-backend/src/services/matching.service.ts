// src/services/matching.service.ts
// Production-Ready TUTORERA Smart Matching Engine
// 8-Layer Two-Sided Recommender Architecture with Bayesian Rating, Timezone Normalization & Explainability

import mongoose, { Types } from "mongoose";
import TutorProfile, { ITutorProfile } from "../models/TutorProfile.model";
import Request, { IRequest } from "../models/Request.model";
import User from "../models/User.model";
import Bid, { IBid } from "../models/Bid.model";
import Booking from "../models/Booking.model";
import Review from "../models/Review.model";
import GuaranteeClaim from "../models/GuaranteeClaim.model";
import MatchLog, { IMatchLog } from "../models/MatchLog.model";
import MatchingConfig from "../models/MatchingConfig.model";
import {
  DEFAULT_MATCHING_CONFIG,
  MatchingConfigData,
  SUBJECT_ALIASES,
  LEVEL_HIERARCHY,
} from "../config/matchingConfig";
import { convertCurrencyRate } from "../config/countries";
import { sendNotification } from "../utils/socket";
import logger from "../config/logger";

export interface MatchReason {
  text: string;
  category: "subject" | "curriculum" | "availability" | "budget" | "location" | "quality" | "verification";
}

export interface MatchScoreResult {
  score: number;
  tier: "excellent" | "strong" | "good" | "other";
  scoreBreakdown: Record<string, number>;
  reasons: string[];
  algorithmVersion: string;
  isColdStartExploration: boolean;
  currencyConversion?: {
    originalRate: number;
    originalCurrency: string;
    convertedRate: number;
    targetCurrency: string;
    exchangeRate: number;
  };
}

export interface RankedTutorMatch {
  tutor: any;
  tutorProfile: any;
  matchScore: number;
  tier: "excellent" | "strong" | "good" | "other";
  scoreBreakdown: Record<string, number>;
  reasons: string[];
  isColdStartExploration: boolean;
}

export interface RankedRequestMatch {
  request: any;
  matchScore: number;
  tier: "excellent" | "strong" | "good" | "other";
  scoreBreakdown: Record<string, number>;
  reasons: string[];
}

export class MatchingService {
  private static cachedConfig: MatchingConfigData | null = null;
  private static configCacheTime = 0;

  /**
   * Retrieves active matching weights and thresholds from DB or fallback
   */
  public static async getActiveConfig(): Promise<MatchingConfigData> {
    const now = Date.now();
    if (this.cachedConfig && now - this.configCacheTime < 60000) {
      return this.cachedConfig;
    }
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      return DEFAULT_MATCHING_CONFIG;
    }
    try {
      const dbConfig = await MatchingConfig.findOne().sort({ updatedAt: -1 }).lean();
      if (dbConfig) {
        this.cachedConfig = {
          algorithmVersion: dbConfig.algorithmVersion || DEFAULT_MATCHING_CONFIG.algorithmVersion,
          onlineWeights: dbConfig.onlineWeights || DEFAULT_MATCHING_CONFIG.onlineWeights,
          homeWeights: dbConfig.homeWeights || DEFAULT_MATCHING_CONFIG.homeWeights,
          thresholds: dbConfig.thresholds || DEFAULT_MATCHING_CONFIG.thresholds,
          bayesian: dbConfig.bayesian || DEFAULT_MATCHING_CONFIG.bayesian,
          coldStart: dbConfig.coldStart || DEFAULT_MATCHING_CONFIG.coldStart,
        };
        this.configCacheTime = now;
        return this.cachedConfig;
      }
    } catch (err) {
      logger.warn({ err }, "Could not fetch dynamic matching config, using defaults.");
    }
    this.cachedConfig = DEFAULT_MATCHING_CONFIG;
    this.configCacheTime = now;
    return this.cachedConfig;
  }

  /**
   * Bayesian Weighted Rating Formula:
   * (v / (v + m)) * R + (m / (v + m)) * C
   */
  public static calculateBayesianRating(
    rating: number,
    reviewCount: number,
    globalMean = DEFAULT_MATCHING_CONFIG.bayesian.globalMeanRating,
    minThreshold = DEFAULT_MATCHING_CONFIG.bayesian.minReviewThreshold
  ): number {
    if (reviewCount === 0) return globalMean;
    return (
      (reviewCount / (reviewCount + minThreshold)) * rating +
      (minThreshold / (reviewCount + minThreshold)) * globalMean
    );
  }

  /**
   * Layer 1: Hard Eligibility Filtering
   * Eliminates ineligible tutors before scoring to prevent wasted computation.
   */
  public static async getEligibleTutors(
    request: IRequest,
    options: { limit?: number; skip?: number } = {}
  ): Promise<ITutorProfile[]> {
    const query: Record<string, any> = {
      verificationStatus: "approved",
      onboardingComplete: true,
      suspendedAt: { $exists: false },
    };

    // Teaching Mode & Safety Filter
    if (request.teachingMode === "online") {
      query.teachingMode = { $in: ["online", "both"] };
      if (request.preferredTutorCountries && request.preferredTutorCountries.length > 0) {
        query.countryCode = { $in: request.preferredTutorCountries };
      }
    } else if (request.teachingMode === "in-person") {
      query.teachingMode = { $in: ["in-person", "both"] };
      // Police verification is strictly required for in-person home tutoring
      query.policeVerificationStatus = "approved";
      if (request.countryCode) {
        query.countryCode = request.countryCode;
      }
      if (request.city) {
        query.city = new RegExp(`^${request.city.trim()}$`, "i");
      }
    } else {
      // "both" mode
      query.$or = [
        { teachingMode: { $in: ["online", "both"] } },
        {
          teachingMode: { $in: ["in-person", "both"] },
          policeVerificationStatus: "approved",
          ...(request.countryCode ? { countryCode: request.countryCode } : {}),
          ...(request.city ? { city: new RegExp(`^${request.city.trim()}$`, "i") } : {}),
        },
      ];
    }

    // Subject Filtering (case-insensitive and domain alias)
    const normalizedSub = request.subject.trim().toLowerCase();
    const aliasInfo = SUBJECT_ALIASES[normalizedSub];
    const subjectPatterns = [new RegExp(`^${escapeRegExp(request.subject.trim())}$`, "i")];
    if (aliasInfo) {
      aliasInfo.related.forEach((rel) => {
        subjectPatterns.push(new RegExp(`^${escapeRegExp(rel)}$`, "i"));
      });
    }
    query.subjects = { $in: subjectPatterns };

    // Level Compatibility
    if (request.level) {
      query.levels = { $in: [request.level, "Other"] };
    }

    // Gender preference if explicitly chosen by student
    if (request.tutorGenderPreference && request.tutorGenderPreference !== "none") {
      query.gender = request.tutorGenderPreference;
    }

    const limit = options.limit || 100;
    const skip = options.skip || 0;

    return TutorProfile.find(query)
      .populate("user", "name email avatar city countryCode countryName phone isActive")
      .skip(skip)
      .limit(limit)
      .lean() as unknown as Promise<ITutorProfile[]>;
  }

  /**
   * Layer 2-5: Core Scoring & Explainability Engine
   */
  public static async calculateMatchScore(
    request: IRequest,
    tutor: ITutorProfile,
    config?: MatchingConfigData
  ): Promise<MatchScoreResult | null> {
    const cfg = config || (await this.getActiveConfig());
    const isOnline = request.teachingMode === "online" || (request.teachingMode === "both" && tutor.teachingMode === "online");
    const weights = isOnline ? cfg.onlineWeights : cfg.homeWeights;

    // Hard gate for in-person/home tuition: Mandatory Police Verification
    const isHomeTuition = request.teachingMode === "in-person" || (request.teachingMode as string) === "home";
    const hasPoliceClearance = tutor.policeVerificationStatus === "approved" || (tutor as any).policeCertificateVerified === true;
    if (isHomeTuition && !hasPoliceClearance) {
      return {
        score: 0,
        tier: "other",
        scoreBreakdown: { verification: 0 },
        reasons: ["Police certificate verification required for home tuition."],
        algorithmVersion: cfg.algorithmVersion,
        isColdStartExploration: false,
      };
    }

    const breakdown: Record<string, number> = {};
    const reasons: string[] = [];

    // ── 1. Subject Match ──
    const maxSub = weights.subject;
    const reqSubLower = request.subject.trim().toLowerCase();
    const tutorSubsLower = (tutor.subjects || []).map((s) => s.trim().toLowerCase());

    const isExactSub = tutorSubsLower.includes(reqSubLower);
    const alias = SUBJECT_ALIASES[reqSubLower];
    const isRelatedSub = !isExactSub && alias && alias.related.some((r) => tutorSubsLower.includes(r.toLowerCase()));

    if (isExactSub) {
      breakdown.subject = maxSub;
      reasons.push(`Exact ${request.subject} specialist`);
    } else if (isRelatedSub) {
      breakdown.subject = Math.round(maxSub * 0.82);
      reasons.push(`Specialized knowledge in related ${request.subject} domain`);
    } else {
      breakdown.subject = Math.round(maxSub * 0.5);
    }

    // ── 2. Level & Curriculum Match ──
    const maxLvl = weights.levelCurriculum;
    const reqLvl = request.level;
    const reqCurriculum = (request.curriculum || "").trim().toLowerCase();
    const tutorLevels = tutor.levels || [];
    const tutorCurricula = (tutor.curricula || []).map((c) => c.trim().toLowerCase());

    const hasExactLevel = tutorLevels.includes(reqLvl);
    const hasCurriculum = reqCurriculum ? tutorCurricula.includes(reqCurriculum) : true;

    if (hasExactLevel && hasCurriculum && reqCurriculum) {
      breakdown.levelCurriculum = maxLvl;
      reasons.push(`${request.curriculum} & ${reqLvl} syllabus certified`);
    } else if (hasExactLevel) {
      breakdown.levelCurriculum = Math.round(maxLvl * 0.85);
      reasons.push(`Teaches ${reqLvl} students`);
    } else {
      // Check level hierarchy adjacency
      const reqRank = LEVEL_HIERARCHY[reqLvl] || 3;
      const hasAdjacent = tutorLevels.some((lvl) => Math.abs((LEVEL_HIERARCHY[lvl] || 3) - reqRank) <= 1);
      breakdown.levelCurriculum = hasAdjacent ? Math.round(maxLvl * 0.6) : Math.round(maxLvl * 0.35);
    }

    // ── 3. Availability & Timezone ──
    const maxAvail = weights.availability;
    const { overlapScore, timezoneAligned, matchingSlotsCount } = calculateScheduleOverlap(request, tutor);

    breakdown.availability = Math.round(maxAvail * overlapScore);
    if (matchingSlotsCount > 0) {
      reasons.push(`Available during your requested schedule`);
    }
    if (timezoneAligned && isOnline) {
      reasons.push(`Convenient timezone alignment`);
    }

    // ── 4. Teaching Mode Match ──
    const maxMode = weights.mode;
    if (request.teachingMode === "both" || tutor.teachingMode === "both" || request.teachingMode === tutor.teachingMode) {
      breakdown.mode = maxMode;
      if (tutor.teachingMode === "both") {
        reasons.push(`Offers both online and in-person sessions`);
      }
    } else {
      breakdown.mode = Math.round(maxMode * 0.7);
    }

    // ── 5. Budget Compatibility & Currency Normalization ──
    const maxBudget = weights.budget;
    const reqCurrency = request.currency || "PKR";
    const tutorCurrency = tutor.currency || "PKR";
    const tutorRate = tutor.hourlyRate || 0;

    let convertedTutorRate = tutorRate;
    let exchangeRate = 1.0;

    if (reqCurrency.toUpperCase() !== tutorCurrency.toUpperCase()) {
      const conv = convertCurrencyRate(tutorRate, tutorCurrency, reqCurrency);
      convertedTutorRate = conv.converted;
      exchangeRate = conv.rate;
    }

    const conversionMeta = {
      originalRate: tutorRate,
      originalCurrency: tutorCurrency,
      convertedRate: convertedTutorRate,
      targetCurrency: reqCurrency,
      exchangeRate,
    };

    // Check hard maximum budget if specified by student
    if (request.maximumBudget && convertedTutorRate > request.maximumBudget) {
      return null; // Excluded by student's private maximum budget
    }

    const reqBudget = request.budget || 0;
    if (reqBudget > 0) {
      if (convertedTutorRate <= reqBudget) {
        breakdown.budget = maxBudget;
        reasons.push(`Within your preferred budget (${reqCurrency} ${convertedTutorRate.toLocaleString()}/${request.pricingUnit})`);
      } else {
        const ratio = (convertedTutorRate - reqBudget) / reqBudget;
        if (ratio <= 0.1) {
          breakdown.budget = Math.round(maxBudget * 0.9);
          reasons.push(`Competitive rate close to your budget`);
        } else if (ratio <= 0.2) {
          breakdown.budget = Math.round(maxBudget * 0.7);
        } else if (ratio <= 0.35) {
          breakdown.budget = Math.round(maxBudget * 0.5);
        } else {
          breakdown.budget = Math.round(maxBudget * 0.25);
        }
      }
    } else {
      breakdown.budget = maxBudget;
    }

    // ── 6. Location Match (Home Tuition) ──
    const maxLoc = weights.location;
    if (!isOnline && maxLoc > 0) {
      const locScore = calculateLocationScore(request, tutor);
      breakdown.location = Math.round(maxLoc * locScore.ratio);
      if (locScore.reason) reasons.push(locScore.reason);
    } else {
      breakdown.location = 0;
    }

    // ── 7. Language Match ──
    const maxLang = weights.language;
    const reqLang = (request.preferredLanguage || "").trim().toLowerCase();
    const tutorLangs = tutor.languages || [];

    if (!reqLang || reqLang === "any") {
      breakdown.language = maxLang;
    } else {
      const matchedLang = tutorLangs.find((l) => l.language?.toLowerCase() === reqLang);
      if (matchedLang) {
        if (matchedLang.proficiency === "Native" || matchedLang.proficiency === "Fluent") {
          breakdown.language = maxLang;
          reasons.push(`Fluent in ${matchedLang.language}`);
        } else {
          breakdown.language = Math.round(maxLang * 0.75);
        }
      } else {
        // Lingua franca fallback
        const hasEnglish = tutorLangs.some((l) => l.language?.toLowerCase() === "english");
        breakdown.language = hasEnglish ? Math.round(maxLang * 0.5) : 0;
      }
    }

    // ── 8. Tutor Quality (Bayesian Adjusted Rating + Verification) ──
    const maxQual = weights.quality;
    const v = tutor.totalReviews || 0;
    const R = tutor.averageRating || 0;
    const C = cfg.bayesian.globalMeanRating;
    const m = cfg.bayesian.minReviewThreshold;

    let isColdStartExploration = false;
    let bayesianRating = C;

    if (v === 0) {
      // Cold start: newly verified tutor gets baseline quality score
      const daysSinceCreated = (Date.now() - new Date(tutor.createdAt).getTime()) / (1000 * 3600 * 24);
      if (daysSinceCreated <= cfg.coldStart.newTutorDaysWindow) {
        isColdStartExploration = true;
        bayesianRating = cfg.coldStart.newTutorQualityScore;
        reasons.push(`Verified rising educator (New Tutor)`);
      } else {
        bayesianRating = 4.2;
      }
    } else {
      // Bayesian weighted rating
      bayesianRating = MatchingService.calculateBayesianRating(R, v, C, m);
      if (R >= 4.8 && v >= 5) {
        reasons.push(`Top-rated tutor (${R.toFixed(1)} rating from ${v} verified reviews)`);
      }
    }

    const qualRatio = Math.min(1.0, bayesianRating / 5.0);
    const degreeBonus = (tutor.education && tutor.education.length > 0) ? 0.15 : 0;
    breakdown.quality = Math.min(maxQual, Math.round(maxQual * Math.min(1.0, qualRatio + degreeBonus)));

    // ── 9. Experience Score (Diminishing Returns) ──
    const maxExp = weights.experience;
    const expYears = tutor.experience || 0;
    let expRatio = 0.2;
    if (expYears >= 10) expRatio = 1.0;
    else if (expYears >= 6) expRatio = 0.85;
    else if (expYears >= 4) expRatio = 0.7;
    else if (expYears >= 2) expRatio = 0.5;
    else expRatio = 0.3;

    breakdown.experience = Math.round(maxExp * expRatio);
    if (expYears >= 5) {
      reasons.push(`${expYears}+ years teaching experience`);
    }

    // ── 10. Marketplace Reliability Score ──
    const maxRel = weights.reliability;
    const reliabilityRatio = calculateTutorReliability(tutor);
    breakdown.reliability = Math.round(maxRel * reliabilityRatio);

    // ── 11. Verification & Trust ──
    const maxVer = weights.verification;
    let verPoints = 0;
    if (tutor.isVerified || tutor.verificationStatus === "approved") verPoints += maxVer * 0.6;
    if (tutor.policeVerificationStatus === "approved") {
      verPoints += maxVer * 0.4;
      if (!isOnline) reasons.push(`Police character verified for home tuition`);
    } else {
      reasons.push(`Credentials & degree verified`);
    }
    breakdown.verification = Math.round(Math.min(maxVer, verPoints));

    // ── Total Score Sum ──
    const rawTotal = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
    const score = Math.min(100, Math.max(0, Math.round(rawTotal)));

    let tier: "excellent" | "strong" | "good" | "other" = "other";
    if (score >= cfg.thresholds.excellent) tier = "excellent";
    else if (score >= cfg.thresholds.strong) tier = "strong";
    else if (score >= cfg.thresholds.good) tier = "good";

    return {
      score,
      tier,
      scoreBreakdown: breakdown,
      reasons: reasons.slice(0, 5), // Return top 5 most relevant reasons
      algorithmVersion: cfg.algorithmVersion,
      isColdStartExploration,
      currencyConversion: conversionMeta,
    };
  }

  /**
   * Rank a list of tutors against a request, enforcing controlled diversity & exploration
   */
  public static async rankTutors(
    request: IRequest,
    tutors: ITutorProfile[]
  ): Promise<RankedTutorMatch[]> {
    const config = await this.getActiveConfig();
    const scoredPromises = tutors.map(async (t) => {
      const match = await this.calculateMatchScore(request, t, config);
      if (!match) return null;
      return {
        tutor: (t as any).user || t,
        tutorProfile: t,
        matchScore: match.score,
        tier: match.tier,
        scoreBreakdown: match.scoreBreakdown,
        reasons: match.reasons,
        isColdStartExploration: match.isColdStartExploration,
      };
    });

    const scored = (await Promise.all(scoredPromises)).filter(Boolean) as RankedTutorMatch[];

    // Sort by match score descending
    scored.sort((a, b) => b.matchScore - a.matchScore);

    // Controlled diversity: ensure qualified exploration candidates (new tutors) get 10-20% exposure in top 10
    if (scored.length > 5) {
      const explorationCandidates = scored.filter((m) => m.isColdStartExploration && m.matchScore >= config.thresholds.good);
      const establishedCandidates = scored.filter((m) => !m.isColdStartExploration);

      if (explorationCandidates.length > 0 && establishedCandidates.length > 3) {
        const blended: RankedTutorMatch[] = [];
        let expIdx = 0;
        let estIdx = 0;

        while (estIdx < establishedCandidates.length || expIdx < explorationCandidates.length) {
          // Add 4 established tutors then 1 exploration tutor
          for (let i = 0; i < 4 && estIdx < establishedCandidates.length; i++) {
            blended.push(establishedCandidates[estIdx++]);
          }
          if (expIdx < explorationCandidates.length && blended.length < 15) {
            blended.push(explorationCandidates[expIdx++]);
          }
        }
        return blended;
      }
    }

    return scored;
  }

  /**
   * Two-Sided: Recommend student requests to a tutor based on their profile
   */
  public static async getRecommendedRequestsForTutor(
    tutor: ITutorProfile,
    options: { limit?: number } = {}
  ): Promise<RankedRequestMatch[]> {
    const config = await this.getActiveConfig();
    const limit = options.limit || 20;

    // Build base request candidate query — strictly unexpired fresh demand
    const activeStates = ["open", "published", "receiving_offers", "negotiating"];
    const query: Record<string, any> = {
      status: { $in: activeStates },
      isDirect: false,
      expiresAt: { $gt: new Date() },
    };

    // Mode filter
    if (tutor.teachingMode === "online") {
      query.teachingMode = { $in: ["online", "both"] };
    } else if (tutor.teachingMode === "in-person") {
      query.teachingMode = { $in: ["in-person", "both"] };
      query.countryCode = tutor.countryCode;
      if (tutor.city) {
        query.city = new RegExp(`^${tutor.city.trim()}$`, "i");
      }
    }

    // Subject filter
    const tutorSubs = (tutor.subjects || []).map((s) => new RegExp(`^${escapeRegExp(s.trim())}$`, "i"));
    if (tutorSubs.length > 0) {
      query.subject = { $in: tutorSubs };
    }

    const candidateRequests = await Request.find(query)
      .populate("student", "name avatar city countryCode countryName")
      .sort({ createdAt: -1 })
      .limit(60)
      .lean();

    const scoredPromises = candidateRequests.map(async (reqDoc) => {
      const match = await this.calculateMatchScore(reqDoc as any, tutor, config);
      if (!match || match.score < config.thresholds.notificationMinimum) return null;
      return {
        request: reqDoc,
        matchScore: match.score,
        tier: match.tier,
        scoreBreakdown: match.scoreBreakdown,
        reasons: match.reasons,
      };
    });

    const results = (await Promise.all(scoredPromises)).filter(Boolean) as RankedRequestMatch[];
    results.sort((a, b) => b.matchScore - a.matchScore);
    return results.slice(0, limit);
  }

  /**
   * Intelligently re-rank received offers on a student's request
   */
  public static async rankOffersForRequest(
    request: IRequest,
    offers: IBid[]
  ): Promise<any[]> {
    const config = await this.getActiveConfig();

    const rankedPromises = offers.map(async (offer) => {
      const tutorProfile = await TutorProfile.findOne({ user: offer.tutor }).lean();
      if (!tutorProfile) return { ...offer, matchScore: 50, rankScore: 50, matchReasons: [] };

      const match = await this.calculateMatchScore(request, tutorProfile as any, config);
      const baseScore = match?.score || 50;

      // Offer Price Competitiveness (25% weight)
      const studentBudget = request.budget || 1;
      const offerAmount = offer.convertedRequestAmount || offer.amount || studentBudget;
      let priceScore = 70;
      if (offerAmount <= studentBudget) {
        priceScore = 100;
      } else {
        const overPercent = (offerAmount - studentBudget) / studentBudget;
        priceScore = Math.max(20, Math.round(100 - overPercent * 150));
      }

      // Schedule commitment & response speed
      const responseMinutes = (new Date(offer.createdAt).getTime() - new Date(request.createdAt).getTime()) / 60000;
      const responseSpeedScore = responseMinutes <= 30 ? 100 : responseMinutes <= 120 ? 85 : 70;

      // Composite Rank Score: Base match (60%) + Price fit (25%) + Response speed (15%)
      const rankScore = Math.round(baseScore * 0.6 + priceScore * 0.25 + responseSpeedScore * 0.15);

      return {
        ...(typeof (offer as any).toObject === "function" ? (offer as any).toObject() : offer),
        matchScore: baseScore,
        matchTier: match?.tier || "good",
        rankScore,
        matchReasons: match?.reasons || ["Verified tutor offer"],
        scoreBreakdown: match?.scoreBreakdown || {},
      };
    });

    const ranked = await Promise.all(rankedPromises);
    ranked.sort((a, b) => b.rankScore - a.rankScore);
    return ranked;
  }

  /**
   * Progressive Tiered Notification Dispatch
   * Notifies top matches (Tier 1: top 15, score >= 80) and logs decisions
   */
  public static async dispatchProgressiveNotifications(
    request: IRequest,
    io?: any
  ): Promise<{ notifiedCount: number; tier1Count: number }> {
    try {
      const eligibleTutors = await this.getEligibleTutors(request, { limit: 80 });
      if (!eligibleTutors || eligibleTutors.length === 0) {
        return { notifiedCount: 0, tier1Count: 0 };
      }

      const ranked = await this.rankTutors(request, eligibleTutors);
      const tier1Matches = ranked.filter((m) => m.matchScore >= 80).slice(0, 15);
      const currencySymbol = request.currency || "PKR";

      const notifyList = tier1Matches.length >= 3 ? tier1Matches : ranked.slice(0, 10);

      await Promise.all(
        notifyList.map(async (m) => {
          const tutorUserId = m.tutorProfile.user?._id || m.tutorProfile.user;
          if (!tutorUserId) return;

          // Record match impression in MatchLog
          await MatchLog.findOneAndUpdate(
            { request: request._id, tutor: tutorUserId },
            {
              $set: {
                student: request.student,
                score: m.matchScore,
                tier: m.tier,
                scoreBreakdown: m.scoreBreakdown,
                reasons: m.reasons,
                algorithmVersion: DEFAULT_MATCHING_CONFIG.algorithmVersion,
                mode: request.teachingMode,
                notificationTier: 1,
                notificationSentAt: new Date(),
              },
            },
            { upsert: true }
          ).catch((e) => logger.warn({ err: e }, "Failed to upsert MatchLog"));

          // Send real-time socket / platform notification
          if (io) {
            sendNotification(io, tutorUserId.toString(), {
              title: `New ${m.matchScore}% Match: Tuition Opportunity`,
              message: `${request.subject} (${request.level}) · Proposed ${currencySymbol} ${request.budget.toLocaleString()}/${request.pricingUnit} · ${request.teachingMode === "online" ? "Online" : request.city || "In-person"}`,
              type: "bid",
              link: "/dashboard?tab=browse",
            });
          }
        })
      );

      return {
        notifiedCount: notifyList.length,
        tier1Count: tier1Matches.length,
      };
    } catch (err) {
      logger.error({ err }, "Error in dispatchProgressiveNotifications");
      return { notifiedCount: 0, tier1Count: 0 };
    }
  }
}

// ─── Helper Calculations ──────────────────────────────────────────────────────

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function calculateScheduleOverlap(
  request: IRequest,
  tutor: ITutorProfile
): { overlapScore: number; timezoneAligned: boolean; matchingSlotsCount: number } {
  const tutorSlots = tutor.availability || [];
  if (tutorSlots.length === 0) {
    return { overlapScore: 0.6, timezoneAligned: true, matchingSlotsCount: 0 }; // Default flexible
  }

  const reqDays = request.preferredDays || [];
  if (reqDays.length === 0) {
    // If student didn't specify strict days, any weekly availability is good
    return { overlapScore: 0.9, timezoneAligned: true, matchingSlotsCount: tutorSlots.length };
  }

  let matchingSlots = 0;
  reqDays.forEach((day) => {
    const slot = tutorSlots.find((s) => s.day?.toLowerCase() === day.toLowerCase());
    if (slot && slot.slots && slot.slots.length > 0) {
      matchingSlots++;
    }
  });

  const overlapRatio = reqDays.length > 0 ? matchingSlots / reqDays.length : 0.8;

  // Approximate timezone offset difference between IANA timezones
  const tzTutor = tutor.timezone || "Asia/Karachi";
  const tzReq = request.timezone || "Asia/Karachi";
  const timezoneAligned = tzTutor === tzReq || Math.abs(getTimezoneOffsetHours(tzTutor) - getTimezoneOffsetHours(tzReq)) <= 3;

  const score = Math.min(1.0, overlapRatio * (timezoneAligned ? 1.0 : 0.85));
  return { overlapScore: score, timezoneAligned, matchingSlotsCount: matchingSlots };
}

function getTimezoneOffsetHours(tz: string): number {
  try {
    const date = new Date();
    const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
    const tzDate = new Date(date.toLocaleString("en-US", { timeZone: tz }));
    return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
  } catch {
    return 5.0; // Default to UTC+5
  }
}

function calculateLocationScore(
  request: IRequest,
  tutor: ITutorProfile
): { ratio: number; reason?: string } {
  const reqCity = (request.city || "").trim().toLowerCase();
  const tutorCity = (tutor.city || "").trim().toLowerCase();
  const reqArea = (request.area || "").trim().toLowerCase();
  const tutorAreas = (tutor.serviceAreas || []).map((a) => a.trim().toLowerCase());

  if (reqArea && tutorAreas.includes(reqArea)) {
    return { ratio: 1.0, reason: `Located in your neighborhood (${request.area})` };
  }

  if (reqCity && tutorCity && reqCity === tutorCity) {
    return { ratio: 0.85, reason: `Located in ${request.city}` };
  }

  if (request.countryCode && tutor.countryCode && request.countryCode === tutor.countryCode) {
    return { ratio: 0.5, reason: `Within ${request.countryName || "region"}` };
  }

  return { ratio: 0 };
}

function calculateTutorReliability(tutor: ITutorProfile): number {
  // Activity recency
  const lastActive = tutor.updatedAt ? new Date(tutor.updatedAt).getTime() : Date.now();
  const daysSince = (Date.now() - lastActive) / (1000 * 3600 * 24);

  let recencyFactor = 0.6;
  if (daysSince <= 1) recencyFactor = 1.0;
  else if (daysSince <= 7) recencyFactor = 0.85;
  else if (daysSince <= 30) recencyFactor = 0.7;

  // Rating and review track record
  const reviews = tutor.totalReviews || 0;
  const trackFactor = reviews >= 10 ? 1.0 : reviews >= 3 ? 0.85 : 0.75;

  return Math.min(1.0, recencyFactor * 0.5 + trackFactor * 0.5);
}
