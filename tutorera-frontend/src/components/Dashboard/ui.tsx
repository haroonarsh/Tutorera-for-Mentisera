"use client";
// components/Dashboard/ui.tsx
//
// Shared presentational primitives for the Student / Tutor / Parent
// dashboards. These exist because the three dashboard files each grew their
// own one-off inline styles for the same handful of UI patterns (cards,
// buttons, status pills, section headings, empty states), which drifted
// into inconsistent colors, radii and spacing over time. Everything here
// reads its values from lib/brand.ts so there is exactly one source of
// truth for dashboard visuals.

import Link from "next/link";
import { UI_COLORS, STATUS_COLORS, TEXT_COLORS, SPACING } from "@/lib/brand";
import type { CSSProperties, ReactNode } from "react";

const C = UI_COLORS;

// ─── Card ───────────────────────────────────────────────────────────────────
// The single card container used for every list item, summary block and
// panel across all three dashboards.

type CardPadding = "none" | "sm" | "md" | "lg";
const CARD_PADDING: Record<CardPadding, string> = {
  none: "0",
  sm: SPACING.space4,
  md: SPACING.space5,
  lg: SPACING.space6,
};

export function DashCard({
  children,
  padding = "md",
  interactive = false,
  accent,
  style,
  ...rest
}: {
  children: ReactNode;
  padding?: CardPadding;
  /** Adds a subtle hover lift - use for clickable/actionable cards only. */
  interactive?: boolean;
  /** Optional left accent bar color, e.g. UI_COLORS.accent or a STATUS_COLORS.xxx.color */
  accent?: string;
  style?: CSSProperties;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderLeft: accent ? `3px solid ${accent}` : `1px solid ${C.border}`,
        borderRadius: "14px",
        padding: CARD_PADDING[padding],
        boxShadow: C.shadowCard,
        transition: interactive ? "box-shadow 160ms ease, transform 160ms ease" : undefined,
        cursor: interactive ? "pointer" : undefined,
        ...style,
      }}
      onMouseEnter={interactive ? (e) => { e.currentTarget.style.boxShadow = C.shadowCardHover; e.currentTarget.style.transform = "translateY(-1px)"; } : rest.onMouseEnter}
      onMouseLeave={interactive ? (e) => { e.currentTarget.style.boxShadow = C.shadowCard; e.currentTarget.style.transform = "translateY(0)"; } : rest.onMouseLeave}
    >
      {children}
    </div>
  );
}

// ─── Button ─────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md";

const BUTTON_SIZE: Record<ButtonSize, CSSProperties> = {
  sm: { padding: "0.45rem 0.85rem", fontSize: "0.78rem" },
  md: { padding: "0.65rem 1.1rem", fontSize: "0.85rem" },
};

function buttonVariantStyle(variant: ButtonVariant): CSSProperties {
  switch (variant) {
    case "primary":
      return { background: C.accentGradient, color: "#fff", border: "1px solid transparent" };
    case "danger":
      return { background: STATUS_COLORS.danger.bg, color: STATUS_COLORS.danger.color, border: `1px solid ${STATUS_COLORS.danger.border}` };
    case "success":
      return { background: STATUS_COLORS.success.bg, color: STATUS_COLORS.success.color, border: `1px solid ${STATUS_COLORS.success.border}` };
    case "ghost":
      return { background: "transparent", color: C.accent, border: "1px solid transparent" };
    case "secondary":
    default:
      return { background: C.surface, color: C.accent, border: `1.5px solid ${C.accent}` };
  }
}

