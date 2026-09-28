"use client";

import React from "react";
import Link from "next/link";
import { UI_COLORS, TEXT_COLORS } from "@/lib/brand";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const SIZE_STYLES: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: "0.4rem 0.85rem", fontSize: "0.8rem", borderRadius: "8px", gap: "0.4rem" },
  md: { padding: "0.6rem 1.15rem", fontSize: "0.875rem", borderRadius: "10px", gap: "0.5rem" },
  lg: { padding: "0.85rem 1.6rem", fontSize: "1rem", borderRadius: "12px", gap: "0.6rem" },
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case "secondary":
        return {
          background: UI_COLORS.card,
          color: TEXT_COLORS.primary,
          border: `1px solid ${UI_COLORS.border}`,
        };
      case "danger":
        return {
          background: UI_COLORS.error,
          color: "#ffffff",
          border: "none",
        };
      case "ghost":
        return {
          background: "transparent",
          color: TEXT_COLORS.muted,
          border: "none",
        };
      case "outline":
        return {
          background: "transparent",
          color: UI_COLORS.primary,
          border: `1.5px solid ${UI_COLORS.primary}`,
        };
      case "primary":
      default:
        return {
          background: UI_COLORS.primary,
          color: "#ffffff",
          border: "none",
          boxShadow: "0 2px 8px rgba(3, 41, 178, 0.2)",
        };
    }
  };

  const baseStyle: React.CSSProperties = {
    display: fullWidth ? "flex" : "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    cursor: disabled || isLoading ? "not-allowed" : "pointer",
    opacity: disabled || isLoading ? 0.6 : 1,
    transition: "all 0.15s ease-in-out",
    textDecoration: "none",
    width: fullWidth ? "100%" : "auto",
    ...SIZE_STYLES[size],
    ...getVariantStyles(),
    ...style,
  };

  const content = (
    <>
      {isLoading ? (
        <span
          style={{
            width: "1em",
            height: "1em",
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.6s linear infinite",
            display: "inline-block",
          }}
        />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );

  if (href && !disabled && !isLoading) {
    return (
      <Link href={href} style={baseStyle}>
        {content}
      </Link>
    );
  }

  return (
    <button disabled={disabled || isLoading} style={baseStyle} {...props}>
      {content}
    </button>
  );
}

export default Button;
