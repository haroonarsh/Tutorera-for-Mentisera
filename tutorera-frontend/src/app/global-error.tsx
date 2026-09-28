"use client";

// Last-resort boundary. Fires when the root layout itself throws — at
// that point Next.js discards the layout, so this file must render its
// own <html> and <body>. Nothing platform-conditional here: it needs to
// work when almost everything else has failed.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#f8fafc", color: "#0f172a" }}>
        <main style={{ maxWidth: 640, margin: "0 auto", padding: "4rem 1.5rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.75rem", color: "#021550", margin: "0 0 1rem" }}>
            TUTORERA is temporarily unavailable
          </h1>
          <p style={{ color: "#475569", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            The site failed to load. Please try again in a moment.
          </p>
          {error.digest && (
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", fontFamily: "monospace", marginBottom: "1.5rem" }}>
              Reference: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{ background: "#0329b2", color: "white", border: "none", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", fontWeight: 700, cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
