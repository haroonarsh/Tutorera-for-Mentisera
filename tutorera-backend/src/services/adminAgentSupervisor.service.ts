/**
 * Stage 1: deterministic, read-only administrative agent orchestration.
 * No model provider, autonomous writes, or cross-role data access.
 * All requests must pass the admin authentication and scoped RBAC middleware.
 */
export type AdminAgentId = "tutor" | "marketplace" | "finance" | "operations";

export interface AdminAgentTask {
  id: AdminAgentId;
  permission: "tutor.read" | "request.read" | "finance.reconcile" | "system.monitor";
  description: string;
  endpoint: string;
}

export const ADMIN_AGENT_REGISTRY: readonly AdminAgentTask[] = Object.freeze([
  { id: "tutor", permission: "tutor.read", description: "Review pending tutor verification work", endpoint: "/api/v1/admin/verifications" },
  { id: "marketplace", permission: "request.read", description: "Review marketplace tutoring requests", endpoint: "/api/v1/admin/marketplace/requests" },
  { id: "finance", permission: "finance.reconcile", description: "Review finance reconciliation exceptions", endpoint: "/api/v1/admin/finance/exceptions" },
  { id: "operations", permission: "system.monitor", description: "Review system health", endpoint: "/api/v1/admin/system/health" },
]);

export function planAdminAgentTasks(message: string): AdminAgentTask[] {
  const query = message.trim().toLowerCase();
  if (!query || query.length > 1000) throw new Error("INVALID_AGENT_REQUEST");
  const all = /\\b(all|overview|daily|today|platform|operations|summary)\\b/.test(query);
  return ADMIN_AGENT_REGISTRY.filter(agent => {
    if (all) return true;
    switch (agent.id) {
      case "tutor": return /\\b(tutor|verification|onboard)\\b/.test(query);
      case "marketplace": return /\\b(student|marketplace|request|offer|booking|bid)\\b/.test(query);
      case "finance": return /\\b(finance|payment|payout|refund|reconcil)\\b/.test(query);
      case "operations": return /\\b(system|health|outage|incident|api)\\b/.test(query);
    }
  });
}
