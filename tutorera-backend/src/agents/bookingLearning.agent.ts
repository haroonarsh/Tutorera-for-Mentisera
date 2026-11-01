import Booking from "../models/Booking.model";
import Request from "../models/Request.model";
import { AgentTask, AgentResult, EvidenceReference } from "./types";

const AGENT_ID = "booking-learning";

function evidence(scope: string, resourceId = "Booking"): EvidenceReference {
  return {
    sourceType: "mongodb",
    resourceId,
    queryScope: scope,
    retrievedAt: new Date().toISOString(),
    dataFreshness: "realtime",
  };
}

export async function runBookingLearningAgent(task: AgentTask): Promise<AgentResult> {
  const now = new Date().toISOString();
  const warnings: string[] = [];
  const evidenceRefs: EvidenceReference[] = [];

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalBookings,
      upcomingBookings,
      completedBookings,
      cancelledBookings,
      recentBookings7d,
      recentBookings30d,
      totalRequests,
      openRequests,
      bookedRequests,
      cancelledRequests,
      expiredRequests,
      subjectDemand,
      unmatchedRequests,
    ] = await Promise.all([
      Booking.countDocuments({}),
      Booking.countDocuments({ status: "upcoming" }),
      Booking.countDocuments({ status: "completed" }),
      Booking.countDocuments({ status: "cancelled" }),
      Booking.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Booking.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Request.countDocuments({}),
      Request.countDocuments({ status: { $in: ["open", "published", "receiving_offers"] } }),
      Request.countDocuments({ status: "booked" }),
      Request.countDocuments({ status: "cancelled" }),
      Request.countDocuments({ status: "expired" }),
      Request.aggregate([
        { $match: { status: { $in: ["open", "published", "receiving_offers", "booked"] } } },
        { $group: { _id: "$subject", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),
      // Requests with no bids (unmatched) — approximate via status
      Request.countDocuments({ status: { $in: ["open", "published"] }, expiresAt: { $gte: new Date() } }),
    ]);

    evidenceRefs.push(
      evidence("booking status counts", "Booking"),
      evidence("request status counts", "Request"),
      evidence("subject demand aggregation", "Request"),
    );

    // Conversion rate: booked / (total non-draft, non-archived requests)
    const eligibleRequests = totalRequests - (await Request.countDocuments({ status: { $in: ["draft", "archived"] } }));
    const conversionRate = eligibleRequests > 0
      ? Math.round((bookedRequests / eligibleRequests) * 10000) / 100
      : null;

    if (conversionRate === null) {
      warnings.push("Conversion rate unavailable: no eligible requests found.");
    }

    const findings = {
      bookings: {
        total: totalBookings,
        upcoming: upcomingBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        last7Days: recentBookings7d,
        last30Days: recentBookings30d,
      },
      requests: {
        total: totalRequests,
        open: openRequests,
        booked: bookedRequests,
        cancelled: cancelledRequests,
        expired: expiredRequests,
        activeUnmatched: unmatchedRequests,
      },
      metrics: {
        conversionRatePercent: conversionRate ?? "data_unavailable",
        // Tutor response time requires Bid model with timestamps — marked unavailable
        averageTutorResponseTimeHours: "data_unavailable",
      },
      subjectDemand: subjectDemand.map((s) => ({ subject: s._id, count: s.count })),
    };

    return {
      taskId: task.taskId,
      agentId: AGENT_ID,
      status: "success",
      findings,
      evidence: evidenceRefs,
      confidence: "high",
      generatedAt: now,
      warnings,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      taskId: task.taskId,
      agentId: AGENT_ID,
      status: "failed",
      findings: null,
      evidence: [],
      confidence: "low",
      generatedAt: now,
      warnings: [`Agent execution failed: ${message}`],
    };
  }
}
