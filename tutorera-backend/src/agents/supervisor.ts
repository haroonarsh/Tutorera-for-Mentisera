import { v4 as uuidv4 } from "uuid";
import { AgentTask, AgentResult, SupervisorPlan, SupervisorResult } from "./types";
import { AGENT_REGISTRY, classifyIntent } from "./registry";
import { runTutorOperationsAgent } from "./tutorOperations.agent";
import { runStudentOperationsAgent } from "./studentOperations.agent";
import { runBookingLearningAgent } from "./bookingLearning.agent";
import { runPlatformIntelligenceAgent } from "./platformIntelligence.agent";

const AGENT_TIMEOUT_MS = 15_000;

type AgentRunner = (task: AgentTask) => Promise<AgentResult>;

const RUNNERS: Record<string, AgentRunner> = {
  "tutor-operations": runTutorOperationsAgent,
  "student-operations": runStudentOperationsAgent,
  "booking-learning": runBookingLearningAgent,
  "platform-intelligence": runPlatformIntelligenceAgent,
};

function withTimeout(promise: Promise<AgentResult>, ms: number, agentId: string): Promise<AgentResult> {
  const timeout = new Promise<AgentResult>((_, reject) =>
    setTimeout(() => reject(new Error(`Agent ${agentId} timed out after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

export function planSupervisor(query: string, requestedBy: string): SupervisorPlan {
  const correlationId = uuidv4();
  const { selectedAgents, reasoning } = classifyIntent(query);
  return {
    correlationId,
    intent: query,
    selectedAgents,
    reasoning,
    readOnly: true,
  };
}

export async function executeSupervisor(
  query: string,
  requestedBy: string,
  correlationId?: string
): Promise<SupervisorResult> {
  const corrId = correlationId ?? uuidv4();
  const startMs = Date.now();
  const { selectedAgents } = classifyIntent(query);
  const warnings: string[] = [];

  const tasks: AgentTask[] = selectedAgents.map((agentId) => ({
    taskId: uuidv4(),
    agentId,
    intent: query,
    parameters: {},
    requestedBy,
    correlationId: corrId,
    readOnly: true as const,
  }));

  const settled = await Promise.allSettled(
    tasks.map((task) => {
      const runner = RUNNERS[task.agentId];
      if (!runner) {
        return Promise.resolve<AgentResult>({
          taskId: task.taskId,
          agentId: task.agentId,
          status: "failed",
          findings: null,
          evidence: [],
          confidence: "low",
          generatedAt: new Date().toISOString(),
          warnings: [`No runner registered for agent: ${task.agentId}`],
        });
      }
      return withTimeout(runner(task), AGENT_TIMEOUT_MS, task.agentId);
    })
  );

  const agentResults: AgentResult[] = settled.map((result, i) => {
    if (result.status === "fulfilled") return result.value;
    const msg = result.reason instanceof Error ? result.reason.message : String(result.reason);
    warnings.push(`Agent ${tasks[i].agentId} failed: ${msg}`);
    return {
      taskId: tasks[i].taskId,
      agentId: tasks[i].agentId,
      status: "failed" as const,
      findings: null,
      evidence: [],
      confidence: "low" as const,
      generatedAt: new Date().toISOString(),
      warnings: [msg],
    };
  });

  // Aggregate successful findings by agentId
  const aggregatedFindings: Record<string, unknown> = {};
  for (const result of agentResults) {
    if (result.status !== "failed" && result.findings !== null) {
      aggregatedFindings[result.agentId] = result.findings;
    }
  }

  return {
    correlationId: corrId,
    intent: query,
    agentResults,
    aggregatedFindings,
    executionDurationMs: Date.now() - startMs,
    generatedAt: new Date().toISOString(),
    warnings,
  };
}
