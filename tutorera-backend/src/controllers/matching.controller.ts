import { Response } from "express";
import { AuthRequest } from "../types";
import Request from "../models/Request.model";
import TutorProfile from "../models/TutorProfile.model";
import Bid from "../models/Bid.model";
import MatchLog from "../models/MatchLog.model";
import MatchingConfig from "../models/MatchingConfig.model";
import MatchingConfigHistory from "../models/MatchingConfigHistory.model";
import { MatchingService } from "../services/matching.service";
import { DEFAULT_MATCHING_CONFIG } from "../config/matchingConfig";
import { logAudit } from "../utils/logAudit";
import logger from "../config/logger";
import { formatMatchingConfigError, matchingConfigUpdateSchema } from "../validators/matchingConfig.validator";

// @desc    Get top matching tutors for a student's request
// @route   GET /api/v1/matching/requests/:id/matches
// @access  Private (student / admin)
export const getRequestMatches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      res.status(404).json({ success: false, message: "Tuition request not found." });
      return;
    }

    const userId = req.user?._id?.toString();
    if (request.student.toString() !== userId && req.user?.role !== "admin") {
      res.status(403).json({ success: false, message: "Not authorized to view matches for this request." });
      return;
    }

    const eligibleTutors = await MatchingService.getEligibleTutors(request, { limit: 60 });
    const rankedMatches = await MatchingService.rankTutors(request, eligibleTutors);

    res.json({
      success: true,
      requestId: request._id,
      algorithmVersion: DEFAULT_MATCHING_CONFIG.algorithmVersion,
      totalEligible: eligibleTutors.length,
      totalRanked: rankedMatches.length,
      matches: rankedMatches.slice(0, 20),
    });
  } catch (err) {
    logger.error({ err }, "Error in getRequestMatches");
    res.status(500).json({ success: false, message: "Failed to calculate matches." });
  }
};

// @desc    Get recommended student requests for the authenticated tutor
// @route   GET /api/v1/matching/tutors/recommended-requests
// @access  Private (tutor)
export const getTutorRecommendedRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tutorProfile = await TutorProfile.findOne({ user: req.user?._id });
    if (!tutorProfile) {
      res.status(404).json({ success: false, message: "Tutor profile not found." });
      return;
    }

    const recommended = await MatchingService.getRecommendedRequestsForTutor(tutorProfile, { limit: 25 });

    res.json({
      success: true,
      total: recommended.length,
      algorithmVersion: DEFAULT_MATCHING_CONFIG.algorithmVersion,
      requests: recommended,
    });
  } catch (err) {
    logger.error({ err }, "Error in getTutorRecommendedRequests");
    res.status(500).json({ success: false, message: "Failed to fetch recommended requests." });
  }
};

// @desc    Get smart-ranked offers for a student's request
// @route   GET /api/v1/matching/offers/:requestId/ranked
// @access  Private (student / admin)
export const getRankedOffers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const request = await Request.findById(req.params.requestId);
    if (!request) {
      res.status(404).json({ success: false, message: "Request not found." });
      return;
    }

    const userId = req.user?._id?.toString();
    if (request.student.toString() !== userId && req.user?.role !== "admin") {
      res.status(403).json({ success: false, message: "Not authorized." });
      return;
    }

    const offers = await Bid.find({ request: request._id })
      .populate("tutor", "name email avatar city countryCode countryName phone averageRating")
      .sort({ createdAt: -1 })
      .lean();

    const ranked = await MatchingService.rankOffersForRequest(request, offers as any);

    res.json({
      success: true,
      totalOffers: ranked.totalCount,
      offers: ranked.offers,
      isCapped: ranked.isCapped,
      capLimit: ranked.capLimit,
      cappedCount: ranked.cappedCount,
    });
  } catch (err) {
    logger.error({ err }, "Error in getRankedOffers");
    res.status(500).json({ success: false, message: "Failed to rank offers." });
  }
};

