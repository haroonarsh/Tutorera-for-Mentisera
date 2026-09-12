"use client";
// components/dashboard/RatingModal.tsx
import { useState } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { UI_COLORS, STATUS_COLORS, TEXT_COLORS } from "@/lib/brand";
import { DashCard, DashButton } from "./ui";

interface Props {
  title: string;
  subtitle: string;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  onClose: () => void;
}

const REASONS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

export default function RatingModal({ title, subtitle, onSubmit, onClose }: Props) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const containerRef = useFocusTrap(true, onClose);

  const handleSubmit = async () => {
    if (rating === 0) { setError("Please select a star rating."); return; }
    if (comment.trim().length < 10) { setError("Please write at least 10 characters."); return; }
    setLoading(true); setError("");
    try {
      await onSubmit(rating, comment);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Failed to submit. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rating-modal-title"
        style={{ backgroundColor: UI_COLORS.surface, borderRadius: '1rem', padding: '2rem', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <h2 id="rating-modal-title" style={{ fontSize: '1.1rem', fontWeight: 800, color: TEXT_COLORS.primary, margin: '0 0 4px' }}>{title}</h2>
            <p style={{ fontSize: '0.8rem', color: TEXT_COLORS.muted, margin: 0 }}>{subtitle}</p>
          </div>
          <button onClick={onClose} aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_COLORS.muted, fontSize: '1.25rem', lineHeight: 1, padding: '0 0 0 1rem' }}>
            ×
          </button>
        </div>

        {error && (
          <DashCard padding="sm" style={{ background: STATUS_COLORS.danger.bg, borderColor: STATUS_COLORS.danger.border, boxShadow: 'none', padding: '0.6rem 0.875rem', marginBottom: '1rem', color: TEXT_COLORS.danger, fontSize: '0.8rem' }}>
            {error}
          </DashCard>
        )}

        {/* Stars */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                aria-label={`${star} star${star > 1 ? "s" : ""} - ${REASONS[star]}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', fontSize: '2rem', lineHeight: 1, transition: 'transform 0.1s', transform: hovered >= star || rating >= star ? 'scale(1.15)' : 'scale(1)' }}>
                <span style={{ color: (hovered || rating) >= star ? UI_COLORS.gold : UI_COLORS.border }}>★</span>
              </button>
            ))}
          </div>
          {(hovered || rating) > 0 && (
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: UI_COLORS.gold, margin: 0 }}>
              {REASONS[hovered || rating]}
            </p>
          )}
        </div>

        {/* Comment */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: TEXT_COLORS.primary, marginBottom: '0.4rem' }}>
            Your comment *
          </label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={4}
            placeholder="Share your experience in detail (min. 10 characters)..."
            style={{ width: '100%', padding: '0.75rem', border: `1.5px solid ${UI_COLORS.border}`, borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', color: TEXT_COLORS.primary, boxSizing: 'border-box' }}
            onFocus={e => (e.currentTarget.style.borderColor = UI_COLORS.accent)}
            onBlur={e => (e.currentTarget.style.borderColor = UI_COLORS.border)} />
          <p style={{ fontSize: '0.7rem', color: comment.length < 10 ? TEXT_COLORS.muted : TEXT_COLORS.success, margin: '4px 0 0', textAlign: 'right' }}>
            {comment.length} characters {comment.length < 10 ? `(${10 - comment.length} more needed)` : "✓"}
          </p>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <DashButton variant="secondary" size="md" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </DashButton>
          <DashButton variant="primary" size="md" onClick={handleSubmit} disabled={loading} style={{ flex: 1 }}>
            {loading ? "Submitting..." : "Submit Rating"}
          </DashButton>
        </div>
      </div>
    </div>
  );
}