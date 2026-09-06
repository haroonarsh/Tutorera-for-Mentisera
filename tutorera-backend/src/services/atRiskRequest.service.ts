// src/services/atRiskRequest.service.ts
// Intelligent At-Risk Request Queue & Zero-Offer Rescue Engine

import Request, { IRequest } from "../models/Request.model";
import Bid from "../models/Bid.model";
import { MatchingService } from "./matching.service";
import { sendNotification } from "../utils/socket";
import logger from "../config/logger";

export interface AtRiskRequestItem {
  request: any;
  riskReasons: string[];
  urgencyLevel: "critical" | "high" | "medium";
  urgencyScore: number;
  offersCount: number;
  hoursSinceCreated: number;
  hoursUntilExpiry: number;
  recommendedAction: "rematch" | "extend" | "suggest_online" | "escalate";
}

export class AtRiskRequestService {
  /**
   * Scans all active requests and returns those requiring operational attention.
   */
  public static async getAtRiskRequests(limit = 100, io?: any): Promise<AtRiskRequestItem[]> {
    const now = new Date();
    const activeRequests = await Request.find({
      status: { $in: ["open", "published", "receiving_offers", "negotiating"] },
      expiresAt: { $gt: now },
    })
      .populate("student", "name email phone city avatar countryName")
      .sort("-createdAt")
      .limit(300)
      .lean();

    const requestIds = activeRequests.map((r) => r._id);
    const bids = await Bid.find({
      request: { $in: requestIds },
      status: { $nin: ["withdrawn", "rejected"] },
    })
      .select("request amount status createdAt viewedAt")
      .lean();

    const bidsByRequest = new Map<string, typeof bids>();
    for (const b of bids) {
      const key = b.request.toString();
      if (!bidsByRequest.has(key)) bidsByRequest.set(key, []);
      bidsByRequest.get(key)!.push(b);
    }

    const atRiskItems: AtRiskRequestItem[] = [];

    for (const req of activeRequests) {
      const reqBids = bidsByRequest.get(req._id.toString()) || [];
      const offersCount = reqBids.length;
      const createdTime = new Date(req.createdAt).getTime();
      const expiryTime = req.expiresAt ? new Date(req.expiresAt).getTime() : createdTime + 7 * 86400000;

      const hoursSinceCreated = Math.max(0, Math.floor((now.getTime() - createdTime) / 3600000));
      const hoursUntilExpiry = Math.max(0, Math.floor((expiryTime - now.getTime()) / 3600000));

      const riskReasons: string[] = [];
      let urgencyScore = 0;

      // 1. Zero offers after 24h
      if (offersCount === 0 && hoursSinceCreated >= 24) {
        riskReasons.push("Zero offers received after 24h");
        urgencyScore += 40;

        // Auto-expand matching for zero-offer requests with high urgency
        await AtRiskRequestService.autoExpandMatchingForZeroOffer(req._id.toString(), io);
      }

      // 2. Zero offers after 48h
      if (offersCount === 0 && hoursSinceCreated >= 48) {
        riskReasons.push("Severe liquidity failure: Zero offers after 48h");
        urgencyScore += 30;

        // Auto-expand matching for zero-offer requests with high urgency
        await AtRiskRequestService.autoExpandMatchingForZeroOffer(req._id.toString(), io);
      }

      // 3. Expiring critical (<24h left with <2 offers)
      if (hoursUntilExpiry <= 24 && offersCount < 2) {
        riskReasons.push(`Expiring in ${hoursUntilExpiry}h with only ${offersCount} offers`);
        urgencyScore += 35;
      }

      // 4. Low liquidity (only 1 offer after 72h)
      if (offersCount === 1 && hoursSinceCreated >= 72) {
        riskReasons.push("Low liquidity: Only 1 tutor offer after 3 days");
        urgencyScore += 20;
      }

      // 5. Student hasn't viewed offers submitted > 24h ago
      const hasUnviewedOldOffers = reqBids.some(
        (b) => !b.viewedAt && now.getTime() - new Date(b.createdAt).getTime() > 24 * 3600000
      );
      if (hasUnviewedOldOffers) {
        riskReasons.push("Student has not viewed offers submitted > 24h ago");
        urgencyScore += 25;
      }

      // 6. Repeatedly reposted without booking
      if (req.repostedFromRequestId) {
        riskReasons.push("Repeatedly reposted requirement");
        urgencyScore += 15;
      }

      // 7. In-person request with no offers (local supply shortage)
      if (offersCount === 0 && (req.teachingMode === "in-person" || (req.teachingMode as string) === "home") && hoursSinceCreated >= 24) {
        riskReasons.push("Home tuition local supply shortage");
        urgencyScore += 20;
      }

      if (riskReasons.length > 0) {
        let recommendedAction: AtRiskRequestItem["recommendedAction"] = "rematch";
        if (hoursUntilExpiry <= 24) {
          recommendedAction = "extend";
        } else if (req.teachingMode === "in-person" && offersCount === 0 && hoursSinceCreated >= 48) {
          recommendedAction = "suggest_online";
        } else if (urgencyScore >= 70) {
          recommendedAction = "escalate";
        }

        const urgencyLevel: AtRiskRequestItem["urgencyLevel"] =
          urgencyScore >= 65 ? "critical" : urgencyScore >= 40 ? "high" : "medium";

        atRiskItems.push({
          request: req,
          riskReasons,
          urgencyLevel,
          urgencyScore,
          offersCount,
          hoursSinceCreated,
          hoursUntilExpiry,
          recommendedAction,
        });
      }
    }

    // Sort by urgency score descending
    atRiskItems.sort((a, b) => b.urgencyScore - a.urgencyScore);
    return atRiskItems.slice(0, limit);
  }

