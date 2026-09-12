"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  RotateCcw, ArrowLeft, RefreshCw, Search, CheckCircle,
  XCircle, Clock, AlertTriangle, Check, X, ShieldAlert,
  FileText, CreditCard
} from "lucide-react";
import api from "@/lib/axios";
import { UI_COLORS, STATUS_COLORS, TEXT_COLORS } from "@/lib/brand";

interface RefundRequestItem {
  _id: string;
  student?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  tutor?: {
    _id: string;
    name: string;
    email: string;
  };
  booking?: {
    _id: string;
    amount: number;
    studentTotal: number;
    schedule?: string;
    teachingMode?: string;
    createdAt?: string;
  };
  amount: number;
  reason: string;
  details?: string;
  status: "pending" | "approved" | "rejected" | "processed";
  adminNote?: string;
  processedAt?: string;
  createdAt: string;
}

const REASON_LABELS: Record<string, string> = {
  tutor_no_show: "Tutor Did Not Show Up",
  poor_quality: "Unsatisfactory Quality",
  technical_issues: "Technical / Connectivity Issues",
  scheduling_conflict: "Scheduling Conflict",
  other: "Other Reason",
};

function RefundRequestsContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "ALL";

  const [requests, setRequests] = useState<RefundRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);

  // Resolution modal state
  const [selectedRequest, setSelectedRequest] = useState<RefundRequestItem | null>(null);
  const [actionType, setActionType] = useState<"approved" | "rejected" | "processed" | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  const fetchRefundRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/refund-requests");
      if (res.data?.success) {
        setRequests(res.data.refundRequests || []);
      }
    } catch (err) {
      console.error("Failed to load refund requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefundRequests();
  }, []);

  const handleUpdateStatus = async () => {
    if (!selectedRequest || !actionType) return;
    setSubmitting(true);
    setActionError("");
    setActionSuccess("");

    try {
      const res = await api.patch(`/admin/refund-requests/${selectedRequest._id}`, {
        status: actionType,
        adminNote,
      });

      if (res.data?.success) {
        setActionSuccess(`Request successfully marked as ${actionType}.`);
        setRequests((prev) =>
          prev.map((r) =>
            r._id === selectedRequest._id
              ? { ...r, status: actionType, adminNote, processedAt: new Date().toISOString() }
              : r
          )
        );
        setTimeout(() => {
          setSelectedRequest(null);
          setActionType(null);
          setAdminNote("");
          setActionSuccess("");
        }, 1200);
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || "Failed to update refund request.");
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics
  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved" || r.status === "processed").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;
  const pendingValue = requests
    .filter((r) => r.status === "pending")
    .reduce((acc, r) => acc + (r.amount || r.booking?.studentTotal || 0), 0);

  const filtered = requests.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (r.student?.name && r.student.name.toLowerCase().includes(term)) ||
      (r.student?.email && r.student.email.toLowerCase().includes(term)) ||
      (r.tutor?.name && r.tutor.name.toLowerCase().includes(term)) ||
      (r.booking?._id && r.booking._id.toLowerCase().includes(term)) ||
      (r.reason && r.reason.toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ padding: "1.75rem 2rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Breadcrumb & Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link href="/admin" style={{ color: TEXT_COLORS.muted, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.82rem", fontWeight: 700 }}>
              <ArrowLeft size={14} /> Control Tower
            </Link>
            <span style={{ color: UI_COLORS.border }}>/</span>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: UI_COLORS.accent }}>Trust & Safety</span>
            <span style={{ color: UI_COLORS.border }}>/</span>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: UI_COLORS.accent }}>Refund Requests</span>
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 900, color: TEXT_COLORS.body, margin: 0 }}>
            Refund & Dispute Resolution
          </h1>
          <p style={{ color: TEXT_COLORS.muted, fontSize: "0.85rem", margin: "0.25rem 0 0" }}>
            Triage, investigate, and approve customer refund requests with automated transactional notification logs.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <button
            onClick={fetchRefundRequests}
            disabled={loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.55rem 0.9rem",
              borderRadius: "0.5rem",
              border: `1px solid ${UI_COLORS.border}`,
              background: UI_COLORS.surface,
              color: TEXT_COLORS.secondary,
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ background: UI_COLORS.surface, border: `1px solid ${UI_COLORS.border}`, borderRadius: "0.75rem", padding: "1.1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: TEXT_COLORS.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>Pending Review</span>
            <span style={{ padding: "0.3rem", borderRadius: "0.4rem", background: STATUS_COLORS.warning.bg, color: STATUS_COLORS.warning.color }}><Clock size={16} /></span>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 900, color: pendingCount > 0 ? UI_COLORS.error : TEXT_COLORS.body }}>{loading ? "..." : pendingCount}</div>
          <div style={{ fontSize: "0.75rem", color: TEXT_COLORS.muted, marginTop: "0.2rem" }}>Awaiting admin action</div>
        </div>

        <div style={{ background: UI_COLORS.surface, border: `1px solid ${UI_COLORS.border}`, borderRadius: "0.75rem", padding: "1.1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: TEXT_COLORS.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>Pending Exposure</span>
            <span style={{ padding: "0.3rem", borderRadius: "0.4rem", background: STATUS_COLORS.danger.bg, color: STATUS_COLORS.danger.color }}><CreditCard size={16} /></span>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 900, color: STATUS_COLORS.danger.color }}>
            {loading ? "..." : `PKR ${pendingValue.toLocaleString()}`}
          </div>
          <div style={{ fontSize: "0.75rem", color: TEXT_COLORS.muted, marginTop: "0.2rem" }}>Disputed customer funds</div>
        </div>

        <div style={{ background: UI_COLORS.surface, border: `1px solid ${UI_COLORS.border}`, borderRadius: "0.75rem", padding: "1.1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: TEXT_COLORS.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>Approved / Settled</span>
            <span style={{ padding: "0.3rem", borderRadius: "0.4rem", background: STATUS_COLORS.success.bg, color: STATUS_COLORS.success.color }}><CheckCircle size={16} /></span>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 900, color: STATUS_COLORS.success.color }}>{loading ? "..." : approvedCount}</div>
          <div style={{ fontSize: "0.75rem", color: TEXT_COLORS.muted, marginTop: "0.2rem" }}>Refunded to customer</div>
        </div>

        <div style={{ background: UI_COLORS.surface, border: `1px solid ${UI_COLORS.border}`, borderRadius: "0.75rem", padding: "1.1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: TEXT_COLORS.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>Rejected Claims</span>
            <span style={{ padding: "0.3rem", borderRadius: "0.4rem", background: STATUS_COLORS.neutral.bg, color: TEXT_COLORS.muted }}><XCircle size={16} /></span>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 900, color: TEXT_COLORS.muted }}>{loading ? "..." : rejectedCount}</div>
          <div style={{ fontSize: "0.75rem", color: TEXT_COLORS.muted, marginTop: "0.2rem" }}>Out of policy / dismissed</div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div style={{ background: UI_COLORS.surface, border: `1px solid ${UI_COLORS.border}`, borderRadius: "0.75rem", padding: "1rem 1.25rem", marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {[
            { id: "ALL", label: "All Requests", count: totalCount },
            { id: "pending", label: "Pending", count: pendingCount },
            { id: "approved", label: "Approved", count: requests.filter((r) => r.status === "approved").length },
            { id: "processed", label: "Processed", count: requests.filter((r) => r.status === "processed").length },
            { id: "rejected", label: "Rejected", count: rejectedCount },
          ].map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: "0.45rem 0.85rem",
                  borderRadius: "999px",
                  fontSize: "0.78rem",
                  fontWeight: active ? 800 : 600,
                  border: active ? `1px solid ${UI_COLORS.accent}` : `1px solid ${UI_COLORS.border}`,
                  background: active ? UI_COLORS.accent : STATUS_COLORS.neutral.bg,
                  color: active ? UI_COLORS.surface : TEXT_COLORS.muted,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  transition: "all 150ms ease",
                }}
              >
                <span>{tab.label}</span>
                <span style={{ fontSize: "0.7rem", opacity: 0.85 }}>({tab.count})</span>
              </button>
            );
          })}
        </div>

        <div style={{ position: "relative", minWidth: "260px" }}>
          <Search size={15} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: UI_COLORS.gray500 }} />
          <input
            type="text"
            placeholder="Search student, tutor, reason, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem 0.85rem 0.5rem 2.2rem",
              borderRadius: "0.5rem",
              border: `1px solid ${UI_COLORS.border}`,
              fontSize: "0.82rem",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Requests Table */}
      <div style={{ background: UI_COLORS.surface, border: `1px solid ${UI_COLORS.border}`, borderRadius: "0.75rem", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: TEXT_COLORS.muted }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 0.75rem" }} />
            <p style={{ fontSize: "0.9rem", fontWeight: 600 }}>Loading refund requests...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: TEXT_COLORS.muted }}>
            <RotateCcw size={32} style={{ margin: "0 auto 0.75rem", opacity: 0.4 }} />
            <p style={{ fontSize: "0.95rem", fontWeight: 700, color: TEXT_COLORS.body, margin: 0 }}>No refund requests found</p>
            <p style={{ fontSize: "0.82rem", margin: "0.25rem 0 0" }}>
              {search || statusFilter !== "ALL" ? "Try adjusting your search or status filter." : "There are currently no refund requests submitted."}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ background: STATUS_COLORS.neutral.bg, borderBottom: `1px solid ${UI_COLORS.border}`, color: TEXT_COLORS.muted, fontWeight: 700 }}>
                  <th style={{ padding: "0.75rem 1rem" }}>Student</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Tutor Involved</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Claim Amount</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Reason</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Submitted</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Triage</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const amount = r.amount || r.booking?.studentTotal || 0;
                  const reasonLabel = REASON_LABELS[r.reason] || r.reason;

                  const statusConfig =
                    r.status === "approved"
                      ? { bg: STATUS_COLORS.success.bg, text: STATUS_COLORS.success.color, border: STATUS_COLORS.success.border, label: "Approved" }
                      : r.status === "processed"
                      ? { bg: STATUS_COLORS.info.bg, text: STATUS_COLORS.info.color, border: STATUS_COLORS.info.border, label: "Processed" }
                      : r.status === "rejected"
                      ? { bg: STATUS_COLORS.danger.bg, text: STATUS_COLORS.danger.color, border: STATUS_COLORS.danger.border, label: "Rejected" }
                      : { bg: STATUS_COLORS.warning.bg, text: STATUS_COLORS.warning.color, border: STATUS_COLORS.warning.border, label: "Pending Review" };

                  return (
                    <tr key={r._id} style={{ borderBottom: `1px solid ${UI_COLORS.border}` }}>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ fontWeight: 800, color: TEXT_COLORS.body }}>{r.student?.name || "Anonymous Student"}</div>
                        <div style={{ fontSize: "0.75rem", color: TEXT_COLORS.muted }}>{r.student?.email}</div>
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ fontWeight: 700, color: TEXT_COLORS.secondary }}>{r.tutor?.name || "Tutor"}</div>
                        <div style={{ fontSize: "0.72rem", color: TEXT_COLORS.muted }}>{r.tutor?.email}</div>
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ fontWeight: 800, color: TEXT_COLORS.body }}>PKR {amount.toLocaleString()}</div>
                        {r.booking?._id && (
                          <div style={{ fontSize: "0.7rem", color: TEXT_COLORS.muted }}>
                            Booking #{r.booking._id.slice(-6).toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "0.85rem 1rem", maxWidth: "240px" }}>
                        <div style={{ fontWeight: 700, color: TEXT_COLORS.body }}>{reasonLabel}</div>
                        {r.details && (
                          <div style={{ fontSize: "0.72rem", color: TEXT_COLORS.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.details}>
                            {r.details}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.2rem 0.55rem",
                            borderRadius: "999px",
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            background: statusConfig.bg,
                            color: statusConfig.text,
                            border: `1px solid ${statusConfig.border}`,
                          }}
                        >
                          {statusConfig.label}
                        </span>
                      </td>
                      <td style={{ padding: "0.85rem 1rem", color: TEXT_COLORS.muted, fontSize: "0.75rem" }}>
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                        <button
                          onClick={() => {
                            setSelectedRequest(r);
                            setActionType(r.status === "pending" ? "approved" : r.status);
                            setAdminNote(r.adminNote || "");
                            setActionError("");
                            setActionSuccess("");
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            padding: "0.35rem 0.75rem",
                            borderRadius: "0.4rem",
                            border: `1px solid ${UI_COLORS.border}`,
                            background: UI_COLORS.surface,
                            color: UI_COLORS.accent,
                            cursor: "pointer",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                          }}
                        >
                          Review & Resolve
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review & Resolution Modal */}
      {selectedRequest && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: UI_COLORS.surface,
              borderRadius: "0.85rem",
              width: "100%",
              maxWidth: "540px",
              padding: "1.5rem",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: TEXT_COLORS.body }}>
                  Review Refund Claim
                </h3>
                <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: TEXT_COLORS.muted }}>
                  Request ID: #{selectedRequest._id.slice(-8).toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                style={{ border: "none", background: "transparent", cursor: "pointer", color: UI_COLORS.gray500, padding: "0.25rem" }}
              >
                <X size={18} />
              </button>
            </div>

            {actionError && (
              <div style={{ background: STATUS_COLORS.danger.bg, border: `1px solid ${STATUS_COLORS.danger.border}`, borderRadius: "0.5rem", padding: "0.6rem 0.8rem", color: STATUS_COLORS.danger.color, fontSize: "0.78rem", marginBottom: "1rem" }}>
                {actionError}
              </div>
            )}
            {actionSuccess && (
              <div style={{ background: STATUS_COLORS.success.bg, border: `1px solid ${STATUS_COLORS.success.border}`, borderRadius: "0.5rem", padding: "0.6rem 0.8rem", color: STATUS_COLORS.success.color, fontSize: "0.78rem", marginBottom: "1rem" }}>
                {actionSuccess}
              </div>
            )}

            {/* Claim Summary Box */}
            <div style={{ background: STATUS_COLORS.neutral.bg, border: `1px solid ${UI_COLORS.border}`, borderRadius: "0.6rem", padding: "0.85rem 1rem", marginBottom: "1rem", fontSize: "0.8rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ color: TEXT_COLORS.muted }}>Student:</span>
                <span style={{ fontWeight: 700, color: TEXT_COLORS.body }}>{selectedRequest.student?.name} ({selectedRequest.student?.email})</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ color: TEXT_COLORS.muted }}>Tutor:</span>
                <span style={{ fontWeight: 700, color: TEXT_COLORS.body }}>{selectedRequest.tutor?.name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ color: TEXT_COLORS.muted }}>Claim Amount:</span>
                <span style={{ fontWeight: 900, color: UI_COLORS.error }}>PKR {(selectedRequest.amount || selectedRequest.booking?.studentTotal || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ color: TEXT_COLORS.muted }}>Reason:</span>
                <span style={{ fontWeight: 700, color: TEXT_COLORS.body }}>{REASON_LABELS[selectedRequest.reason] || selectedRequest.reason}</span>
              </div>
              {selectedRequest.details && (
                <div style={{ marginTop: "0.4rem", paddingTop: "0.4rem", borderTop: `1px dashed ${UI_COLORS.border}` }}>
                  <span style={{ color: TEXT_COLORS.muted, display: "block", marginBottom: "0.2rem" }}>Student Details:</span>
                  <div style={{ fontStyle: "italic", color: TEXT_COLORS.secondary }}>&ldquo;{selectedRequest.details}&rdquo;</div>
                </div>
              )}
            </div>

            {/* Resolution Selector */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: TEXT_COLORS.secondary, marginBottom: "0.4rem" }}>
                Resolution Action
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setActionType("approved")}
                  style={{
                    padding: "0.55rem",
                    borderRadius: "0.5rem",
                    border: actionType === "approved" ? `2px solid ${STATUS_COLORS.success.color}` : `1px solid ${UI_COLORS.border}`,
                    background: actionType === "approved" ? STATUS_COLORS.success.bg : UI_COLORS.surface,
                    color: actionType === "approved" ? STATUS_COLORS.success.color : TEXT_COLORS.muted,
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    cursor: "pointer",
                  }}
                >
                  ✓ Approve
                </button>
                <button
                  type="button"
                  onClick={() => setActionType("rejected")}
                  style={{
                    padding: "0.55rem",
                    borderRadius: "0.5rem",
                    border: actionType === "rejected" ? `2px solid ${UI_COLORS.error}` : `1px solid ${UI_COLORS.border}`,
                    background: actionType === "rejected" ? STATUS_COLORS.danger.bg : UI_COLORS.surface,
                    color: actionType === "rejected" ? STATUS_COLORS.danger.color : TEXT_COLORS.muted,
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    cursor: "pointer",
                  }}
                >
                  ✕ Reject
                </button>
                <button
                  type="button"
                  onClick={() => setActionType("processed")}
                  style={{
                    padding: "0.55rem",
                    borderRadius: "0.5rem",
                    border: actionType === "processed" ? `2px solid ${UI_COLORS.accent}` : `1px solid ${UI_COLORS.border}`,
                    background: actionType === "processed" ? STATUS_COLORS.info.bg : UI_COLORS.surface,
                    color: actionType === "processed" ? STATUS_COLORS.info.color : TEXT_COLORS.muted,
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    cursor: "pointer",
                  }}
                >
                  Processed
                </button>
              </div>
            </div>

            {/* Admin Note Input */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: TEXT_COLORS.secondary, marginBottom: "0.3rem" }}>
                Admin Review Notes / Explanation to Student
              </label>
              <textarea
                rows={3}
                placeholder="Add explanation or transaction reference ID..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.5rem",
                  border: `1px solid ${UI_COLORS.border}`,
                  fontSize: "0.8rem",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                style={{
                  padding: "0.5rem 0.9rem",
                  borderRadius: "0.5rem",
                  border: `1px solid ${UI_COLORS.border}`,
                  background: UI_COLORS.surface,
                  color: TEXT_COLORS.muted,
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={submitting || !actionType}
                style={{
                  padding: "0.5rem 1.1rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  background: actionType === "approved" ? STATUS_COLORS.success.color : actionType === "rejected" ? UI_COLORS.error : UI_COLORS.primary,
                  color: UI_COLORS.surface,
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  cursor: submitting ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                }}
              >
                {submitting ? "Saving..." : "Confirm Decision"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RefundRequestsPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading Refund System...</div>}>
      <RefundRequestsContent />
    </Suspense>
  );
}
