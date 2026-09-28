"use client";

import Link from "next/link";
import { useEffect } from "react";

// Route-level error boundary. Catches runtime throws inside any route
// segment below the root layout and renders a real page instead of the
// bare "Internal Server Error" body the platform returns by default.
// Next.js re-uses the root layout, so the header/footer stay visible.
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Sent to whatever logging the app already wires up (Sentry / console).
    // eslint-disable-next-line no-console
    console.error("Route error boundary caught:", error);
  }, [error]);

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "4rem 1.5rem", color: "#0f172a", textAlign: "center" }}>
      <p style={{ color: "#016EF8", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", fontSize: "0.8rem", margin: 0 }}>Something went wrong</p>
      <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", color: "#021550", margin: "0.5rem 0 1rem" }}>
        We hit an unexpected error loading this page.
      </h1>
      <p style={{ color: "#475569", lineHeight: 1.6, marginBottom: "1.5rem" }}>
        Your request didn&apos;t complete. You can try again or head back to a known-good page. Nothing about your account or requirement has been changed by this error.
      </p>
      {error.digest && (
        <p style={{ color: "#94a3b8", fontSize: "0.85rem", fontFamily: "monospace", marginBottom: "1.5rem" }}>
          Reference: {error.digest}
        </p>
      )}
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
        <button type="button" onClick={reset} style={btnPrimary}>Try again</button>
        <Link href="/" style={btnSecondary}>Return home</Link>
        <Link href="/support" style={btnSecondary}>Contact support</Link>
      </div>
    </main>
  );
}

const btnPrimary: React.CSSProperties = { background: "#0329b2", color: "white", border: "none", padding: "0.75rem 1.25rem", borderRadius: "0.5rem", fontWeight: 700, cursor: "pointer", fontSize: "0.95rem" };
const btnSecondary: React.CSSProperties = { background: "white", color: "#021550", border: "1.5px solid #cbd5e1", padding: "0.75rem 1.25rem", borderRadius: "0.5rem", fontWeight: 700, textDecoration: "none", fontSize: "0.95rem" };
