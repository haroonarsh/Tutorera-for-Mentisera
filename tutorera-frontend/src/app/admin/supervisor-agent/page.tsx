"use client";

import api from "@/lib/axios";
import { showError } from "@/lib/toast";
import {
  Activity,
  BookOpen,
  Brain,
  CheckCircle,
  ChevronRight,
  Clock,
  GraduationCap,
  Loader2,
  BarChart3,
  Send,
  Shield,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface AgentCapability {
  name: string;
  description: string;
}

interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  status: "active" | "inactive";
}

interface AgentResult {
  taskId: string;
  agentId: string;
  status: "success" | "partial" | "failed";
  findings: unknown;
  evidence: { resourceId: string; queryScope: string; retrievedAt: string }[];
  confidence: "high" | "medium" | "low";
  generatedAt: string;
  warnings: string[];
}

interface ExecutionResult {
  correlationId: string;
  intent: string;
  agentResults: AgentResult[];
  aggregatedFindings: Record<string, unknown>;
  executionDurationMs: number;
  generatedAt: string;
  warnings: string[];
}

interface HistoryEntry {
  query: string;
  correlationId: string;
  durationMs: number;
  agentCount: number;
  status: "success" | "partial" | "failed";
  at: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const QUICK_QUERIES = [
  "How many tutors are awaiting verification?",
  "Show student registration trends",
  "What is the booking conversion rate?",
  "Generate today's operational overview",
  "Which subjects have insufficient tutor coverage?",
  "Identify platform data quality issues",
];

const AGENT_ICONS: Record<string, React.ReactNode> = {
  "tutor-operations": <GraduationCap size={18} />,
  "student-operations": <Users size={18} />,
  "booking-learning": <BookOpen size={18} />,
  "platform-intelligence": <Shield size={18} />,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function confidenceBadge(c: "high" | "medium" | "low") {
  const map = {
    high: "background:#dcfce7;color:#166534",
    medium: "background:#fef9c3;color:#854d0e",
    low: "background:#fee2e2;color:#991b1b",
  };
  return (
    <span
      style={{
        ...Object.fromEntries(
          map[c].split(";").map((s) => s.split(":") as [string, string])
        ),
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {c.toUpperCase()}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SupervisorAgentPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [agents] = useState<AgentDefinition[]>([
    {
      id: "tutor-operations",
      name: "Tutor Operations Agent",
      description: "Monitors tutor registrations, verification, profile completeness, and subject coverage.",
      capabilities: [
        { name: "tutor_counts", description: "Total, active, inactive, pending verification" },
        { name: "profile_completeness", description: "Missing documents and incomplete profiles" },
        { name: "subject_coverage", description: "Subject and curriculum distribution" },
        { name: "geo_distribution", description: "Country and city breakdown" },
        { name: "onboarding_bottlenecks", description: "Onboarding step analysis" },
      ],
      status: "active",
    },
    {
      id: "student-operations",
      name: "Student Operations Agent",
      description: "Provides aggregate intelligence about student accounts and demand patterns.",
      capabilities: [
        { name: "student_counts", description: "Total, active, inactive counts" },
        { name: "registration_trends", description: "7-day and 30-day trends" },
        { name: "subject_demand", description: "Subject demand from open requests" },
        { name: "awaiting_match", description: "Students with no accepted tutor yet" },
      ],
      status: "active",
    },
    {
      id: "booking-learning",
      name: "Booking & Learning Agent",
      description: "Analyses requests, bookings, conversion rates, and unmatched demand.",
      capabilities: [
        { name: "booking_counts", description: "Total, upcoming, completed, cancelled" },
        { name: "conversion_rate", description: "Request-to-booking conversion rate" },
        { name: "unmatched_requests", description: "Open requests with no accepted offers" },
        { name: "subject_demand", description: "Subject-level booking demand" },
      ],
      status: "active",
    },
    {
      id: "platform-intelligence",
      name: "Platform Intelligence Agent",
      description: "Monitors platform KPIs, data quality, role anomalies, and risk indicators.",
      capabilities: [
        { name: "platform_kpis", description: "Platform-wide counts and metrics" },
        { name: "data_quality", description: "Missing field indicators" },
        { name: "role_anomalies", description: "Account role inconsistencies" },
        { name: "risk_indicators", description: "Operational risk signals" },
        { name: "audit_summary", description: "Recent audit log entries" },
      ],
      status: "active",
    },
  ]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const handleExecute = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;

    setLoading(true);
    setResult(null);

    try {
      const { data } = await api.post("/admin/agents/supervisor/execute", { query: trimmed });
      const r: ExecutionResult = data.result;
      setResult(r);

      const overallStatus = r.agentResults.every((a) => a.status === "success")
        ? "success"
        : r.agentResults.some((a) => a.status === "success")
        ? "partial"
        : "failed";

      setHistory((prev) => [
        {
          query: trimmed,
          correlationId: r.correlationId,
          durationMs: r.executionDurationMs,
          agentCount: r.agentResults.length,
          status: overallStatus,
          at: r.generatedAt,
        },
        ...prev.slice(0, 19),
      ]);
    } catch {
      showError("Supervisor Agent request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <Brain size={28} color="#0329B2" />
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0329B2", margin: 0 }}>
            Supervisor Agent
          </h1>
          <span
            style={{
              background: "#dcfce7",
              color: "#166534",
              padding: "2px 10px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            READ-ONLY
          </span>
        </div>
        <p style={{ color: "#64748b", margin: 0 }}>
          AI-powered administrative intelligence. All operations are strictly read-only — no data is modified.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem" }}>
        {/* Main column */}
        <div>
          {/* Query console */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "1.25rem",
              marginBottom: "1.25rem",
            }}
          >
            <label style={{ fontWeight: 600, color: "#1e293b", display: "block", marginBottom: "0.5rem" }}>
              Administrative Query
            </label>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleExecute(query)}
                placeholder="Ask about tutors, students, bookings, or platform health…"
                maxLength={1000}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "0.625rem 1rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 14,
                  outline: "none",
                }}
              />
              <button
                onClick={() => handleExecute(query)}
                disabled={loading || !query.trim()}
                style={{
                  background: loading || !query.trim() ? "#94a3b8" : "#0329B2",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "0.625rem 1.25rem",
                  cursor: loading || !query.trim() ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={16} />}
                {loading ? "Running…" : "Execute"}
              </button>
            </div>

            {/* Quick queries */}
            <div style={{ marginTop: "0.875rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {QUICK_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => { setQuery(q); handleExecute(q); }}
                  disabled={loading}
                  style={{
                    background: "#f1f5f9",
                    border: "1px solid #e2e8f0",
                    borderRadius: 999,
                    padding: "4px 12px",
                    fontSize: 12,
                    cursor: "pointer",
                    color: "#334155",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <ChevronRight size={12} />
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div
              style={{
                background: "#f0f4ff",
                border: "1px solid #c7d2fe",
                borderRadius: 12,
                padding: "1.5rem",
                textAlign: "center",
                color: "#0329B2",
                marginBottom: "1.25rem",
              }}
            >
              <Loader2 size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 0.5rem" }} />
              <p style={{ margin: 0, fontWeight: 600 }}>Delegating to specialist agents…</p>
              <p style={{ margin: "0.25rem 0 0", fontSize: 13, color: "#64748b" }}>
                Running parallel read-only queries across all relevant agents
              </p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "1.25rem",
                marginBottom: "1.25rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1e293b" }}>
                  Results
                </h2>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                  {result.executionDurationMs}ms · {result.correlationId.slice(0, 8)}
                </span>
              </div>

              {result.warnings.length > 0 && (
                <div
                  style={{
                    background: "#fef9c3",
                    border: "1px solid #fde68a",
                    borderRadius: 8,
                    padding: "0.75rem",
                    marginBottom: "1rem",
                    fontSize: 13,
                  }}
                >
                  {result.warnings.map((w, i) => (
                    <div key={i}>⚠️ {w}</div>
                  ))}
                </div>
              )}

              <div style={{ display: "grid", gap: "0.75rem" }}>
                {result.agentResults.map((ar) => (
                  <div
                    key={ar.agentId}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      overflow: "hidden",
                    }}
                  >
                    <button
                      onClick={() =>
                        setExpandedAgent(expandedAgent === ar.agentId ? null : ar.agentId)
                      }
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.875rem 1rem",
                        background: ar.status === "failed" ? "#fff5f5" : "#f8fafc",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {ar.status === "success" ? (
                          <CheckCircle size={16} color="#16a34a" />
                        ) : ar.status === "failed" ? (
                          <XCircle size={16} color="#dc2626" />
                        ) : (
                          <Activity size={16} color="#d97706" />
                        )}
                        <span style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>
                          {AGENT_ICONS[ar.agentId]}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>
                          {ar.agentId}
                        </span>
                        {confidenceBadge(ar.confidence)}
                      </div>
                      <span style={{ color: "#94a3b8", fontSize: 12 }}>
                        {expandedAgent === ar.agentId ? "▲" : "▼"}
                      </span>
                    </button>

                    {expandedAgent === ar.agentId && (
                      <div style={{ padding: "1rem", borderTop: "1px solid #e2e8f0" }}>
                        {ar.status === "failed" ? (
                          <p style={{ color: "#dc2626", fontSize: 13 }}>
                            {ar.warnings.join("; ") || "Agent failed without a message."}
                          </p>
                        ) : (
                          <pre
                            style={{
                              background: "#f8fafc",
                              borderRadius: 6,
                              padding: "0.75rem",
                              fontSize: 12,
                              overflowX: "auto",
                              margin: 0,
                              color: "#334155",
                            }}
                          >
                            {JSON.stringify(ar.findings, null, 2)}
                          </pre>
                        )}
                        {ar.evidence.length > 0 && (
                          <div style={{ marginTop: "0.75rem" }}>
                            <p style={{ fontSize: 11, color: "#64748b", fontWeight: 600, margin: "0 0 0.25rem" }}>
                              EVIDENCE REFERENCES
                            </p>
                            {ar.evidence.map((e, i) => (
                              <div key={i} style={{ fontSize: 11, color: "#94a3b8" }}>
                                {e.resourceId} · {e.queryScope} · {e.retrievedAt}
                              </div>
                            ))}
                          </div>
                        )}
                        {ar.warnings.length > 0 && (
                          <div style={{ marginTop: "0.5rem", fontSize: 12, color: "#d97706" }}>
                            {ar.warnings.map((w, i) => <div key={i}>⚠️ {w}</div>)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Execution History */}
          {history.length > 0 && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "1.25rem",
              }}
            >
              <h2 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700, color: "#1e293b" }}>
                Execution History
              </h2>
              <div style={{ display: "grid", gap: "0.5rem" }}>
                {history.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.625rem 0.875rem",
                      background: "#f8fafc",
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {h.status === "success" ? (
                        <CheckCircle size={14} color="#16a34a" />
                      ) : h.status === "partial" ? (
                        <Activity size={14} color="#d97706" />
                      ) : (
                        <XCircle size={14} color="#dc2626" />
                      )}
                      <span style={{ color: "#334155", maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {h.query}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#94a3b8", fontSize: 12 }}>
                      <Clock size={12} />
                      {h.durationMs}ms · {h.agentCount} agents · {h.correlationId.slice(0, 8)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — Agent overview */}
        <div>
          <div
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "1.25rem",
              position: "sticky",
              top: "1.5rem",
            }}
          >
            <h2 style={{ margin: "0 0 1rem", fontSize: "0.9375rem", fontWeight: 700, color: "#1e293b" }}>
              Specialist Agents
            </h2>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: "0.875rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.375rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {AGENT_ICONS[agent.id]}
                      <span style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{agent.name}</span>
                    </div>
                    <span
                      style={{
                        background: "#dcfce7",
                        color: "#166534",
                        padding: "1px 6px",
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    >
                      READ-ONLY
                    </span>
                  </div>
                  <p style={{ margin: "0 0 0.5rem", fontSize: 12, color: "#64748b" }}>
                    {agent.description}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    {agent.capabilities.slice(0, 4).map((cap) => (
                      <span
                        key={cap.name}
                        style={{
                          background: "#f1f5f9",
                          color: "#475569",
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 500,
                        }}
                        title={cap.description}
                      >
                        {cap.name}
                      </span>
                    ))}
                    {agent.capabilities.length > 4 && (
                      <span style={{ fontSize: 10, color: "#94a3b8" }}>
                        +{agent.capabilities.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
