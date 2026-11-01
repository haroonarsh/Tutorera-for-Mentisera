export interface AgentTask {
  taskId: string;
  agentId: string;
  intent: string;
  parameters: Record<string, unknown>;
  requestedBy: string;
  correlationId: string;
  readOnly: true;
}

export interface EvidenceReference {
  sourceType: "mongodb" | "api" | "computed";
  resourceId: string;
  queryScope: string;
  retrievedAt: string;
  dataFreshness: "realtime" | "cached" | "stale";
}

export interface AgentResult {
  taskId: string;
  agentId: string;
  status: "success" | "partial" | "failed";
  findings: unknown;
  evidence: EvidenceReference[];
  confidence: "high" | "medium" | "low";
  generatedAt: string;
  warnings: string[];
}

export interface AgentCapability {
  name: string;
  description: string;
}

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  status: "active" | "inactive";
}

export interface SupervisorPlan {
  correlationId: string;
  intent: string;
  selectedAgents: string[];
  reasoning: string;
  readOnly: true;
}

export interface SupervisorResult {
  correlationId: string;
  intent: string;
  agentResults: AgentResult[];
  aggregatedFindings: Record<string, unknown>;
  executionDurationMs: number;
  generatedAt: string;
  warnings: string[];
}
