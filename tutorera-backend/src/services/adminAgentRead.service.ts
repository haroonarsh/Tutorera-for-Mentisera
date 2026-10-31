import TutorProfile from "../models/TutorProfile.model";
import Request from "../models/Request.model";
import Booking from "../models/Booking.model";
import SafetyCase from "../models/SafetyCase.model";
import { AdminAgentId } from "./adminAgentSupervisor.service";

export interface AgentReadResult {
  agentId: AdminAgentId;
  status: "completed" | "not_implemented";
  data?: Record<string, number>;
  message?: string;
}

/**
 * Bounded, aggregate-only specialist read. Never returns profile records,
 * contact details, documents, or sensitive verification evidence.
 * Country-scoped administrators are blocked at the router middleware.
 */
export async function readAdminAgentSummary(agentId: AdminAgentId): Promise<AgentReadResult> {
  if (agentId === "tutor") {
    const [pendingVerifications, approvedTutors, rejectedTutors] = await Promise.all([
      TutorProfile.countDocuments({ verificationStatus: "pending" }),
      TutorProfile.countDocuments({ verificationStatus: "approved" }),
      TutorProfile.countDocuments({ verificationStatus: "rejected" }),
    ]);
    return {
      agentId,
      status: "completed",
      data: { pendingVerifications, approvedTutors, rejectedTutors },
    };
  }
  if (agentId === "marketplace") {
    const activeRequests = await Request.countDocuments({ status: { $in: ["open", "published", "receiving_offers", "negotiating"] } });
    const awaitingPayment = await Request.countDocuments({ status: "awaiting_payment" });
    return { agentId, status: "completed", data: { activeRequests, awaitingPayment } };
  }
  if (agentId === "finance") {
    const failedPayments = await Booking.countDocuments({ paymentStatus: "failed" });
    const heldPayouts = await Booking.countDocuments({ payoutStatus: "held" });
    return { agentId, status: "completed", data: { failedPayments, heldPayouts } };
  }
  if (agentId === "operations") {
    const openSafetyCases = await SafetyCase.countDocuments({ status: { $in: ["open", "under_investigation"] } });
    return { agentId, status: "completed", data: { openSafetyCases } };
  }
  return {
    agentId,
    status: "not_implemented",
    message: "This specialist has no authorized aggregate reader yet.",
  };
}
