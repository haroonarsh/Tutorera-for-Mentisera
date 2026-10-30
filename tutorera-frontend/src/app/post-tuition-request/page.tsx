"use client";

import RequestWizard from "@/components/marketplace/RequestWizard";
import { PostRequestPayload } from "@/types/dashboard";
import { useEffect,useState } from "react";

export default function PostTuitionRequestPage() {
  const [prefill, setPrefill] = useState<Partial<PostRequestPayload>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const countryCode = params.get("country")?.toUpperCase();
    const subject = params.get("subject")?.trim();
    const selection = { ...(countryCode && /^[A-Z]{2}$/.test(countryCode) ? { countryCode } : {}), ...(subject && subject.length <= 120 ? { subject } : {}) };
    try {
      const stored = sessionStorage.getItem("tutorera_quick_request");
      if (stored) {
        setPrefill({ ...JSON.parse(stored), ...selection });
      } else setPrefill(selection);
    } catch {
      // A malformed or unavailable saved draft must not block request creation.
      setPrefill(selection);
    } finally {
      setReady(true);
    }
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: "#f8faff", padding: "3rem 1.5rem 5rem" }}>
      <div style={{ maxWidth: 840, margin: "0 auto" }}>
        {ready ? <RequestWizard prefill={prefill} /> : <RequestWizardLoading />}
      </div>
    </main>
  );
}

function RequestWizardLoading() {
  return <div role="status" aria-live="polite" style={{ minHeight: 320, display: "grid", placeItems: "center", color: "#52627e" }}>Preparing your request…</div>;
}