// @desc    Submit student match feedback
// @route   POST /api/v1/matching/feedback
// @access  Private (student)
export const submitMatchFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { requestId, tutorId, feedbackScore, feedbackComment, feedbackTags } = req.body;
    if (!requestId || !tutorId || !feedbackScore) {
      res.status(400).json({ success: false, message: "requestId, tutorId and feedbackScore are required." });
      return;
    }

    const log = await MatchLog.findOneAndUpdate(
      { request: requestId, tutor: tutorId },
      {
        $set: {
          feedbackScore: Number(feedbackScore),
          feedbackComment: feedbackComment || "",
          feedbackTags: Array.isArray(feedbackTags) ? feedbackTags : [],
        },
      },
      { new: true }
    );

    await logAudit({
      action: "match_feedback_submitted",
      actor: req.user?.name,
      actorId: req.user?._id?.toString(),
      entity: "MatchLog",
      targetId: log?._id?.toString() || requestId,
      metadata: { feedbackScore, feedbackTags },
    });

    res.json({ success: true, message: "Thank you for your match feedback." });
  } catch (err) {
    logger.error({ err }, "Error in submitMatchFeedback");
    res.status(500).json({ success: false, message: "Failed to submit feedback." });
  }
};

// @desc    Admin: Get matching analytics and conversion metrics
// @route   GET /api/v1/matching/admin/analytics
// @access  Private (admin)
export const getMatchingAnalytics = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalMatches = await MatchLog.countDocuments();
    const notificationTier1 = await MatchLog.countDocuments({ notificationTier: 1 });
    const offersReceived = await MatchLog.countDocuments({ offerReceivedAt: { $exists: true } });
    const offersAccepted = await MatchLog.countDocuments({ offerAcceptedAt: { $exists: true } });
    const bookingsCompleted = await MatchLog.countDocuments({ bookingCompletedAt: { $exists: true } });

    // Score tier breakdown
    const tierCounts = await MatchLog.aggregate([
      { $group: { _id: "$tier", count: { $sum: 1 }, avgScore: { $avg: "$score" } } },
    ]);

    const tierDistribution = {
      excellent: 0,
      great: 0,
      good: 0,
      fair: 0,
    };
    tierCounts.forEach((tc: any) => {
      const key = (tc._id || "").toLowerCase();
      if (key === "excellent") tierDistribution.excellent += tc.count;
      else if (key === "great" || key === "strong") tierDistribution.great += tc.count;
      else if (key === "good") tierDistribution.good += tc.count;
      else tierDistribution.fair += tc.count;
    });

    // Average score overall
    const avgScoreAgg = await MatchLog.aggregate([
      { $group: { _id: null, avgScore: { $avg: "$score" } } },
    ]);
    const averageMatchScore = avgScoreAgg.length > 0 ? Math.round(avgScoreAgg[0].avgScore) : null;

    const responseTimeAgg = await MatchLog.aggregate([
      { $match: { notificationSentAt: { $type: "date" }, offerReceivedAt: { $type: "date" } } },
      { $project: { minutes: { $divide: [{ $subtract: ["$offerReceivedAt", "$notificationSentAt"] }, 60000] } } },
      { $match: { minutes: { $gte: 0 } } },
      { $group: { _id: null, average: { $avg: "$minutes" } } },
    ]);
    const avgStudentResponseMinutes = responseTimeAgg.length > 0
      ? Math.round(responseTimeAgg[0].average)
      : null;

    const matchToOfferRate = notificationTier1 > 0 ? Math.round((offersReceived / notificationTier1) * 100) : 0;
    const offerToBookingRate = offersReceived > 0 ? Math.round((offersAccepted / offersReceived) * 100) : 0;

    res.json({
      success: true,
      analytics: {
        // CamelCase contract expected by frontend
        totalMatches,
        avgMatchScore: averageMatchScore,
        totalOffers: offersReceived,
        totalBookings: offersAccepted,
        offerConversionRate: matchToOfferRate,
        bookingConversionRate: offerToBookingRate,
        avgStudentResponseMinutes,
        generatedAt: new Date().toISOString(),
        hasData: totalMatches > 0,
        tierDistribution,

        // Legacy / snake keys for backwards compatibility
        totalMatchesLogged: totalMatches,
        notificationTier1Sent: notificationTier1,
        offersReceived,
        offersAccepted,
        bookingsCompleted,
        averageMatchScore,
        matchToOfferRatePercent: matchToOfferRate,
        offerToBookingRatePercent: offerToBookingRate,
        tierCounts,
        algorithmVersion: DEFAULT_MATCHING_CONFIG.algorithmVersion,
        activeVersion: DEFAULT_MATCHING_CONFIG.algorithmVersion,
      },
    });
  } catch (err) {
    logger.error({ err }, "Error in getMatchingAnalytics");
    res.status(500).json({ success: false, message: "Failed to generate analytics." });
  }
};

