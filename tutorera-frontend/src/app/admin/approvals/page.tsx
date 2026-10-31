"use client";
import { UI_COLORS, STATUS_COLORS, TEXT_COLORS } from "@/lib/brand";
import { useEffect, useState } from "react";
import api from "@/lib/axios";

const C = UI_COLORS;

interface ApprovalRequest {
  _id: string;
  requestedByAdminName: string;
  action: string;
  targetEntity: string;
  targetId: string;
  targetName?: string;
  rationale: string;
  status: "pending" | "approved" | "rejected" | "expired";
  expiresAt: string;
  createdAt: string;
  reviewedByAdminName?: string;
  reviewNote?: string;
  reviewedAt?: string;
}

function timeLeft(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

function ActionBadge({ action }: { action: string }) {
  const [entity, verb] = action.includes(".") ? action.split(".") : [action, ""];
  return (
    <span
      style={{
        background: STATUS_COLORS.warning.bg,
        color: STATUS_COLORS.warning.color,
        border: `1px solid ${STATUS_COLORS.warning.border}`,
        borderRadius: 6,
        padding: "2px 8px",
        fontSize: 12,
        fontWeight: 700,
        fontFamily: "monospace",
      }}
    >
      {entity}
      {verb && <span style={{ opacity: 0.6 }}>.{verb}</span>}
    </span>
  );
}

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/approvals");
      setRequests(data.requests ?? []);
    } catch {
      setError("Failed to load approval requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function decide(id: string, decision: "approved" | "rejected") {
    setReviewing(id);
    try {
      await api.post(`/admin/approvals/${id}/review`, { decision, reviewNote: note });
      setNote("");
      await load();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
            "Review failed"
          : "Review failed";
      setError(msg);
    } finally {
      setReviewing(null);
    }
  }

  return (
    <div style={{ padding: "24px 32px", maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: TEXT_COLORS.primary }}>
          Approval Queue
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: TEXT_COLORS.muted }}>
          Sensitive actions that require a second admin to approve before execution.
        </p>
      </div>

      {error && (
        <div
          style={{
            background: STATUS_COLORS.danger.bg,
            border: `1px solid ${STATUS_COLORS.danger.border}`,
            color: STATUS_COLORS.danger.color,
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 16,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {error}
          <button
            onClick={() => setError("")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 16 }}
          >
            ×
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: TEXT_COLORS.muted }}>
          Loading…
        </div>
      ) : requests.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontWeight: 700, color: TEXT_COLORS.primary, fontSize: 16 }}>
            No pending approvals
          </div>
          <div style={{ color: TEXT_COLORS.muted, fontSize: 13, marginTop: 4 }}>
            All caught up — nothing awaiting review.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {requests.map((r) => (
            <div
              key={r._id}
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: "18px 20px",
                boxShadow: C.shadowCard,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <ActionBadge action={r.action} />
                    <span
                      style={{
                        background: STATUS_COLORS.warning.bg,
                        color: STATUS_COLORS.warning.color,
                        border: `1px solid ${STATUS_COLORS.warning.border}`,
                        borderRadius: 20,
                        padding: "2px 8px",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      ⏳ {timeLeft(r.expiresAt)}
                    </span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 13, color: TEXT_COLORS.secondary }}>
                    <strong>{r.targetEntity}</strong>
                    {r.targetName ? ` · ${r.targetName}` : ""}{" "}
                    <span style={{ color: TEXT_COLORS.muted, fontSize: 11 }}>({r.targetId})</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: TEXT_COLORS.muted, textAlign: "right" }}>
                  <div>by {r.requestedByAdminName}</div>
                  <div>{new Date(r.createdAt).toLocaleString()}</div>
                </div>
              </div>

              <div
                style={{
                  background: C.card,
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 13,
                  color: TEXT_COLORS.body,
                  marginBottom: 14,
                  borderLeft: `3px solid ${C.accentBright}`,
                }}
              >
                <strong>Rationale: </strong>{r.rationale}
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Review note (optional)"
                  rows={2}
                  style={{
                    flex: 1,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: "8px 10px",
                    fontSize: 12,
                    resize: "vertical",
                    fontFamily: "inherit",
                    color: TEXT_COLORS.body,
                    background: C.card,
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <button
                    onClick={() => decide(r._id, "approved")}
                    disabled={reviewing === r._id}
                    style={{
                      background: STATUS_COLORS.success.bg,
                      color: STATUS_COLORS.success.color,
                      border: `1px solid ${STATUS_COLORS.success.border}`,
                      borderRadius: 8,
                      padding: "8px 18px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: reviewing === r._id ? "default" : "pointer",
                    }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => decide(r._id, "rejected")}
                    disabled={reviewing === r._id}
                    style={{
                      background: STATUS_COLORS.danger.bg,
                      color: STATUS_COLORS.danger.color,
                      border: `1px solid ${STATUS_COLORS.danger.border}`,
                      borderRadius: 8,
                      padding: "8px 18px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: reviewing === r._id ? "default" : "pointer",
                    }}
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
