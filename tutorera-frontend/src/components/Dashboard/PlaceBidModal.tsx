// components/dashboard/PlaceBidModal.tsx
"use client";

import { useState } from "react";
import axiosInstance from "@/lib/axios";
import { DashRequest } from "@/types/dashboard";
import styles from "./PostRequestModal.module.css"; // reuse same modal styles
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface Props {
  request: DashRequest;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PlaceBidModal({ request, onClose, onSuccess }: Props) {
  const [amount, setAmount]   = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const modalRef = useFocusTrap(true, onClose);

  async function handleSubmit() {
    if (!amount || !message.trim()) {
      setError("Please enter your bid amount and a message.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await axiosInstance.post(`/requests/${request._id}/bids`, {
        amount: Number(amount),
        message: message.trim(),
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(msg || "Failed to place bid. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Place a bid">
      <div ref={modalRef} className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Place a Bid</h2>
          <button onClick={onClose} className={styles.closeBtn} aria-label="Close">×</button>
        </div>

        <div className={styles.modalBody}>
          {/* Request summary */}
          <div style={{
            background: "#f9fafb", borderRadius: 10, padding: "12px 14px",
            border: "1px solid #e5e7eb", fontSize: 13,
          }}>
            <p style={{ margin: "0 0 4px 0", fontWeight: 700, color: "#1a1a2e" }}>
              {request.subject} — {request.level}
            </p>
            <p style={{ margin: 0, color: "#6b7280", lineHeight: 1.5 }}>
              {request.description}
            </p>
            <p style={{ margin: "8px 0 0 0", fontWeight: 600, color: "#2563eb" }}>
              Student budget: PKR {request.budget.toLocaleString()}/hr
            </p>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="bid-amount">
              Your Rate (PKR/hr) *
            </label>
            <input
              id="bid-amount"
              type="number"
              className={styles.input}
              placeholder={`e.g. ${request.budget}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={0}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="bid-message">
              Message to Student *
            </label>
            <textarea
              id="bid-message"
              className={styles.textarea}
              placeholder="Introduce yourself, describe your experience, and explain why you're a great fit for this student..."
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.cancelBtn}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className={styles.submitBtn}>
            {loading ? "Placing bid…" : "Place Bid"}
          </button>
        </div>
      </div>
    </div>
  );
}