// @desc    Admin: Get matching configuration
// @route   GET /api/v1/matching/admin/config
// @access  Private (admin)
export const getMatchingConfig = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const config = await MatchingService.getActiveConfig();
    const metadata = await MatchingConfig.findOne().sort({ updatedAt: -1 }).select("updatedAt revision").lean();
    res.json({ success: true, config: { ...config, updatedAt: metadata?.updatedAt, revision: metadata?.revision || 1 } });
  } catch (err) {
    logger.error({ err }, "Error in getMatchingConfig");
    res.status(500).json({ success: false, message: "Failed to fetch config." });
  }
};

// @desc    Admin: Update matching configuration
// @route   PUT /api/v1/matching/admin/config
// @access  Private (admin)
export const updateMatchingConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = matchingConfigUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: formatMatchingConfigError(parsed.error),
        issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      });
      return;
    }

    const { changeReason, expectedUpdatedAt, ...configData } = parsed.data;
    const existing = await MatchingConfig.findOne().sort({ updatedAt: -1 });
    if (expectedUpdatedAt && existing && existing.updatedAt.toISOString() !== expectedUpdatedAt) {
      res.status(409).json({ success: false, code: "CONFIG_CONFLICT", message: "Matching configuration changed in another session. Reload before saving." });
      return;
    }

    const filter = existing ? { _id: existing._id, updatedAt: existing.updatedAt } : {};
    const updated = await MatchingConfig.findOneAndUpdate(
      filter,
      {
        $set: {
          ...configData,
          updatedBy: req.user?._id,
        },
        $inc: { revision: 1 },
      },
      { returnDocument: "after", upsert: !existing, runValidators: true }
    );
    if (!updated) {
      res.status(409).json({ success: false, code: "CONFIG_CONFLICT", message: "Matching configuration changed in another session. Reload before saving." });
      return;
    }

    // Invalidate in-memory cache immediately so changes take effect
    MatchingService.invalidateConfigCache();

    await logAudit({
      action: "matching_config_updated",
      actor: req.user?.name,
      actorId: req.user?._id?.toString(),
      entity: "MatchingConfig",
      targetId: updated._id.toString(),
      metadata: { changeReason, revision: updated.revision, before: existing?.toObject(), after: configData },
    });

    await MatchingConfigHistory.create({
      snapshot: configData,
      revision: updated.revision,
      changeReason,
      changedBy: req.user?._id,
    });

    res.json({ success: true, message: "Matching configuration updated successfully.", config: updated });
  } catch (err) {
    logger.error({ err }, "Error in updateMatchingConfig");
    res.status(500).json({ success: false, message: "Failed to update config." });
  }
};

export const getMatchingConfigHistory = async (_req: AuthRequest, res: Response): Promise<void> => {
  const history = await MatchingConfigHistory.find()
    .populate("changedBy", "name email")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  res.json({ success: true, history });
};

