"use client";

import s from "./tracking.module.css";
import { EligibilityInfo } from "@/types/tracking";

export function HomeTuitionStatusCard({ eligibility, required }: { eligibility: EligibilityInfo; required: boolean }) {
  if (!required) {
    return (
      <div className={`${s.eligibilityCard} ${s.pending}`}>
        <div className={s.eligibilityHeader}>
          <p className={s.eligibilityTitle}>HOME / IN-PERSON TUITION</p>
          <span className={s.eligibilityStatus}>Not required</span>
        </div>
        <p className={s.eligibilityMessage}>
          Your teaching mode is online only. Home or in-person tuition is not part of your profile. To enable this feature, update your teaching mode in your tutor profile.
        </p>
      </div>
    );
  }
  const variant = eligibility.eligible ? "eligible" : "blocked";
  const label = eligibility.eligible ? "Eligible" : eligibility.since ? "Paused" : "Not eligible";
  return (
    <div className={`${s.eligibilityCard} ${s[variant]}`}>
      <div className={s.eligibilityHeader}>
        <p className={s.eligibilityTitle}>HOME / IN-PERSON TUITION</p>
        <span className={s.eligibilityStatus}>{label}</span>
      </div>
      <p className={s.eligibilityMessage}>
        {eligibility.eligible
          ? "You are approved to respond to Home and In-Person Tuition opportunities."
          : (eligibility.reasonIfBlocked || "Submit your police verification certificate to unlock Home or In-Person Tuition.")}
      </p>
      {eligibility.since && (
        <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Since {new Date(eligibility.since).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</p>
      )}
    </div>
  );
}
