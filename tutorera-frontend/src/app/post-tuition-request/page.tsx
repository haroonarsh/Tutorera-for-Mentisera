"use client";

import RequestWizard from "@/components/marketplace/RequestWizard";
import { PostRequestPayload } from "@/types/dashboard";
import { useEffect,useState } from "react";

export default function PostTuitionRequestPage() {
  const [prefill, setPrefill] = useState<Partial<PostRequestPayload>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("tutorera_quick_request");
      const countryCode = new URLSearchParams(window.location.search).get("country")?.toUpperCase();
      if (stored) {
        setPrefill({ ...JSON.parse(stored), ...(countryCode && /^[A-Z]{2}$/.test(countryCode) ? { countryCode } : {}) });
      } else if (countryCode && /^[A-Z]{2}$/.test(countryCode)) {
        setPrefill({ countryCode });
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
        {ready ? <RequestWizard prefill={prefill} /> : <RequestWizardLoading />}
      </div>
    </main>
  );
}

function RequestWizardLoading() {
  return <div role="status" aria-live="polite" style={{ minHeight: 320, display: "grid", placeItems: "center", color: "#52627e" }}>Preparing your request…</div>;
}
