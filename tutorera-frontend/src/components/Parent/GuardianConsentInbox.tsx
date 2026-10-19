"use client";
import api from "@/lib/axios";
import { showError, showSuccess } from "@/lib/toast";
import { useEffect, useState } from "react";

interface GuardianRequest { studentId: string; expiresAt: string }
export default function GuardianConsentInbox({ onApproved }: { onApproved?: () => void }) {
  const [requests, setRequests] = useState<GuardianRequest[]>([]);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [adultAttestation, setAdultAttestation] = useState(false);
  const [working, setWorking] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const response = await api.get("/auth/guardian-consent/pending");
      setRequests(response.data.requests || []);
    } catch (error) { showError(error, "Could not retrieve guardian verification requests."); }
  };
  useEffect(() => { void refresh(); }, []);

  const verify = async (studentId: string) => {
    if (!adultAttestation || !dateOfBirth || !/^\d{8}$/.test(codes[studentId] || "")) {
      showError("Enter the eight-digit email code, your birth date, and confirm adult responsibility.");
      return;
    }
    setWorking(studentId);
    try {
      await api.post("/auth/guardian-consent/verify", {
        studentId, code: codes[studentId], guardianDateOfBirth: dateOfBirth, adultAttestation,
      });
      setCodes(previous => ({ ...previous, [studentId]: "" }));
      showSuccess("Guardian supervision verified; the student account is now active.");
      await refresh();
      onApproved?.();
    } catch (error) { showError(error, "Guardian consent could not be verified."); }
    finally { setWorking(null); }
  };

  return (
    <section aria-label="Student guardian verification" style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "0.875rem", padding: "1.25rem", marginBottom: "1.25rem" }}>
      <h2 style={{ fontWeight: 700, marginBottom: "0.5rem", color: "#021550" }}>Student accounts needing guardian verification ({requests.length})</h2>
      <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "0.9rem" }}>
        If a student listed your email as guardian, an eight-digit code was emailed to you. Confirm adult responsibility to activate supervised access. Email verification does not establish legal guardianship on its own.
      </p>
      {requests.length === 0 ? <p style={{ color: "#64748b", fontSize: "0.85rem" }}>No pending requests for your account email.</p> : (
        <>
          <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
            Your date of birth
            <input type="date" aria-label="Guardian date of birth" value={dateOfBirth} max={new Date().toISOString().slice(0, 10)}
              onChange={event => setDateOfBirth(event.target.value)}
              style={{ display: "block", border: "1px solid #cbd5e1", padding: "0.65rem", borderRadius: "0.4rem", marginTop: "0.35rem" }}/>
          </label>
          <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.85rem", marginBottom: "1rem" }}>
            <input type="checkbox" checked={adultAttestation} onChange={event => setAdultAttestation(event.target.checked)} />
            I am at least 18, am the student's parent or authorized guardian, and agree to supervise their TUTORERA account and booking requests.
          </label>
          {requests.map(item => (
            <div key={item.studentId} style={{ borderTop: "1px solid #e5e7eb", paddingTop: "0.8rem", marginTop: "0.8rem" }}>
              <p style={{ fontSize: "0.85rem", color: "#021550" }}>Student consent request ending {item.studentId.slice(-6)} · Expires {new Date(item.expiresAt).toLocaleString()}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={8}
                  aria-label="Eight-digit guardian email verification code"
                  placeholder="8-digit email code" value={codes[item.studentId] || ""}
                  onChange={event => setCodes(current => ({ ...current, [item.studentId]: event.target.value.replace(/\D/g, "") }))}
                  style={{ border: "1px solid #cbd5e1", borderRadius: "0.4rem", padding: "0.65rem" }} />
                <button type="button" disabled={working === item.studentId || !adultAttestation}
                  onClick={() => void verify(item.studentId)}
                  style={{ background: "#0329b2", border: "none", borderRadius: "0.4rem", color: "white", padding: "0.65rem 0.9rem", cursor: "pointer" }}>
                  {working === item.studentId ? "Verifying…" : "Verify guardian consent"}
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
