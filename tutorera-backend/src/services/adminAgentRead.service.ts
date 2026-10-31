// src/services/adminAgentRead.service.ts
//
// Aggregate-only DB reads for each admin specialist agent.
// Never returns raw profile documents, emails, or contact fields — only
// counts, rates, and aggregate amounts safe for any admin with the relevant
// read permission.

import TutorProfile from "../models/TutorProfile.model";
import TutoringRequest from "../models/Request.model";
import Booking from "../models/Booking.model";
import TutorPayout from "../models/TutorPayout.model";
import SafetyCase from "../models/SafetyCase.model";
import { runInfrastructureProbes } from "./infrastructureProbe.service";

export type AdminAgentId = "tutor" | "marketplace" | "finance" | "operations";

export interface AgentSummary {
  agentId: AdminAgentId;
  generatedAt: string;
  data: Record<string, unknown>;
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

export async function readAdminAgentSummary(agentId: AdminAgentId): Promise<AgentSummary> {
  const generatedAt = new Date().toISOString();
  const day7 = daysAgo(7);
  const day30 = daysAgo(30);

  switch (agentId) {
    case "tutor": {
      const [
        pending,
        approvedPendingAgreement,
        active,
        pendingAgreement,
        suspended,
        newLast7Days,
        newLast30Days,
        reacceptanceRequired,
      ] = await Promise.all([
        TutorProfile.countDocuments({ verificationStatus: "pending" }),
        TutorProfile.countDocuments({ tutorStatus: "approved_pending_agreement" }),
        TutorProfile.countDocuments({ tutorStatus: "active" }),
        TutorProfile.countDocuments({
          agreementAcceptanceRequired: true,
          agreementAcceptedAt: { $exists: false },
        }),
        TutorProfile.countDocuments({ tutorStatus: "suspended" }),
        TutorProfile.countDocuments({ createdAt: { $gte: day7 } }),
        TutorProfile.countDocuments({ createdAt: { $gte: day30 } }),
        TutorProfile.countDocuments({
          tutorStatus: "agreement_reacceptance_required",
        }),
      ]);
      return {
        agentId,
        generatedAt,
        data: {
          pending,
          approvedPendingAgreement,
          active,
          pendingAgreement,
          suspended,
          reacceptanceRequired,
          newLast7Days,
          newLast30Days,
        },
      };
    }

    case "marketplace": {
      const [
        openRequests,
        ongoingBookings,
        upcomingBookings,
        completedLast7Days,
        cancelledLast7Days,
        newRequestsLast7Days,
      ] = await Promise.all([
        TutoringRequest.countDocuments({ status: "open" }),
        Booking.countDocuments({ status: "ongoing" }),
        Booking.countDocuments({ status: "upcoming" }),
        Booking.countDocuments({ status: "completed", updatedAt: { $gte: day7 } }),
        Booking.countDocuments({ status: "cancelled", updatedAt: { $gte: day7 } }),
        TutoringRequest.countDocuments({ createdAt: { $gte: day7 } }),
      ]);
      return {
        agentId,
        generatedAt,
        data: {
          openRequests,
          ongoingBookings,
          upcomingBookings,
          completedLast7Days,
          cancelledLast7Days,
          newRequestsLast7Days,
        },
      };
    }

    case "finance": {
      const [pendingPayouts, pendingAgg, completedAgg] = await Promise.all([
        TutorPayout.countDocuments({ state: "requested" }),
        TutorPayout.aggregate([
          { $match: { state: "requested" } },
          { $group: { _id: "$currency", total: { $sum: "$totalAmount" } } },
        ]),
        TutorPayout.aggregate([
          { $match: { state: "completed", updatedAt: { $gte: day30 } } },
          { $group: { _id: "$currency", total: { $sum: "$totalAmount" } } },
        ]),
      ]);

      const pendingByCurrency: Record<string, number> = {};
      for (const row of pendingAgg) {
        pendingByCurrency[String(row._id)] = row.total as number;
      }
      const completedLast30dByCurrency: Record<string, number> = {};
      for (const row of completedAgg) {
        completedLast30dByCurrency[String(row._id)] = row.total as number;
      }

      return {
        agentId,
        generatedAt,
        data: {
          pendingPayouts,
          pendingByCurrency,
          completedLast30dByCurrency,
        },
      };
    }

    case "operations": {
      const [
        openCases,
        criticalCases,
        newCasesLast7Days,
        resolvedLast7Days,
        infra,
      ] = await Promise.all([
        SafetyCase.countDocuments({ status: { $in: ["open", "under_investigation"] } }),
        SafetyCase.countDocuments({
          status: { $in: ["open", "under_investigation"] },
          severity: "critical",
        }),
        SafetyCase.countDocuments({ createdAt: { $gte: day7 } }),
        SafetyCase.countDocuments({ status: "resolved", updatedAt: { $gte: day7 } }),
        runInfrastructureProbes(),
      ]);
      return {
        agentId,
        generatedAt,
        data: {
          openCases,
          criticalCases,
          newCasesLast7Days,
          resolvedLast7Days,
          infrastructure: {
            overallStatus: infra.overallStatus,
            probes: infra.probes.map((p) => ({ name: p.name, status: p.status, detail: p.detail })),
          },
        },
      };
    }

    default:
      throw new Error(`Unknown agent id: ${agentId}`);
  }
}
