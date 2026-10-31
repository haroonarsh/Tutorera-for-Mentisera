"use client";
import Link from "next/link";
import { Gift, ArrowRight, X } from "lucide-react";
import { useState } from "react";

interface Props {
  /** "inline" = card inside a page section; "toast" = dismissible strip at top of dashboard */
  variant?: "inline" | "strip";
  currency?: string;
  referrerReward?: number;
  referredDiscount?: number;
}

export default function ReferEarnBanner({
  variant = "inline",
  currency = "PKR",
  referrerReward = 200,
  referredDiscount = 200,
}: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  if (variant === "strip") {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        padding: "0.75rem 1.25rem",
        background: "linear-gradient(90deg, #021550 0%, #0329b2 60%, #016ef8 100%)",
        borderRadius: "0.875rem",
        marginBottom: "1.25rem",
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.3rem" }}>🎁</span>
          <span style={{ color: "white", fontSize: "0.88rem", fontWeight: 700 }}>
            Refer a friend — they get <strong style={{ color: "#08bffc" }}>{currency} {referredDiscount} off</strong> their first booking, you earn <strong style={{ color: "#08bffc" }}>{currency} {referrerReward}+</strong> credit.
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Link href="/referral" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.45rem 1rem", backgroundColor: "#08bffc", color: "#021550", borderRadius: "0.5rem", fontWeight: 800, fontSize: "0.82rem", textDecoration: "none", whiteSpace: "nowrap" }}>
            Get your link <ArrowRight size={13} />
          </Link>
          <button onClick={() => setDismissed(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", padding: "0.25rem" }}>
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "linear-gradient(135deg, #021550 0%, #0329b2 55%, #016ef8 100%)",
      borderRadius: "1rem",
      padding: "1.5rem 1.75rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "1.5rem",
      flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "rgba(8,191,252,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Gift size={24} color="#08bffc" />
        </div>
        <div>
          <p style={{ color: "#08bffc", fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 0.2rem" }}>Refer &amp; Earn</p>
          <p style={{ color: "white", fontWeight: 800, fontSize: "1rem", margin: "0 0 0.2rem", lineHeight: 1.2 }}>
            Share TUTORERA®, earn {currency} {referrerReward}+ credit
          </p>
          <p style={{ color: "#94a3b8", fontSize: "0.8rem", margin: 0 }}>
            Your friend gets {currency} {referredDiscount} off their first booking. Rewards grow as you refer more.
          </p>
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <Link href="/refer-and-earn" style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
          Learn more
        </Link>
        <Link href="/referral" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.6rem 1.25rem", backgroundColor: "#08bffc", color: "#021550", borderRadius: "0.625rem", fontWeight: 800, fontSize: "0.85rem", textDecoration: "none", whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(8,191,252,0.35)" }}>
          Get your link <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
