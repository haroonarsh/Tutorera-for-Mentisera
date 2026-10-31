"use client";
import { UI_COLORS, STATUS_COLORS, TEXT_COLORS } from "@/lib/brand";
import { useEffect, useRef, useState } from "react";
import api from "@/lib/axios";

const C = UI_COLORS;

// ── Types ────────────────────────────────────────────────────────────────────

interface AgentDescriptor {
  id: string;
  label: string;
  description: string;
  requiredPermission: string;
}

interface AgentExecutionResult {
  agentId: string;
  label: string;
  rationale: string;
  status: "success" | "error";
  summary?: { agentId: string; generatedAt: string; data: Record<string, unknown> };
  error?: string;
  durationMs: number;
}

interface OrchestratorResult {
  message: string;
  executedAt: string;
  totalDurationMs: number;
  agentsExecuted: number;
  agentsSucceeded: number;
  agentsFailed: number;
  results: AgentExecutionResult[];
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  result?: OrchestratorResult;
  loading?: boolean;
}

// ── Agent icon map ────────────────────────────────────────────────────────────

const AGENT_ICONS: Record<string, string> = {
  tutor: "🎓",
  marketplace: "🏪",
  finance: "💰",
  operations: "⚙️",
};

const AGENT_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  tutor: STATUS_COLORS.info,
  marketplace: STATUS_COLORS.purple,
  finance: STATUS_COLORS.success,
  operations: STATUS_COLORS.warning,
};

