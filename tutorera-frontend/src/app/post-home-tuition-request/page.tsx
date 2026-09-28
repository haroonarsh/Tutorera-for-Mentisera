"use client";

import RequestWizard from "@/components/marketplace/RequestWizard";
import { PostRequestPayload } from "@/types/dashboard";
import { useEffect,useState } from "react";

export default function PostHomeTuitionRequestPage() {
  const [prefill, setPrefill] = useState<Partial<PostRequestPayload>>({
    teachingMode: "in-person"
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("tutorera_quick_request");
      const countryCode = new URLSearchParams(window.location.search).get("country")?.toUpperCase();
      if (stored) {
        setPrefill((prev) => ({ ...prev, ...JSON.parse(stored), ...(countryCode && /^[A-Z]{2}$/.test(countryCode) ? { countryCode } : {}), teachingMode: "in-person" }));
      } else if (countryCode && /^[A-Z]{2}$/.test(countryCode)) {
        setPrefill((prev) => ({ ...prev, countryCode }));
      }
    } catch {
      // A malformed or unavailable saved draft must not block request creation.
    } finally {
      setReady(true);
    }
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: "#f8faff", padding: "3rem 1.5rem 5rem" }}>
      <div style={{ maxWidth: 840, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#0329b2", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Home Tuition Requirement
          </span>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "#021550", margin: "0.25rem 0 0.5rem" }}>
            Post a Home Tuition Request
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.9rem", maxWidth: 540, margin: "0 auto" }}>
            Specify your location and budget. Verified home tutors in your city will send offers. Your exact residential address is never shown publicly.
          </p>
        </div>
        {ready ? <RequestWizard initialMode="in-person" prefill={prefill} /> : <RequestWizardLoading />}
      </div>
    </main>
  );
}

function RequestWizardLoading() {
  return <div role="status" aria-live="polite" style={{ minHeight: 320, display: "grid", placeItems: "center", color: "#52627e" }}>Preparing your request…</div>;
}
