"use client";

import { useState } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { UI_COLORS, STATUS_COLORS, TEXT_COLORS } from "@/lib/brand";
import { DashButton, DashCard } from "./ui";
import { formatMoney } from "@/lib/site";
import axiosInstance from "@/lib/axios";
import { showSuccess, showError } from "@/lib/toast";
import { DashBooking } from "@/types/dashboard";
import { RotateCcw, X, AlertCircle, ShieldAlert } from "lucide-react";

interface Props {
  booking: DashBooking;
  onClose: () => void;
  onSuccess: () => void;
}

const REFUND_REASONS = [
  { value: "tutor_cancelled", label: "Tutor cancelled or requested cancellation" },
  { value: "session_not_delivered", label: "Session not delivered / Tutor did not show up" },
  { value: "quality_issue", label: "Unsatisfactory quality / Tutoring standard issue" },
  { value: "scheduling_conflict", label: "Scheduling conflict / Unable to agree on times" },
  { value: "duplicate_charge", label: "Duplicate or erroneous payment" },
  { value: "other", label: "Other reason" },
];

export default function RefundRequestModal({ booking, onClose, onSuccess }: Props) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const containerRef = useFocusTrap(true, onClose);

  const refundAmount = booking.studentTotal || booking.amount || booking.totalAmount || 0;
  const currency = booking.currency || booking.request?.currency || "PKR";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError("Please select a reason for the refund request.");
      return;
    }
    if (details.trim().length < 15) {
      setError("Please provide at least 15 characters explaining your request.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axiosInstance.post(`/bookings/${booking._id}/refund-request`, {
        reason,
        details: details.trim(),
      });

      if (res.data?.success) {
        showSuccess("Refund request submitted successfully. Our team will review it within 24–48 hours.");
        onSuccess();
        onClose();
      } else {
        setError(res.data?.message || "Failed to submit refund request.");
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Failed to submit refund request. Please try again or contact support.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(2, 21, 80, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
      role="presentation"
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="refund-modal-title"
        style={{
          backgroundColor: UI_COLORS.surface,
          borderRadius: "1.25rem",
          padding: "2rem",
          width: "100%",
          maxWidth: "520px",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.2)",
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: STATUS_COLORS.warning.bg,
                color: STATUS_COLORS.warning.color,
                display: "grid",
                placeItems: "center",
              }}
            >
              <RotateCcw size={22} />
            </div>
            <div>
              <h2 id="refund-modal-title" style={{ fontSize: "1.2rem", fontWeight: 800, color: TEXT_COLORS.primary, margin: 0 }}>
                Request a Refund
              </h2>
              <p style={{ fontSize: "0.8rem", color: TEXT_COLORS.muted, margin: "2px 0 0" }}>
                Booking ID: {booking._id} · Tutor: {booking.tutor.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: TEXT_COLORS.muted,
              padding: "0.25rem",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Refund Overview Banner */}
        <DashCard padding="sm" style={{ background: UI_COLORS.gray50, marginBottom: "1.25rem", borderColor: UI_COLORS.border }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
            <span style={{ color: TEXT_COLORS.secondary, fontWeight: 600 }}>Refundable Amount:</span>
            <span style={{ fontWeight: 800, color: TEXT_COLORS.primary, fontSize: "1.05rem" }}>
              {formatMoney(refundAmount, currency)}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: TEXT_COLORS.muted, marginTop: "0.35rem" }}>
            <span>Subject: {typeof booking.request === "object" ? booking.request.subject : "Tutoring"}</span>
            <span>Mode: {booking.teachingMode || "online"}</span>
          </div>
        </DashCard>

        {error && (
          <div
            style={{
              background: STATUS_COLORS.danger.bg,
              border: `1px solid ${STATUS_COLORS.danger.border}`,
              color: STATUS_COLORS.danger.color,
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              fontSize: "0.82rem",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Reason selection */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              htmlFor="refund-reason"
              style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: TEXT_COLORS.primary, marginBottom: "0.4rem" }}
            >
              Why are you requesting a refund? <span style={{ color: STATUS_COLORS.danger.color }}>*</span>
            </label>
            <select
              id="refund-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: `1.5px solid ${UI_COLORS.border}`,
                backgroundColor: UI_COLORS.surface,
                fontSize: "0.85rem",
                color: TEXT_COLORS.primary,
                outline: "none",
              }}
            >
              <option value="">Select a reason</option>
              {REFUND_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Detailed explanation */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              htmlFor="refund-details"
              style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: TEXT_COLORS.primary, marginBottom: "0.4rem" }}
            >
              Detailed Explanation <span style={{ color: STATUS_COLORS.danger.color }}>*</span>
            </label>
            <textarea
              id="refund-details"
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe what occurred, dates, and any relevant communication with the tutor..."
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: `1.5px solid ${UI_COLORS.border}`,
                backgroundColor: UI_COLORS.surface,
                fontSize: "0.85rem",
                color: TEXT_COLORS.primary,
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
            <p style={{ margin: "0.35rem 0 0", fontSize: "0.72rem", color: TEXT_COLORS.muted }}>
              Minimum 15 characters. Please include specific details to expedite administrative review.
            </p>
          </div>

          {/* Refund policy note */}
          <div
            style={{
              padding: "0.85rem",
              borderRadius: "0.6rem",
              background: STATUS_COLORS.info.bg,
              border: `1px solid ${STATUS_COLORS.info.border}`,
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.6rem",
            }}
          >
            <ShieldAlert size={18} color={STATUS_COLORS.info.color} style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: "0.74rem", color: TEXT_COLORS.secondary, margin: 0, lineHeight: 1.5 }}>
              Refund requests are investigated by TUTORERA Support under our published{" "}
              <strong>Refund & Cancellation Policy</strong>. If approved, the funds will be credited to your original payment method in 5–7 business days.
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
            <DashButton type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </DashButton>
            <DashButton type="submit" variant="danger" disabled={loading} style={{ minWidth: "120px" }}>
              {loading ? "Submitting..." : "Submit Request"}
            </DashButton>
          </div>
        </form>
      </div>
    </div>
  );
}