export const rollbackMatchingConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  const history = await MatchingConfigHistory.findById(req.params.id).lean();
  if (!history) {
    res.status(404).json({ success: false, message: "Configuration history entry not found." });
    return;
  }
  const current = await MatchingConfig.findOne().sort({ updatedAt: -1 });
  const updated = await MatchingConfig.findOneAndUpdate(
    current ? { _id: current._id, updatedAt: current.updatedAt } : {},
    { $set: { ...history.snapshot, updatedBy: req.user?._id }, $inc: { revision: 1 } },
    { returnDocument: "after", upsert: !current, runValidators: true }
  );
  if (!updated) {
    res.status(409).json({ success: false, message: "Configuration changed during rollback. Reload and try again." });
    return;
  }
  MatchingService.invalidateConfigCache();
  const reason = `Rolled back to revision ${history.revision}`;
  await MatchingConfigHistory.create({ snapshot: history.snapshot, revision: updated.revision, changeReason: reason, changedBy: req.user?._id });
  await logAudit({ action: "matching_config_rolled_back", actor: req.user?.name, actorId: req.user?._id?.toString(), entity: "MatchingConfig", targetId: updated._id.toString(), metadata: { sourceRevision: history.revision, newRevision: updated.revision } });
  res.json({ success: true, message: reason, config: updated });
};

// @desc    Admin: Simulate and diagnose matching evaluation for a request or custom parameters
// @route   POST /api/v1/matching/admin/simulate
// @access  Private (admin)
export const simulateMatching = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { requestId, customRequest, limit = 20 } = req.body;

    let targetRequest: any = null;
    if (requestId) {
      targetRequest = await Request.findById(requestId).populate("student", "name city countryCode");
      if (!targetRequest) {
        res.status(404).json({ success: false, message: "Specified tuition request not found." });
        return;
      }
    } else if (customRequest) {
      targetRequest = {
        _id: "SIMULATED_REQUEST",
        subject: customRequest.subject || "Mathematics",
        level: customRequest.level || "O-Level",
        curriculum: customRequest.curriculum || "",
        teachingMode: customRequest.teachingMode || "online",
        city: customRequest.city || "Lahore",
        countryCode: customRequest.countryCode || "PK",
        budget: Number(customRequest.budget) || 2500,
        pricingUnit: customRequest.pricingUnit || "hour",
        currency: customRequest.currency || "PKR",
        preferredDays: customRequest.preferredDays || [],
        schedule: customRequest.schedule || "Flexible",
        tutorGenderPreference: customRequest.tutorGenderPreference || "none",
        preferredLanguage: customRequest.preferredLanguage || "any",
        student: { name: "Simulated Student" },
      };
    } else {
      // Pick the most recent open/published request as default
      targetRequest = await Request.findOne({ status: { $in: ["open", "published", "receiving_offers"] } })
        .populate("student", "name city countryCode")
        .sort({ createdAt: -1 });
    }

    if (!targetRequest) {
      res.status(400).json({ success: false, message: "No active requests found to simulate. Please provide custom parameters." });
      return;
    }

    const eligibleTutors = await MatchingService.getEligibleTutors(targetRequest, { limit: 100 });
    const rankedMatches = await MatchingService.rankTutors(targetRequest, eligibleTutors);

    const tierSummary = {
      excellent: rankedMatches.filter((m) => m.tier === "excellent").length,
      great: rankedMatches.filter((m) => m.tier === "great" || (m.tier as any) === "strong").length,
      good: rankedMatches.filter((m) => m.tier === "good").length,
      fair: rankedMatches.filter((m) => m.tier === "fair" || (m.tier as any) === "other").length,
    };

    const requestSummary = {
      _id: targetRequest._id,
      subject: targetRequest.subject,
      level: targetRequest.level,
      curriculum: targetRequest.curriculum,
      teachingMode: targetRequest.teachingMode,
      city: targetRequest.city,
      countryCode: targetRequest.countryCode,
      budget: targetRequest.budget,
      pricingUnit: targetRequest.pricingUnit,
      currency: targetRequest.currency,
      schedule: targetRequest.schedule,
      student: targetRequest.student ? { name: targetRequest.student.name || "Student" } : undefined,
    };

    res.json({
      success: true,
      request: requestSummary,
      totalEligible: eligibleTutors.length,
      totalRanked: rankedMatches.length,
      tierSummary,
      matches: rankedMatches.slice(0, Number(limit) || 20),
    });
  } catch (err) {
    logger.error({ err }, "Error in simulateMatching");
    res.status(500).json({ success: false, message: "Failed to simulate matching." });
  }
};

