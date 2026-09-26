"use client";

import { useState } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { UI_COLORS, STATUS_COLORS, TEXT_COLORS } from "@/lib/brand";
import { DashButton, DashCard } from "./ui";
import axiosInstance from "@/lib/axios";
import { showSuccess, showError } from "@/lib/toast";
import { X, AlertTriangle, ShieldAlert } from "lucide-react";

interface Props {
  bookingId: string;
  bookingTitle?: string;
  userRole?: "student" | "tutor" | "parent";
  isPaid?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STUDENT_REASONS = [
  { value: "scheduling_conflict", label: "Scheduling conflict / Change in availability" },
  { value: "emergency", label: "Personal or family emergency" },
  { value: "found_alternative", label: "Found another study arrangement" },
  { value: "tutor_unresponsive", label: "Tutor is not responding in chat" },
  { value: "booked_by_mistake", label: "Booked by mistake" },
  { value: "other", label: "Other reason" },
];

const TUTOR_REASONS = [
  { value: "scheduling_conflict", label: "Unavoidable scheduling clash" },
  { value: "illness_emergency", label: "Illness or personal emergency" },
  { value: "student_unresponsive", label: "Student is not responding" },
  { value: "subject_mismatch", label: "Curriculum / level mismatch" },
  { value: "other", label: "Other reason" },
];

export default function CancelBookingModal({
  bookingId,
  bookingTitle = "Tutoring Booking",
  userRole = "student",
  isPaid = false,
  onClose,
  onSuccess,
}: Props) {
  const [reasonCategory, setReasonCategory] = useState("");
  const [reasonText, setReasonText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const containerRef = useFocusTrap(true, onClose);
  const reasons = userRole === "tutor" ? TUTOR_REASONS : STUDENT_REASONS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonCategory) {
      setError("Please select a cancellation reason.");
      return;
    }

    const fullReason = reasonText.trim()
      ? `${reasonCategory.replace(/_/g, " ")}: ${reasonText.trim()}`
      : reasonCategory.replace(/_/g, " ");

    setSubmitting(true);
    setError("");

    try {
      const res = await axiosInstance.patch(`/bookings/${bookingId}/status`, {
        status: "cancelled",
        cancelReason: fullReason,
      });

      if (res.data?.success) {
        showSuccess("Booking has been cancelled.");
        onSuccess();
        onClose();
      } else {
        setError(res.data?.message || "Failed to cancel booking.");
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Could not cancel booking. Please try again.");
    } finally {
      setSubmitting(false);
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
        aria-labelledby="cancel-booking-modal-title"
        style={{
          backgroundColor: UI_COLORS.surface,
          borderRadius: "1.25rem",
          padding: "2rem",
          width: "100%",
          maxWidth: "480px",
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
                background: STATUS_COLORS.danger.bg,
                color: STATUS_COLORS.danger.color,
                display: "grid",
                placeItems: "center",
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <div>
              <h2 id="cancel-booking-modal-title" style={{ fontSize: "1.15rem", fontWeight: 800, color: TEXT_COLORS.primary, margin: 0 }}>
                Cancel Booking
              </h2>
              <p style={{ fontSize: "0.8rem", color: TEXT_COLORS.muted, margin: "2px 0 0" }}>
                {bookingTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
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
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Reason Select */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="cancel-reason-category"
              style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: TEXT_COLORS.primary, marginBottom: "0.4rem" }}
            >
              Reason for cancellation <span style={{ color: STATUS_COLORS.danger.color }}>*</span>
            </label>
            <select
              id="cancel-reason-category"
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.7rem",
                borderRadius: "0.5rem",
                border: `1.5px solid ${UI_COLORS.border}`,
                backgroundColor: UI_COLORS.surface,
                fontSize: "0.85rem",
                color: TEXT_COLORS.primary,
                outline: "none",
              }}
            >
              <option value="">Select a reason</option>
              {reasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Optional notes */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              htmlFor="cancel-reason-note"
              style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: TEXT_COLORS.primary, marginBottom: "0.4rem" }}
            >
              Additional note (optional)
            </label>
            <textarea
              id="cancel-reason-note"
              rows={3}
              maxLength={400}
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="Any details you'd like to share..."
              style={{
                width: "100%",
                padding: "0.7rem",
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
          </div>

          {/* Policy advice card */}
          <div
            style={{
              padding: "0.85rem",
              borderRadius: "0.6rem",
              background: userRole === "tutor" ? STATUS_COLORS.warning.bg : STATUS_COLORS.info.bg,
              border: `1px solid ${userRole === "tutor" ? STATUS_COLORS.warning.border : STATUS_COLORS.info.border}`,
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.6rem",
            }}
          >
            <ShieldAlert
              size={18}
              color={userRole === "tutor" ? STATUS_COLORS.warning.color : STATUS_COLORS.info.color}
              style={{ flexShrink: 0, marginTop: 2 }}
            />
            <p style={{ fontSize: "0.74rem", color: TEXT_COLORS.secondary, margin: 0, lineHeight: 1.5 }}>
              {userRole === "tutor"
                ? "Notice: Tutors are expected to provide at least 24 hours notice when cancelling sessions. Frequent cancellations may affect your profile reliability score."
                : isPaid
                ? "Paid Booking Notice: Cancelling this upcoming booking releases the tutor. You can request a refund review under our published Refund Policy."
                : "Cancellation is immediate. Both you and the tutor will receive confirmation notifications."}
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
            <DashButton type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Keep Booking
            </DashButton>
            <DashButton type="submit" variant="danger" disabled={submitting}>
              {submitting ? "Cancelling..." : "Confirm Cancellation"}
            </DashButton>
          </div>
        </form>
      </div>
    </div>
  );
}