export function DashButton({
  children,
  variant = "secondary",
  size = "md",
  icon,
  fullWidth = false,
  disabled = false,
  href,
  style,
  ...rest
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  href?: string;
  style?: CSSProperties;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "style">) {
  const sharedStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.4rem",
    borderRadius: "10px",
    fontWeight: 700,
    textDecoration: "none",
    width: fullWidth ? "100%" : undefined,
    opacity: disabled ? 0.55 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "opacity 140ms ease, transform 140ms ease",
    ...BUTTON_SIZE[size],
    ...buttonVariantStyle(variant),
    ...style,
  };

  if (href && !disabled && !rest.onClick) {
    return (
      <Link href={href} style={sharedStyle}>
        {icon}
        {children}
      </Link>
    );
  }

  return (
    <button {...rest} disabled={disabled} style={sharedStyle}>
      {icon}
      {children}
    </button>
  );
}

// ─── Status badge ───────────────────────────────────────────────────────────

type StatusTone = keyof typeof STATUS_COLORS;

export function StatusBadge({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  const s = STATUS_COLORS[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        borderRadius: "999px",
        padding: "0.25rem 0.7rem",
        fontSize: "0.72rem",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

// ─── Section heading ────────────────────────────────────────────────────────

export function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", marginBottom: SPACING.space4, flexWrap: "wrap" }}>
      <div>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: TEXT_COLORS.primary, margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: "0.82rem", color: TEXT_COLORS.muted, margin: "0.25rem 0 0" }}>{subtitle}</p>}
      </div>
      {action && (
        action.href ? (
          <Link href={action.href} style={{ fontSize: "0.82rem", fontWeight: 700, color: C.accent, textDecoration: "none" }}>{action.label} →</Link>
        ) : (
          <button onClick={action.onClick} style={{ background: "none", border: "none", fontSize: "0.82rem", fontWeight: 700, color: C.accent, cursor: "pointer", padding: 0 }}>{action.label} →</button>
        )
      )}
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void; icon?: ReactNode };
}) {
  return (
    <DashCard padding="lg" style={{ textAlign: "center", padding: `${SPACING.space10} ${SPACING.space5}`, color: TEXT_COLORS.muted }}>
      {icon && <div style={{ fontSize: "2.25rem", marginBottom: SPACING.space3 }}>{icon}</div>}
      <p style={{ fontWeight: 700, color: TEXT_COLORS.secondary, margin: "0 0 0.35rem", fontSize: "1.05rem" }}>{title}</p>
      {description && <p style={{ fontSize: "0.85rem", margin: "0 0 1.25rem", maxWidth: 360, marginInline: "auto" }}>{description}</p>}
      {action && (
        <DashButton variant="primary" size="md" href={action.href} onClick={action.onClick} icon={action.icon}>
          {action.label}
        </DashButton>
      )}
    </DashCard>
  );
}

// ─── Stat tile ──────────────────────────────────────────────────────────────
// Matches the visual language of dashboard.module.css's .statCard so it can
// be reused outside that CSS module's scope (e.g. inside tab content).

export function StatTile({
  icon,
  value,
  label,
  tone = "info",
}: {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  tone?: StatusTone;
}) {
  const s = STATUS_COLORS[tone];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "14px", padding: SPACING.space4, minWidth: 0 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: s.bg, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: "1.35rem", fontWeight: 800, color: TEXT_COLORS.primary, margin: 0, lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: "0.72rem", color: TEXT_COLORS.muted, margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</p>
      </div>
    </div>
  );
}

// ─── Canonical status → badge tone mapping ────────────────────────────────
// A single mapping so "approved" is always green, "pending" always amber,
// "rejected" always red, everywhere across all three dashboards.

export function statusTone(status: string): StatusTone {
  const s = status.toLowerCase();
  if (["approved", "accepted", "completed", "confirmed", "active", "paid", "verified", "eligible"].some(k => s.includes(k))) return "success";
  if (["pending", "under_review", "in_progress", "awaiting", "review"].some(k => s.includes(k))) return "warning";
  if (["rejected", "cancelled", "canceled", "failed", "suspended", "expired", "declined", "withdrawn"].some(k => s.includes(k))) return "danger";
  if (["draft", "open", "not_submitted", "not_required"].some(k => s.includes(k))) return "neutral";
  return "info";
}
