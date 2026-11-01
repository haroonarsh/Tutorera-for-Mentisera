"use client";

import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { showError, showSuccess } from "@/lib/toast";
import { useCallback, useEffect, useState } from "react";

type RefundState = "pending" | "approved" | "rejected" | "processed";
type RefundCase = {
  _id: string;
  amount: number;
  reason: string;
  details: string;
  status: RefundState;
  adminNote?: string;
  createdAt: string;
  student?: { name: string; email: string };
  tutor?: { name: string; email: string };
  booking?: { _id: string; studentTotal: number; currency?: string };
  settlementReference?: string;
  settlementMethod?: string;
  settlementEvidenceReference?: string;
  settlementInitiatedBy?: string;
  settlementVerifiedBy?: string;
  processedAt?: string;
};
const filters: Array<"all" | RefundState> = ["all", "pending", "approved", "processed", "rejected"];

function getMessage(error: unknown): string {
  const e = error as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || "Unable to update this refund. No transfer has been initiated by TUTORERA.";
}

export default function RefundReviewPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | RefundState>("pending");
  const [items, setItems] = useState<RefundCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const adminRole = user?.adminRole || "";
  const grants = user?.adminPermissions || [];
  const canApprove = adminRole === "super_admin" || adminRole === "trust_and_safety" || grants.includes("claims.manage") || grants.includes("*");
  const canSettle = adminRole === "super_admin" || adminRole === "finance" || grants.includes("payment.refund") || grants.includes("*");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/refund-requests", { params: filter === "all" ? {} : { status: filter } });
      setItems(res.data.refundRequests || []);
    } catch (err) {
      showError(getMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { void load(); }, [load]);

  const review = async (item: RefundCase, status: "approved" | "rejected") => {
    const note = window.prompt(status === "approved" ? "Explain the approved refund decision:" : "Reason for rejection:");
    if (!note || note.trim().length < 8) return;
    setBusy(item._id);
    try {
      await api.patch(`/admin/refund-requests/${item._id}`, { status, adminNote: note.trim() });
      showSuccess(status === "approved" ? "Approved for external settlement; no refund has yet been paid." : "Refund rejected.");
      await load();
    } catch (err) { showError(getMessage(err)); } finally { setBusy(null); }
  };

  const recordExternalTransfer = async (item: RefundCase) => {
    if (!window.confirm("Have the funds actually been transferred outside TUTORERA, with independent documentary evidence? This action only records external transfer details.")) return;
    const settlementMethod = window.prompt("External transfer method (bank, wallet, original payment provider):");
    if (!settlementMethod) return;
    const settlementReference = window.prompt("Unique external refund transaction reference (at least 8 characters):");
    if (!settlementReference) return;
    const evidenceReference = window.prompt("Bank/provider receipt or statement reference (at least 8 characters):");
    if (!evidenceReference) return;
    setBusy(item._id);
    try {
      await api.post(`/admin/refund-requests/${item._id}/external-transfer`, {
        settlementMethod, settlementReference, evidenceReference,
      });
      showSuccess("External refund evidence recorded. A different finance officer must verify settlement.");
      await load();
    } catch (err) { showError(getMessage(err)); } finally { setBusy(null); }
  };

  const verifyExternalTransfer = async (item: RefundCase) => {
    if (!window.confirm("Confirm that you independently checked the bank/provider statement, not just the recorded receipt?")) return;
    const settlementReference = window.prompt("Re-enter the original external refund transaction reference:");
    if (!settlementReference) return;
    const verificationEvidence = window.prompt("Independent statement reference (at least 8 characters):");
    if (!verificationEvidence) return;
    const note = window.prompt("Explain how you verified the settlement (at least 12 characters):");
    if (!note) return;
    setBusy(item._id);
    try {
      await api.post(`/admin/refund-requests/${item._id}/external-verify`, {
        settlementReference, verificationEvidence, note,
      });
      showSuccess("Externally executed refund independently reconciled.");
      await load();
    } catch (err) { showError(getMessage(err)); } finally { setBusy(null); }
  };

  return (
    <main style={{ padding: "1.5rem", maxWidth: 1280, margin: "0 auto" }}>
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontWeight: 850, color: "#0a1128", fontSize: "1.5rem" }}>Refund review and external settlement</h1>
        <p style={{ color: "#64748b", maxWidth: 850 }}>
          Trust & Safety reviews eligibility; Finance records an externally executed transfer and a different reviewer confirms its settlement. TUTORERA does not automatically send refunds through Rapid Gateway.
        </p>
      </header>

      <nav aria-label="Refund status" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.2rem" }}>
        {filters.map(status => (
          <button key={status} type="button" onClick={() => setFilter(status)}
            aria-pressed={filter === status}
            style={{ padding: "0.5rem 0.85rem", borderRadius: "0.4rem",
              border: "1px solid #cbd5e1", cursor: "pointer", fontWeight: 700,
              color: filter === status ? "#fff" : "#0a1128",
              background: filter === status ? "#0329b2" : "#fff", textTransform: "capitalize" }}>
            {status}
          </button>
        ))}
        <button type="button" onClick={() => void load()} disabled={loading} style={{ padding: "0.5rem", border: "1px solid #cbd5e1", borderRadius: "0.4rem" }}>Refresh</button>
      </nav>

      {loading ? <p role="status">Loading refund requests…</p> : items.length === 0 ? <p>No refund requests match this filter.</p> : (
        <div style={{ display: "grid", gap: "0.85rem" }}>
          {items.map(item => (
            <section key={item._id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "0.8rem", padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", alignItems: "flex-start", gap: "0.65rem" }}>
                <div>
                  <div style={{ color: "#0329b2", fontWeight: 850 }}>{item.student?.name || "Student"} — {item.reason.replaceAll("_", " ")}</div>
                  <div style={{ color: "#64748b", fontSize: "0.8rem", overflowWrap: "anywhere" }}>REF-{item._id} · Booking {item.booking?._id || "not found"}</div>
                  <div style={{ color: "#475569", fontSize: "0.85rem" }}>Tutor: {item.tutor?.name || "—"} · {new Date(item.createdAt).toLocaleDateString("en-PK")}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong style={{ display: "block", color: "#0a1128" }}>{item.booking?.currency || "PKR"} {item.amount.toLocaleString()}</strong>
                  <span style={{ fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", color: item.status === "processed" ? "#166534" : "#92400e" }}>{item.status === "approved" ? "Approved — not settled" : item.status}</span>
                </div>
              </div>
              {item.details && <p style={{ fontSize: "0.83rem", color: "#475569" }}>{item.details}</p>}
              {item.adminNote && <p style={{ fontSize: "0.82rem", color: "#475569" }}><strong>Decision:</strong> {item.adminNote}</p>}
              {item.settlementReference && <p style={{ fontSize: "0.82rem", color: "#475569", overflowWrap: "anywhere" }}><strong>External reference:</strong> {item.settlementReference} · {item.settlementMethod || "—"}</p>}
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                {item.status === "pending" && canApprove && (
                  <>
                    <button disabled={busy === item._id} onClick={() => void review(item, "approved")} style={{ padding: "0.5rem 0.9rem", background: "#065f46", color: "white", border: 0, borderRadius: "0.45rem", cursor: "pointer" }}>Approve</button>
                    <button disabled={busy === item._id} onClick={() => void review(item, "rejected")} style={{ padding: "0.5rem 0.9rem", background: "#991b1b", color: "white", border: 0, borderRadius: "0.45rem", cursor: "pointer" }}>Reject</button>
                  </>
                )}
                {item.status === "approved" && canSettle && !item.settlementReference && (
                  <button disabled={busy === item._id} onClick={() => void recordExternalTransfer(item)}
                    style={{ padding: "0.5rem 0.9rem", background: "#0329b2", color: "#fff", border: 0, borderRadius: "0.45rem", cursor: "pointer" }}>Record external transfer</button>
                )}
                {item.status === "approved" && canSettle && item.settlementReference && (
                  <button disabled={busy === item._id} onClick={() => void verifyExternalTransfer(item)}
                    style={{ padding: "0.5rem 0.9rem", background: "#065f46", color: "#fff", border: 0, borderRadius: "0.45rem", cursor: "pointer" }}>Independently verify settlement</button>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
