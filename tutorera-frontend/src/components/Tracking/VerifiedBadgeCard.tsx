"use client";

import s from "./tracking.module.css";

export function VerifiedBadgeCard({ verified }: { verified: boolean }) {
  return (
    <div className={`${s.checklistItem} ${verified ? s.done : s.pending}`}>
      <div className={s.checklistIcon} aria-hidden>{verified ? "✓" : "•"}</div>
      <div style={{ flex: 1 }}>
        <p className={s.checklistLabel}>TUTORERA® Verified Badge</p>
        <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
          {verified
            ? "Active — issued after successful identity verification."
            : "Pending — issued after CNIC verification is approved."}
        </p>
      </div>
    </div>
  );
}
