"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { showError, showSuccess } from "@/lib/toast";

const confirmations = [
  ["informationAccurate", "I confirm that the personal, identity, qualification and professional information I submitted is accurate."],
  ["agreementAccepted", "I have read and agree to the TUTORERA Tutor Marketplace & Independent Tutor Agreement (TTA-2026.1)."],
  ["policiesAccepted", "I agree to the applicable Trust & Safety, Child Safeguarding, Verification, Academic Integrity, Payment, Cancellation and Refund requirements."],
  ["independentProvider", "I understand that I participate as an independent service provider, not an employee of TUTORERA or MENTISERA."],
  ["feesUnderstood", "I understand the applicable marketplace fee and tax treatment displayed before accepting bookings."],
  ["electronicRecordsConsent", "I consent to electronic contracting and electronic records to the extent permitted by applicable law."],
] as const;

export default function AcceptTutorAgreementPage() {
  const router = useRouter();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const accept = async () => {
    if (!confirmations.every(([key]) => checked[key])) { showError("Please confirm every agreement statement."); return; }
    setSaving(true);
    try {
      await api.post("/tracking/application-status/accept-agreement", { confirmations: checked });
      showSuccess("Agreement accepted. Your tutor account is being activated.");
      router.replace("/tutor/application-status");
    } catch (error) { showError(error, "Unable to record agreement acceptance"); }
    finally { setSaving(false); }
  };
  return <main style={{ minHeight: "100vh", background: "#F5F7FF", padding: "32px 16px" }}>
    <section style={{ maxWidth: 760, margin: "0 auto", background: "white", border: "1px solid #dbe3f5", borderRadius: 16, padding: "32px", color: "#021550" }}>
      <p style={{ fontWeight: 800, color: "#0329B2", letterSpacing: ".08em", fontSize: 12 }}>TTA-2026.1 · ELECTRONIC ACCEPTANCE</p>
      <h1 style={{ margin: "8px 0" }}>Tutor Marketplace &amp; Independent Tutor Agreement</h1>
      <p style={{ color: "#475569", lineHeight: 1.6 }}>Your application is approved. Review the agreement before accepting it. Acceptance activates your approved marketplace profile; it does not change the transaction-specific rate, deductions, or payout terms recorded for each accepted booking.</p>
      <p><Link href="/terms/tutors" target="_blank" style={{ color: "#0329B2", fontWeight: 800 }}>Open the full Tutor Agreement in a new tab</Link></p>
      <fieldset style={{ border: 0, padding: 0, margin: "24px 0" }}>
        <legend style={{ fontWeight: 800, marginBottom: 12 }}>Required confirmations</legend>
        {confirmations.map(([key, label]) => <label key={key} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 0", borderBottom: "1px solid #edf2f7", color: "#334155", lineHeight: 1.45 }}>
          <input type="checkbox" checked={Boolean(checked[key])} onChange={event => setChecked(current => ({ ...current, [key]: event.target.checked }))} style={{ marginTop: 3, width: 18, height: 18 }} />
          <span>{label}</span>
        </label>)}
      </fieldset>
      <button type="button" onClick={accept} disabled={saving} style={{ width: "100%", padding: "13px 18px", border: 0, borderRadius: 10, background: saving ? "#93c5fd" : "#0329B2", color: "white", fontWeight: 800, cursor: saving ? "wait" : "pointer" }}>{saving ? "Recording acceptance…" : "I Have Read and Agree to the Tutor Agreement"}</button>
    </section>
  </main>;
}