// ── Data field labels ─────────────────────────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  pending: "Pending verification",
  approvedPendingAgreement: "Approved, awaiting agreement",
  active: "Active tutors",
  pendingAgreement: "Agreement not signed",
  suspended: "Suspended",
  reacceptanceRequired: "Re-acceptance required",
  newLast7Days: "New (7 days)",
  newLast30Days: "New (30 days)",
  openRequests: "Open requests",
  ongoingBookings: "Ongoing bookings",
  upcomingBookings: "Upcoming bookings",
  completedLast7Days: "Completed (7 days)",
  cancelledLast7Days: "Cancelled (7 days)",
  newRequestsLast7Days: "New requests (7 days)",
  pendingPayouts: "Pending payouts",
  pendingByCurrency: "Pending by currency",
  completedLast30dByCurrency: "Paid out (30 days)",
  openCases: "Open safety cases",
  criticalCases: "Critical cases",
  newCasesLast7Days: "New cases (7 days)",
  resolvedLast7Days: "Resolved (7 days)",
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function MetricRow({ label, value }: { label: string; value: unknown }) {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return null;
    return (
      <div style={{ marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: TEXT_COLORS.muted }}>{label}</span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
          {entries.map(([k, v]) => (
            <span
              key={k}
              style={{
                background: C.accentLight,
                color: C.accent,
                borderRadius: 6,
                padding: "2px 8px",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {k}: {String(v)}
            </span>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "4px 0",
        borderBottom: `1px solid ${C.border}`,
        fontSize: 13,
      }}
    >
      <span style={{ color: TEXT_COLORS.secondary }}>{label}</span>
      <span style={{ fontWeight: 700, color: TEXT_COLORS.primary }}>{String(value)}</span>
    </div>
  );
}

function AgentCard({ result }: { result: AgentExecutionResult }) {
  const colors = AGENT_COLORS[result.agentId] ?? STATUS_COLORS.neutral;
  const icon = AGENT_ICONS[result.agentId] ?? "🤖";

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: "16px 18px",
        flex: "1 1 280px",
        minWidth: 240,
        boxShadow: C.shadowCard,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: TEXT_COLORS.primary }}>{result.label}</div>
          <div style={{ fontSize: 11, color: TEXT_COLORS.muted }}>{result.rationale}</div>
        </div>
        {result.status === "error" ? (
          <span
            style={{
              ...STATUS_COLORS.danger,
              background: STATUS_COLORS.danger.bg,
              color: STATUS_COLORS.danger.color,
              border: `1px solid ${STATUS_COLORS.danger.border}`,
              borderRadius: 20,
              padding: "2px 8px",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Error
          </span>
        ) : (
          <span
            style={{
              background: colors.bg,
              color: colors.color,
              border: `1px solid ${colors.border}`,
              borderRadius: 20,
              padding: "2px 8px",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {result.durationMs}ms
          </span>
        )}
      </div>

      {result.status === "error" && (
        <p style={{ color: STATUS_COLORS.danger.color, fontSize: 12, margin: 0 }}>{result.error}</p>
      )}

      {result.status === "success" && result.summary && (
        <div>
          {Object.entries(result.summary.data).map(([k, v]) => (
            <MetricRow key={k} label={FIELD_LABELS[k] ?? k} value={v} />
          ))}
        </div>
      )}
    </div>
  );
}

function AssistantMessage({ msg }: { msg: ChatMessage }) {
  if (msg.loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0" }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: C.brandGradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          🤖
        </div>
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: "12px 16px",
            fontSize: 13,
            color: TEXT_COLORS.muted,
          }}
        >
          <span style={{ animation: "pulse 1.5s ease-in-out infinite" }}>Consulting agents…</span>
        </div>
      </div>
    );
  }

  if (!msg.result) {
    return (
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 0" }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: C.brandGradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          🤖
        </div>
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: "12px 16px",
            fontSize: 13,
            color: TEXT_COLORS.body,
          }}
        >
          {msg.text}
        </div>
      </div>
    );
  }

  const r = msg.result;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 0" }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: C.brandGradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        🤖
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 10,
            fontSize: 12,
            color: TEXT_COLORS.muted,
          }}
        >
          <span>
            {r.agentsSucceeded}/{r.agentsExecuted} agents
          </span>
          <span>·</span>
          <span>{r.totalDurationMs}ms total</span>
          <span>·</span>
          <span>{new Date(r.executedAt).toLocaleTimeString()}</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {r.results.map((res) => (
            <AgentCard key={res.agentId} result={res} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Quick queries ─────────────────────────────────────────────────────────────

const QUICK_QUERIES = [
  "Give me a full platform overview",
  "Show tutor pipeline and agreement status",
  "Payout and revenue summary",
  "Safety cases and system health",
  "Marketplace request activity this week",
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SupervisorAgentPage() {
  const [agents, setAgents] = useState<AgentDescriptor[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get("/admin/agents").then((r) => setAgents(r.data.agents ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function submit(query?: string) {
    const msg = (query ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", text: msg },
      { role: "assistant", text: "", loading: true },
    ]);

    try {
      const { data } = await api.post<OrchestratorResult>("/admin/agents/supervisor/execute", {
        message: msg,
      });
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", text: "", result: data },
      ]);
    } catch (err: unknown) {
      const errMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? "Request failed"
          : "Request failed";
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", text: `Error: ${errMsg}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 80px)",
        background: C.gray50,
        fontFamily: "inherit",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: C.brandGradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
          }}
        >
          🤖
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: TEXT_COLORS.primary }}>
            TUTORERA Supervisor Agent
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: TEXT_COLORS.muted }}>
            {agents.length} agents available &nbsp;·&nbsp; Ask anything about platform operations
          </p>
        </div>
        {/* Agent chips */}
        <div style={{ display: "flex", gap: 6, marginLeft: "auto", flexWrap: "wrap" }}>
          {agents.map((a) => (
            <span
              key={a.id}
              style={{
                background: (AGENT_COLORS[a.id] ?? STATUS_COLORS.neutral).bg,
                color: (AGENT_COLORS[a.id] ?? STATUS_COLORS.neutral).color,
                border: `1px solid ${(AGENT_COLORS[a.id] ?? STATUS_COLORS.neutral).border}`,
                borderRadius: 20,
                padding: "3px 10px",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {AGENT_ICONS[a.id] ?? "🤖"} {a.label.replace(" Agent", "")}
            </span>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              gap: 20,
              padding: 40,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 48 }}>🤖</div>
            <div>
              <h2 style={{ margin: "0 0 8px", color: TEXT_COLORS.primary, fontSize: 20 }}>
                What would you like to know?
              </h2>
              <p style={{ margin: 0, color: TEXT_COLORS.muted, fontSize: 14 }}>
                Ask about tutors, marketplace activity, finance, or platform operations.
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {QUICK_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => submit(q)}
                  style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 20,
                    padding: "8px 16px",
                    fontSize: 13,
                    cursor: "pointer",
                    color: TEXT_COLORS.body,
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.target as HTMLButtonElement).style.borderColor = C.accentBright)
                  }
                  onMouseLeave={(e) =>
                    ((e.target as HTMLButtonElement).style.borderColor = C.border)
                  }
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "flex-end",
                padding: "8px 0",
              }}
            >
              <div
                style={{
                  background: C.brandGradient,
                  color: "#fff",
                  borderRadius: 12,
                  padding: "10px 16px",
                  maxWidth: "70%",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {msg.text}
              </div>
            </div>
          ) : (
            <AssistantMessage key={i} msg={msg} />
          )
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div
        style={{
          background: C.surface,
          borderTop: `1px solid ${C.border}`,
          padding: "12px 24px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            background: C.card,
            border: `1.5px solid ${C.border}`,
            borderRadius: 12,
            padding: "8px 12px",
            transition: "border-color 0.15s",
          }}
          onFocusCapture={(e) =>
            ((e.currentTarget as HTMLDivElement).style.borderColor = C.accentBright)
          }
          onBlurCapture={(e) =>
            ((e.currentTarget as HTMLDivElement).style.borderColor = C.border)
          }
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submit()}
            placeholder="Ask about platform operations… (Enter to send)"
            disabled={loading}
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: 14,
              color: TEXT_COLORS.body,
            }}
          />
          <button
            onClick={() => submit()}
            disabled={loading || !input.trim()}
            style={{
              background: loading || !input.trim() ? C.border : C.brandGradient,
              color: loading || !input.trim() ? TEXT_COLORS.muted : "#fff",
              border: "none",
              borderRadius: 8,
              padding: "6px 16px",
              fontSize: 13,
              fontWeight: 700,
              cursor: loading || !input.trim() ? "default" : "pointer",
              transition: "background 0.2s",
              flexShrink: 0,
            }}
          >
            {loading ? "…" : "Send"}
          </button>
        </div>
        <p style={{ margin: "6px 0 0", fontSize: 11, color: TEXT_COLORS.muted, textAlign: "center" }}>
          Results are live data aggregates. No identifiable user data is included.
        </p>
      </div>
    </div>
  );
}
