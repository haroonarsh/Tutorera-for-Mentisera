import { Response } from "express";
import { AuthRequest } from "../types";
import { AGENT_REGISTRY } from "../agents/registry";
import { planSupervisor, executeSupervisor } from "../agents/supervisor";
import { logAudit } from "../utils/logAudit";

// GET /api/admin/agents
// List all registered specialist agents with capabilities and status
export const listAgents = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    agents: AGENT_REGISTRY,
  });
};

// POST /api/admin/agents/supervisor/plan
// Classify intent and return a plan (no execution, no DB reads)
export const planAgentExecution = async (req: AuthRequest, res: Response): Promise<void> => {
  const query = (req.body as { query?: string }).query as string;
  const requestedBy = req.user?._id?.toString() ?? "unknown";

  const plan = planSupervisor(query, requestedBy);

  await logAudit({
    action: "supervisor.plan",
    actor: req.user?.email ?? "admin",
    actorId: requestedBy,
    entity: "SupervisorAgent",
    metadata: {
      correlationId: plan.correlationId,
      intent: plan.intent.slice(0, 200),
      selectedAgents: plan.selectedAgents,
    },
  });

  res.status(200).json({ success: true, plan });
};

// POST /api/admin/agents/supervisor/execute
// Full orchestrated execution across all relevant specialist agents
export const executeAgentQuery = async (req: AuthRequest, res: Response): Promise<void> => {
  const query = (req.body as { query?: string }).query as string;
  const requestedBy = req.user?._id?.toString() ?? "unknown";

  const result = await executeSupervisor(query, requestedBy);

  await logAudit({
    action: "supervisor.execute",
    actor: req.user?.email ?? "admin",
    actorId: requestedBy,
    entity: "SupervisorAgent",
    metadata: {
      correlationId: result.correlationId,
      intent: result.intent.slice(0, 200),
      durationMs: result.executionDurationMs,
      agentStatuses: result.agentResults.map((r) => ({ agentId: r.agentId, status: r.status })),
      warnings: result.warnings,
    },
  });

  res.status(200).json({ success: true, result });
};

// GET /api/admin/agents/:agentId/summary
// Individual agent metrics snapshot
export const getAgentSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  const { agentId } = req.params;
  const agent = AGENT_REGISTRY.find((a) => a.id === agentId);

  if (!agent) {
    res.status(404).json({ success: false, message: `Agent '${agentId}' not found.` });
    return;
  }

  // Run a targeted execution for just this agent
  const query = `summary for ${agentId}`;
  const requestedBy = req.user?._id?.toString() ?? "unknown";
  const result = await executeSupervisor(query, requestedBy);

  const agentResult = result.agentResults.find((r) => r.agentId === agentId);

  res.status(200).json({
    success: true,
    agent,
    summary: agentResult ?? null,
    correlationId: result.correlationId,
  });
};
