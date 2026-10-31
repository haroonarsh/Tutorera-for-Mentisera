import TutorProfile from "../models/TutorProfile.model";
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
  return {
    agentId,
    status: "not_implemented",
    message: "This specialist has no authorized aggregate reader yet.",
  };
}