  /**
   * Automatically expands matching for zero-offer requests with high urgency.
   * Called automatically when scanning at-risk requests.
   */
  public static async autoExpandMatchingForZeroOffer(
    requestId: string,
    io?: any
  ): Promise<{ success: boolean; message: string }> {
    const reqDoc = await Request.findById(requestId).populate("student", "name email");
    if (!reqDoc) {
      return { success: false, message: "Request not found." };
    }

    const studentId = reqDoc.student?._id ? reqDoc.student._id.toString() : reqDoc.student.toString();

    // Trigger expanded matching dispatch
    if (io) {
      await MatchingService.dispatchProgressiveNotifications(reqDoc, io);
    }
    return {
      success: true,
      message: `Auto-expanded tutor matching for '${reqDoc.subject}'.`,
    };
  }

  /**
   * Executes an administrative rescue action on an at-risk request.
   */
  public static async executeRescueAction(
    requestId: string,
    action: "rematch" | "extend" | "suggest_online" | "escalate",
    adminUserId: string,
    io?: any
  ): Promise<{ success: boolean; message: string }> {
    const reqDoc = await Request.findById(requestId).populate("student", "name email");
    if (!reqDoc) {
      return { success: false, message: "Request not found." };
    }

    const studentId = reqDoc.student?._id ? reqDoc.student._id.toString() : reqDoc.student.toString();

    if (action === "rematch") {
      // Trigger expanded matching dispatch
      if (io) {
        await MatchingService.dispatchProgressiveNotifications(reqDoc, io);
      }
      return {
        success: true,
        message: `Expanded tutor matching notifications dispatched for '${reqDoc.subject}'.`,
      };
    }

    if (action === "extend") {
      const currentExpiry = reqDoc.expiresAt && reqDoc.expiresAt.getTime() > Date.now()
        ? reqDoc.expiresAt
        : new Date();
      reqDoc.expiresAt = new Date(currentExpiry.getTime() + 7 * 86400000);
      reqDoc.extensionCount = (reqDoc.extensionCount || 0) + 1;
      reqDoc.status = "open";
      await reqDoc.save();

      if (io) {
        await sendNotification(io, studentId, {
          title: "🗓️ Tuition Request Extended",
          message: `Your request for ${reqDoc.subject} has been extended by 7 days by TUTORERA Operations.`,
          type: "general",
          link: "/dashboard",
        });
      }
      return {
        success: true,
        message: `Request extended by 7 days until ${reqDoc.expiresAt.toLocaleDateString()}.`,
      };
    }

    if (action === "suggest_online") {
      if (io) {
        await sendNotification(io, studentId, {
          title: "💡 Expand Options with Online Tutoring",
          message: `Local home tutors for ${reqDoc.subject} are limited in your area. Consider enabling online tutoring to connect with verified tutors across Pakistan immediately.`,
          type: "general",
          link: "/dashboard",
        });
      }
      return {
        success: true,
        message: "Proactive online conversion recommendation sent to student.",
      };
    }

    if (action === "escalate") {
      logger.info({ requestId, adminUserId }, "Request escalated to high-priority operations concierge");
      return {
        success: true,
        message: "Request escalated to High-Priority Concierge Queue.",
      };
    }

    return { success: false, message: "Unknown action." };
  }
}

export const AtRiskRequestServiceAlias = AtRiskRequestService;