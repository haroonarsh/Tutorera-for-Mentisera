// src/services/adminAgentOrchestrator.service.ts
//
// Orchestrates a full Supervisor Agent execution: plan → authorise → fan-out
// → collect → return unified response.
//
// This is the only entry-point that combines planning + reading. The controller
// applies RBAC and audit-logging before calling here.

import { hasPermission, type AdminRole } from "../config/rbac";
import {
  ADMIN_AGENT_REGISTRY,
  planAdminAgentTasks,
  type AdminAgentId,
  type AgentTask,
} from "./adminAgentSupervisor.service";
import { readAdminAgentSummary, type AgentSummary } from "./adminAgentRead.service";

export interface AgentExecutionResult {
  agentId: AdminAgentId;
  label: string;
  rationale: string;
  status: "success" | "error";
  summary?: AgentSummary;
  error?: string;
  durationMs: number;
}

export interface OrchestratorResult {
  message: string;
  executedAt: string;
  totalDurationMs: number;
  agentsExecuted: number;
  agentsSucceeded: number;
  agentsFailed: number;
  results: AgentExecutionResult[];
}

/**
 * Plans and executes all authorised agents for the given admin query.
 * Runs agent reads in parallel; individual failures are captured and reported
 * without failing the entire response.
 */
export async function executeAdminSupervisor(
  message: string,
  adminRole: string,
  adminPermissions: string[]
): Promise<OrchestratorResult> {
  const start = Date.now();

  const rawTasks = planAdminAgentTasks(message);

  // Filter to tasks the caller is authorised for
  const registryMap = Object.fromEntries(ADMIN_AGENT_REGISTRY.map((a) => [a.id, a]));
  const authorisedTasks: AgentTask[] = rawTasks.filter((t) => {
    const d = registryMap[t.agentId];
    return d && hasPermission(adminRole as AdminRole, adminPermissions, d.requiredPermission);
  });

  // Fan-out: execute all agents in parallel
  const settled = await Promise.allSettled(
    authorisedTasks.map(async (task): Promise<AgentExecutionResult> => {
      const agentStart = Date.now();
      const summary = await readAdminAgentSummary(task.agentId);
      return {
        agentId: task.agentId,
        label: task.label,
        rationale: task.rationale,
        status: "success",
        summary,
        durationMs: Date.now() - agentStart,
      };
    })
  );

  const results: AgentExecutionResult[] = settled.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    const task = authorisedTasks[i];
    return {
      agentId: task.agentId,
      label: task.label,
      rationale: task.rationale,
      status: "error",
      error: r.reason instanceof Error ? r.reason.message : String(r.reason),
      durationMs: 0,
    };
  });

  const succeeded = results.filter((r) => r.status === "success").length;

  return {
    message,
    executedAt: new Date().toISOString(),
    totalDurationMs: Date.now() - start,
    agentsExecuted: results.length,
    agentsSucceeded: succeeded,
    agentsFailed: results.length - succeeded,
    results,
  };
}
