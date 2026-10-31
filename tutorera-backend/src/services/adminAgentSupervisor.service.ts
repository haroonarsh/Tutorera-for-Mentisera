// src/services/adminAgentSupervisor.service.ts
//
// Registry of the four admin specialist agents and a deterministic task-planner
// that maps a natural-language query to the set of agents that should handle it.
//
// IMPORTANT: Authorization is NEVER derived from this file. Permitted agents are
// filtered separately in the controller using RBAC before this plan is exposed to
// the caller.

import type { Permission } from "../config/rbac";

export type AdminAgentId = "tutor" | "marketplace" | "finance" | "operations";

export interface AdminAgentDescriptor {
  id: AdminAgentId;
  label: string;
  description: string;
  requiredPermission: Permission;
  summaryEndpoint: string;
}

export const ADMIN_AGENT_REGISTRY: AdminAgentDescriptor[] = [
  {
    id: "tutor",
    label: "Tutor Operations Agent",
    description: "Surfaces tutor pipeline health, verification backlogs, quality metrics, and agreement compliance.",
    requiredPermission: "tutor.read",
    summaryEndpoint: "/api/v1/admin/agents/tutor/summary",
  },
  {
    id: "marketplace",
    label: "Marketplace Agent",
    description: "Reports on open requests, offer pipeline, match rates, and at-risk sessions.",
    requiredPermission: "matching.read",
    summaryEndpoint: "/api/v1/admin/agents/marketplace/summary",
  },
  {
    id: "finance",
    label: "Finance Agent",
    description: "Delivers payout pipeline status, reconciliation gaps, and revenue metrics.",
    requiredPermission: "payment.read",
    summaryEndpoint: "/api/v1/admin/agents/finance/summary",
  },
  {
    id: "operations",
    label: "Operations Agent",
    description: "Monitors system health, active safety cases, and platform-wide operational signals.",
    requiredPermission: "system.monitor",
    summaryEndpoint: "/api/v1/admin/agents/operations/summary",
  },
];

export interface AgentTask {
  agentId: AdminAgentId;
  label: string;
  rationale: string;
}

/**
 * Maps a free-text admin query to the set of agent tasks that should handle it.
 * Uses deterministic regex matching — no AI model is involved.
 * The caller MUST filter the result by RBAC before acting on it.
 */
export function planAdminAgentTasks(message: string): AgentTask[] {
  const query = message.trim().toLowerCase();
  if (!query || query.length > 1000) throw new Error("INVALID_AGENT_REQUEST");

  const tasks: AgentTask[] = [];

  // Word-boundary patterns — use RegExp constructor so the \b escapes are
  // evaluated correctly at runtime.
  const all = new RegExp(/\b(all|overview|daily|today|platform|operations|summary)\b/).test(query);
  const tutorKw = new RegExp(/\b(tutor|verification|agreement|onboard|quality|pipeline)\b/).test(query);
  const marketKw = new RegExp(/\b(market|request|match|offer|session|booking|at.?risk)\b/).test(query);
  const financeKw = new RegExp(/\b(finance|payment|payout|reconcil|revenue|earning)\b/).test(query);
  const opsKw = new RegExp(/\b(operation|system|health|safety|case|incident|monitor)\b/).test(query);

  if (all || tutorKw) {
    tasks.push({
      agentId: "tutor",
      label: "Tutor Operations Agent",
      rationale: all ? "Full platform overview requested" : "Query mentions tutor/verification topics",
    });
  }
  if (all || marketKw) {
    tasks.push({
      agentId: "marketplace",
      label: "Marketplace Agent",
      rationale: all ? "Full platform overview requested" : "Query mentions marketplace/request topics",
    });
  }
  if (all || financeKw) {
    tasks.push({
      agentId: "finance",
      label: "Finance Agent",
      rationale: all ? "Full platform overview requested" : "Query mentions finance/payment topics",
    });
  }
  if (all || opsKw) {
    tasks.push({
      agentId: "operations",
      label: "Operations Agent",
      rationale: all ? "Full platform overview requested" : "Query mentions operations/health topics",
    });
  }

  // Default: show all agents when nothing matched
  if (tasks.length === 0) {
    return ADMIN_AGENT_REGISTRY.map((a) => ({
      agentId: a.id,
      label: a.label,
      rationale: "No specific domain detected — showing all agents",
    }));
  }

  return tasks;
}
