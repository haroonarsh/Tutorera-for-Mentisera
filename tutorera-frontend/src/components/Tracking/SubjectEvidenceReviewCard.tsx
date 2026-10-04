"use client";
import { useId, useRef, useState } from "react";
import styles from "./qualificationReview.module.css";

export interface ReviewedSubjectEvidence {
  label?: string;
  status?: "pending" | "approved" | "rejected";
  reason?: string;
  reviewedAt?: string;
}

export default function SubjectEvidenceReviewCard({ evidence, index, subject, onReview, onView }: {
  evidence: ReviewedSubjectEvidence; index: number; subject: string;
  onReview?: (index: number, status: "approved" | "rejected", reason: string) => Promise<void>;
  onView?: (index: number) => Promise<void>;
}) {
  const id = useId();
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const status = evidence.status || "pending";
  async function decide(decision: "approved" | "rejected") {
    if (!onReview || busy) return;
    setError(""); setFeedback("");
    if (!reason.trim()) { setError("Provide a document-specific reason for this evidence decision."); reasonRef.current?.focus(); return; }
    setBusy(true);
    try { await onReview(index, decision, reason.trim()); setReason(""); setFeedback(`Evidence ${decision}. Teaching approval is a separate decision.`); }
    catch (failure: unknown) { setError(failure instanceof Error ? failure.message : "Unable to save the evidence decision."); }
    finally { setBusy(false); }
  }
  return <article className={styles.card} aria-labelledby={`${id}-title`} aria-busy={busy}>
    <div className={styles.heading}><h3 id={`${id}-title`}>{subject} evidence {index + 1}: {evidence.label || "Supporting document"}</h3><span className={styles.status} data-status={status}>{status}</span></div>
    {evidence.reviewedAt && <p className={styles.help}>Reviewed {new Date(evidence.reviewedAt).toLocaleString()}</p>}
    {evidence.reason && <p className={styles.reason}><strong>Reviewer feedback:</strong> {evidence.reason}</p>}
    {onView && <button className={styles.view} type="button" onClick={() => void onView(index)}>View evidence {index + 1}</button>}
    {onReview && status === "pending" && <fieldset className={styles.controls} disabled={busy}>
      <legend>Evidence decision</legend>
      <label htmlFor={`${id}-reason`}>Review reason — required for approval or rejection</label>
      <textarea ref={reasonRef} id={`${id}-reason`} rows={3} value={reason} onChange={(event) => setReason(event.target.value)} aria-describedby={error ? `${id}-error` : undefined} />
      <div className={styles.actions}><button type="button" onClick={() => void decide("approved")}>Approve evidence</button><button type="button" className={styles.reject} onClick={() => void decide("rejected")}>Reject evidence</button></div>
    </fieldset>}
    {error && <p id={`${id}-error`} className={styles.error} role="alert">{error}</p>}
    <p className={styles.help} role="status">{busy ? "Saving evidence review…" : feedback}</p>
  </article>;
}
