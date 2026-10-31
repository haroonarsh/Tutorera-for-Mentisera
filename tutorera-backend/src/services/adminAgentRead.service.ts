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

export type AdminAgentId = "tutor" | "marketplace" | "finance" | "operations";

export interface AgentSummary {
  agentId: AdminAgentId;
  generatedAt: string;
  data: Record<string, unknown>;
}

export async function readAdminAgentSummary(agentId: AdminAgentId): Promise<AgentSummary> {
  const generatedAt = new Date().toISOString();

  switch (agentId) {
    case "tutor": {
      const [pending, approved, active, pendingAgreement, suspended] = await Promise.all([
        TutorProfile.countDocuments({ verificationStatus: "pending" }),
        TutorProfile.countDocuments({ verificationStatus: "approved", tutorStatus: "approved_pending_agreement" }),
        TutorProfile.countDocuments({ tutorStatus: "active" }),
        TutorProfile.countDocuments({ agreementAcceptanceRequired: true, agreementAcceptedAt: { $exists: false } }),
        TutorProfile.countDocuments({ tutorStatus: "suspended" }),
      ]);
      return {
        agentId,
        generatedAt,
        data: { pending, approved, active, pendingAgreement, suspended },
      };
    }

    case "marketplace": {
      const [openRequests, activeBookings, atRiskBookings] = await Promise.all([
        TutoringRequest.countDocuments({ status: "open" }),
        Booking.countDocuments({ status: "ongoing" }),
        Booking.countDocuments({ status: "ongoing", sessionDateTime: { $lt: new Date() } }),
      ]);
      return {
        agentId,
        generatedAt,
        data: { openRequests, activeBookings, atRiskBookings },
      };
    }

    case "finance": {
      const [pendingPayouts, agg] = await Promise.all([
        TutorPayout.countDocuments({ state: "requested" }),
        TutorPayout.aggregate([
          { $match: { state: "requested" } },
          { $group: { _id: "$currency", total: { $sum: "$totalAmount" } } },
        ]),
      ]);
      const pendingByCurrency: Record<string, number> = {};
      for (const row of agg) {
        pendingByCurrency[String(row._id)] = row.total as number;
      }
      return {
        agentId,
        generatedAt,
        data: { pendingPayouts, pendingByCurrency },
      };
    }

    case "operations": {
      const [openCases, criticalCases] = await Promise.all([
        SafetyCase.countDocuments({ status: { $in: ["open", "under_investigation"] } }),
        SafetyCase.countDocuments({ status: { $in: ["open", "under_investigation"] }, severity: "critical" }),
      ]);
      return {
        agentId,
        generatedAt,
        data: { openCases, criticalCases },
      };
    }

    default:
      throw new Error(`Unknown agent id: ${agentId}`);
  }
}
