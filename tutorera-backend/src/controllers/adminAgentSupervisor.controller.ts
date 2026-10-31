// src/controllers/adminAgentSupervisor.controller.ts
//
// Three admin-only endpoints for the AI Supervisor Agent:
//   GET  /api/v1/admin/agents                        — list agents visible to caller
//   POST /api/v1/admin/agents/supervisor/plan        — plan tasks from free-text query
//   GET  /api/v1/admin/agents/:agentId/summary       — fetch a specific agent's data
//
// Authorization is ALWAYS from RBAC — never from AI output.
// Every data-access call is audit-logged. Fail-closed: if the audit log insert
// fails the request is rejected rather than returning unaudited data.

import { Response } from "express";
import { AuthRequest as Request } from "../types";
import AuditLog from "../models/AuditLog.model";
import { hasPermission, type AdminRole } from "../config/rbac";
import {
  ADMIN_AGENT_REGISTRY,
  planAdminAgentTasks,
  type AdminAgentId,
} from "../services/adminAgentSupervisor.service";
import { readAdminAgentSummary } from "../services/adminAgentRead.service";
import { executeAdminSupervisor } from "../services/adminAgentOrchestrator.service";
import logger from "../config/logger";

// ── helpers ─────────────────────────────────────────────────────────────────

function adminInfo(req: Request) {
  return {
    id: req.user?._id?.toString() ?? "unknown",
    name: req.user?.name ?? "Unknown Admin",
    role: (req.user?.adminRole ?? "") as string,
    permissions: (req.user?.adminPermissions ?? []) as string[],
  };
}

async function writeAuditLog(
  actorId: string,
  actorName: string,
  action: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await AuditLog.create({
    action,
    actor: actorName,
    actorId,
    entity: "AdminAgent",
    metadata,
  });
}

// ── controllers ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/agents
 * Returns the agents the caller is authorised to access.
 */
export async function listAdminAgents(req: Request, res: Response): Promise<void> {
  const admin = adminInfo(req);
  const visible = ADMIN_AGENT_REGISTRY.filter((a) =>
    hasPermission(admin.role as AdminRole, admin.permissions, a.requiredPermission)
  );
  res.json({ agents: visible });
}

/**
 * POST /api/v1/admin/agents/supervisor/plan
 * Body: { message: string }
 * Plans which agents should handle the query, filtered to those the caller can access.
 */
export async function planAdminSupervisor(req: Request, res: Response): Promise<void> {
  const admin = adminInfo(req);
  const { message } = req.body as { message?: string };

  if (!message || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "message is required" });
    return;
  }
  if (message.length > 1000) {
    res.status(400).json({ error: "message too long (max 1000 characters)" });
    return;
  }

  let rawTasks;
  try {
    rawTasks = planAdminAgentTasks(message);
  } catch {
    res.status(400).json({ error: "INVALID_AGENT_REQUEST" });
    return;
  }

  // Filter to tasks the caller is authorised for
  const registry = Object.fromEntries(ADMIN_AGENT_REGISTRY.map((a) => [a.id, a]));
  const authorisedTasks = rawTasks.filter((t) => {
    const descriptor = registry[t.agentId];
    return descriptor && hasPermission(admin.role as AdminRole, admin.permissions, descriptor.requiredPermission);
  });

  // Fail-closed audit log
  try {
    await writeAuditLog(admin.id, admin.name, "admin_agent_plan", {
      message: message.slice(0, 200),
      tasksPlanned: authorisedTasks.map((t) => t.agentId),
    });
  } catch (err) {
    logger.error({ err }, "[AdminAgentSupervisor] audit log write failed — refusing request");
    res.status(500).json({ error: "Audit log unavailable — request cannot proceed" });
    return;
  }

  res.json({ tasks: authorisedTasks });
}

/**
 * POST /api/v1/admin/agents/supervisor/execute
 * Body: { message: string }
 * Plans + executes all authorised agents for the query and returns a unified result.
 */
export async function executeAdminSupervisorHandler(req: Request, res: Response): Promise<void> {
  const admin = adminInfo(req);
  const { message } = req.body as { message?: string };

  if (!message || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "message is required" });
    return;
  }
  if (message.length > 1000) {
    res.status(400).json({ error: "message too long (max 1000 characters)" });
    return;
  }

  // Fail-closed audit log before execution
  try {
    await writeAuditLog(admin.id, admin.name, "admin_agent_execute", {
      message: message.slice(0, 200),
    });
  } catch (err) {
    logger.error({ err }, "[AdminAgentSupervisor] audit log write failed — refusing execute");
    res.status(500).json({ error: "Audit log unavailable — request cannot proceed" });
    return;
  }

  try {
    const result = await executeAdminSupervisor(message, admin.role, admin.permissions);
    res.json(result);
  } catch (err) {
    logger.error({ err }, "[AdminAgentSupervisor] orchestrator execute failed");
    res.status(500).json({ error: "Supervisor execution failed" });
  }
}

/**
 * GET /api/v1/admin/agents/:agentId/summary
 * Returns aggregate data for a specific agent.
 */
export async function readAdminAgent(req: Request, res: Response): Promise<void> {
  const admin = adminInfo(req);
  const { agentId } = req.params as { agentId: string };

  const descriptor = ADMIN_AGENT_REGISTRY.find((a) => a.id === agentId);
  if (!descriptor) {
    res.status(404).json({ error: "Unknown agent" });
    return;
  }

  if (!hasPermission(admin.role as AdminRole, admin.permissions, descriptor.requiredPermission)) {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }

  // Fail-closed audit log before data access
  try {
    await writeAuditLog(admin.id, admin.name, "admin_agent_read", { agentId });
  } catch (err) {
    logger.error({ err }, "[AdminAgentSupervisor] audit log write failed — refusing request");
    res.status(500).json({ error: "Audit log unavailable — request cannot proceed" });
    return;
  }

  try {
    const summary = await readAdminAgentSummary(agentId as AdminAgentId);
    res.json(summary);
  } catch (err) {
    logger.error({ err, agentId }, "[AdminAgentSupervisor] agent read failed");
    res.status(500).json({ error: "Failed to retrieve agent summary" });
  }
}
