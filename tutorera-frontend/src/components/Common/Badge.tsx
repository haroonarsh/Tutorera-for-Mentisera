"use client";

import React from "react";
import { STATUS_COLORS, TEXT_COLORS } from "@/lib/brand";

export type BadgeTone = "success" | "warning" | "danger" | "info" | "neutral";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: BadgeSize;
  dot?: boolean;
}

export function Badge({
  children,
  tone = "neutral",
  size = "md",
  dot = false,
  style,
  ...props
}: BadgeProps) {
  const getToneStyle = () => {
    switch (tone) {
      case "success":
        return {
          background: STATUS_COLORS.success.bg,
          color: STATUS_COLORS.success.color,
          border: `1px solid ${STATUS_COLORS.success.border}`,
        };
      case "warning":
        return {
          background: STATUS_COLORS.warning.bg,
          color: STATUS_COLORS.warning.color,
          border: `1px solid ${STATUS_COLORS.warning.border}`,
        };
      case "danger":
        return {
          background: STATUS_COLORS.danger.bg,
          color: STATUS_COLORS.danger.color,
          border: `1px solid ${STATUS_COLORS.danger.border}`,
        };
      case "info":
        return {
          background: STATUS_COLORS.info.bg,
          color: STATUS_COLORS.info.color,
          border: `1px solid ${STATUS_COLORS.info.border}`,
        };
      case "neutral":
      default:
        return {
          background: "#f1f5f9",
          color: TEXT_COLORS.muted,
          border: "1px solid #e2e8f0",
        };
    }
  };

  const isSmall = size === "sm";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: isSmall ? "0.15rem 0.45rem" : "0.25rem 0.65rem",
        fontSize: isSmall ? "0.72rem" : "0.78rem",
        fontWeight: 600,
        borderRadius: "9999px",
        lineHeight: 1.2,
        ...getToneStyle(),
        ...style,
      }}
      {...props}
    >
      {dot && (
        <span
          style={{
            width: "0.45rem",
            height: "0.45rem",
            borderRadius: "50%",
            backgroundColor: "currentColor",
          }}
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
