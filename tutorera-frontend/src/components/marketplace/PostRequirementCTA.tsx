import Link from "next/link";

export interface PostRequirementCTAProps {
  variant?: "block" | "card";
}

// The codebase has no single generic CTA component - every "post a
// requirement" prompt is inline-styled per page. This is the one shared
// component for that specific CTA, used by the blog's persistent post-body
// CTA and the sidebar's CTA card, matching the brand gradient/copy already
// used elsewhere (see PaymentTrustSteps.tsx, OfferComparisonDemo.tsx).
export default function PostRequirementCTA({ variant = "block" }: PostRequirementCTAProps) {
  if (variant === "card") {
    return (
      <div style={{ background: "linear-gradient(135deg, #021550 0%, #0329B2 100%)", borderRadius: 14, padding: "22px 20px", color: "white" }}>
        <p style={{ fontSize: 15, fontWeight: 800, margin: "0 0 6px", lineHeight: 1.35 }}>Ready to find your tutor?</p>
        <p style={{ fontSize: "0.8rem", color: "#CBD5E1", margin: "0 0 14px", lineHeight: 1.5 }}>Post your requirement — free, no commitment.</p>
        <Link
          href="/post-tuition-request"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "white", color: "#021550", padding: "10px 16px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 800, textDecoration: "none" }}
        >
          Post a Requirement →
        </Link>
      </div>
    );
  }

  return (
    <div style={{ background: "linear-gradient(135deg, #021550 0%, #0329B2 100%)", borderRadius: 16, padding: "32px 36px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 18 }}>
      <div>
        <p style={{ color: "white", fontSize: 18, fontWeight: 800, margin: "0 0 6px" }}>Ready to find your tutor?</p>
        <p style={{ color: "#CBD5E1", fontSize: "0.85rem", margin: 0 }}>Post your requirement — free, no commitment.</p>
      </div>
      <Link
        href="/post-tuition-request"
        style={{ background: "white", color: "#021550", padding: "13px 24px", borderRadius: 9, fontWeight: 800, fontSize: "0.875rem", flexShrink: 0, textDecoration: "none" }}
      >
        Post Tuition Request →
      </Link>
    </div>
  );
}
