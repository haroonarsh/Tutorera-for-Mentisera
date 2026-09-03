"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { showError } from "@/lib/toast";

type EmailStatus = "queued" | "sent" | "delivered" | "opened" | "bounced" | "failed";

interface EmailLog {
  _id: string;
  eventType: string;
  templateId: string;
  recipientEmail: string;
  subject: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  providerMessageId?: string;
  status: EmailStatus;
  queuedAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  failedAt?: string;
  bounceReason?: string;
  retryCount: number;
  createdAt: string;
  user?: { name?: string; role?: string };
}

const statuses: EmailStatus[] = ["queued", "sent", "delivered", "opened", "bounced", "failed"];

const colors: Record<EmailStatus, { bg: string; color: string; border: string }> = {
  queued: { bg: "#fffbeb", color: "#92400e", border: "#fde68a" },
  sent: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  delivered: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  opened: { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
  bounced: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  failed: { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
};

export default function AdminEmailLogsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [status, setStatus] = useState<EmailStatus | "all">("all");
  const [eventType, setEventType] = useState("all");
  const [recipient, setRecipient] = useState("");
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "50");
    if (status !== "all") params.set("status", status);
    if (eventType !== "all") params.set("eventType", eventType);
    if (recipient.trim()) params.set("recipient", recipient.trim());
    return params.toString();
  }, [page, status, eventType, recipient]);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/email-logs?${query}`)
      .then(res => {
        setLogs(res.data.logs || []);
        setPages(res.data.pages || 1);
        setEventTypes(res.data.filters?.eventTypes || []);
        setStatusCounts(res.data.filters?.statusCounts || {});
      })
      .catch(err => showError(err, "Failed to load email logs"))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ margin: "0 0 6px", color: "#2563eb", fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>Admin · Communications</p>
        <h1 style={{ margin: 0, color: "#021550", fontSize: 28, fontWeight: 900 }}>Transactional Email Logs</h1>
        <p style={{ margin: "8px 0 0", color: "#64748b" }}>Track critical emails for verification, payment, booking, dispute, and account events.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 20 }}>
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            style={{
              textAlign: "left",
              border: `1px solid ${status === s ? colors[s].color : colors[s].border}`,
              background: colors[s].bg,
              color: colors[s].color,
              borderRadius: 14,
              padding: 14,
              cursor: "pointer",
              boxShadow: status === s ? "0 10px 24px rgba(2,21,80,0.12)" : "none",
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 900 }}>{statusCounts[s] || 0}</div>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: "capitalize" }}>{s}</div>
          </button>
        ))}
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 16, marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <select value={status} onChange={e => { setStatus(e.target.value as EmailStatus | "all"); setPage(1); }} style={fieldStyle}>
          <option value="all">All statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={eventType} onChange={e => { setEventType(e.target.value); setPage(1); }} style={fieldStyle}>
          <option value="all">All events</option>
          {eventTypes.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <input value={recipient} onChange={e => { setRecipient(e.target.value); setPage(1); }} placeholder="Search recipient email" style={{ ...fieldStyle, minWidth: 240 }} />
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1050 }}>
            <thead>
              <tr style={{ background: "#f8faff", color: "#475569", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                <th style={th}>Status</th>
                <th style={th}>Event</th>
                <th style={th}>Recipient</th>
                <th style={th}>Subject</th>
                <th style={th}>Related</th>
                <th style={th}>Provider ID</th>
                <th style={th}>Queued</th>
                <th style={th}>Sent/Failed</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={td}>Loading email logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={8} style={td}>No email logs match these filters.</td></tr>
              ) : logs.map(log => (
                <tr key={log._id} style={{ borderTop: "1px solid #e2e8f0" }}>
                  <td style={td}><StatusPill status={log.status} /></td>
                  <td style={td}><code style={codeStyle}>{log.eventType}</code><div style={muted}>{log.templateId}</div></td>
                  <td style={td}>{log.recipientEmail}<div style={muted}>{log.user?.name || "Unknown user"} {log.user?.role ? `· ${log.user.role}` : ""}</div></td>
                  <td style={td}>{log.subject}</td>
                  <td style={td}>{log.relatedEntityType || "—"}<div style={muted}>{log.relatedEntityId || ""}</div></td>
                  <td style={td}>{log.providerMessageId ? <code style={codeStyle}>{log.providerMessageId}</code> : "—"}</td>
                  <td style={td}>{formatDate(log.queuedAt || log.createdAt)}</td>
                  <td style={td}>{formatDate(log.failedAt || log.sentAt)}{log.bounceReason ? <div style={{ ...muted, color: "#b91c1c" }}>{log.bounceReason}</div> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
        <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} style={pagerStyle}>Previous</button>
        <span style={{ color: "#64748b", fontSize: 13 }}>Page {page} of {pages}</span>
        <button disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))} style={pagerStyle}>Next</button>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: EmailStatus }) {
  const c = colors[status];
  return <span style={{ display: "inline-flex", border: `1px solid ${c.border}`, background: c.bg, color: c.color, borderRadius: 999, padding: "5px 10px", fontSize: 12, fontWeight: 800, textTransform: "capitalize" }}>{status}</span>;
}

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
}

const fieldStyle: React.CSSProperties = { border: "1px solid #cbd5e1", borderRadius: 12, padding: "10px 12px", color: "#021550", background: "#fff", fontWeight: 700 };
const th: React.CSSProperties = { padding: 14, textAlign: "left", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: 14, color: "#0f172a", verticalAlign: "top", fontSize: 13 };
const muted: React.CSSProperties = { marginTop: 4, color: "#64748b", fontSize: 12 };
const codeStyle: React.CSSProperties = { background: "#f1f5f9", borderRadius: 6, padding: "2px 5px", color: "#021550" };
const pagerStyle: React.CSSProperties = { border: "1px solid #cbd5e1", borderRadius: 10, background: "#fff", color: "#021550", padding: "8px 12px", fontWeight: 800, cursor: "pointer" };
