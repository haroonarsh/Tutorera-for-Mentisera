"use client";

import { CanonicalStatus } from "@/types/tracking";
import {
  TUTOR_ACTION_STATUSES,
  TERMINAL_STATUSES,
  MARKETPLACE_ACTIVE_STATUSES,
  HOME_TUITION_PENDING_STATUSES,
} from "@/contracts/tracking.contract";
import s from "./tracking.module.css";

export function StatusHero({
  applicationId,
  tutorName,
  canonicalStatus,
  canonicalStatusLabel,
  lastUpdatedAt,
  submittedAt,
}: {
  applicationId: string;
  tutorName: string;
  canonicalStatus: CanonicalStatus;
  canonicalStatusLabel: string;
  lastUpdatedAt: string;
  submittedAt: string | null;
}) {
const variant =
    (TERMINAL_STATUSES as readonly string[]).includes(canonicalStatus)
      ? "danger"
      : (TUTOR_ACTION_STATUSES as readonly string[]).includes(canonicalStatus)
        ? "warn"
        : (MARKETPLACE_ACTIVE_STATUSES as readonly string[]).includes(canonicalStatus)
          ? "success"
          : (HOME_TUITION_PENDING_STATUSES as readonly string[]).includes(canonicalStatus)
            ? "muted"
            : "";
  return (
    <div className={s.heroCard}>
      <div className={s.heroRow}>
        <div>
          <p className={s.trackingEyebrow} style={{ color: "rgba(255,255,255,0.78)" }}>Track your application</p>
          <h1 className={s.heroTitle}>{tutorName}</h1>
          <p className={s.heroSubtitle}>
            {submittedAt ? `Submitted on ${new Date(submittedAt).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}` : "Awaiting submission"}
            {lastUpdatedAt ? ` · Last updated ${new Date(lastUpdatedAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}` : ""}
          </p>
          <span className={s.appIdPill} style={{ background: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.28)", color: "#fff" }}>{applicationId}</span>
        </div>
        <span className={`${s.statusPill} ${variant ? s[variant] : ""}`}>{canonicalStatusLabel}</span>
      </div>
    </div>
  );
}
