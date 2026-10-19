"use client";
import api from "@/lib/axios";
import BrandLogo from "@/components/BrandLogo";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GuardianConsentPendingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const resend = async () => {
    setBusy(true); setMessage("");
    try {
      await api.post("/auth/guardian-consent/resend");
      setMessage("A new verification code was sent to the guardian email on your account.");
    } catch (err: any) {
      setMessage(err?.response?.data?.message || "Unable to resend the code. Try again later.");
    } finally { setBusy(false); }
  };
  const check = async () => {
    setBusy(true); setMessage("");
    try {
      const response = await api.get("/auth/me");
      if (!response.data.user?.isMinor || response.data.user?.parentConsentVerified) {
        window.location.assign("/onboarding/student");
      } else setMessage("Guardian approval is still pending. Ask your guardian to sign in to their own Parent Dashboard.");
    } catch { setMessage("Unable to check the approval status."); }
    finally { setBusy(false); }
  };
  if (!loading && !user) { router.replace("/login"); return null; }
  return (
    <main style={{ minHeight: "100vh", background: "#f5f7ff", display: "grid", placeItems: "center", padding: "1.5rem" }}>
      <div style={{ background: "white", borderRadius: "1rem", padding: "2rem", maxWidth: 520, width: "100%", border: "1px solid #e5e7eb" }}>
        <BrandLogo />
        <h1 style={{ marginTop: "1.5rem", fontSize: "1.5rem", fontWeight: 750, color: "#021550" }}>Guardian approval required</h1>
        <p style={{ color: "#475569", lineHeight: 1.6, marginTop: "0.8rem" }}>
          Your student account is created but tutoring features are restricted until an adult guardian approves the account.
          Your guardian must create or sign in to a separate parent account using the email you provided and enter the verification code sent there.
        </p>
        <p style={{ color: "#475569", fontSize: "0.87rem", marginTop: "0.8rem" }}>The verification code expires after 24 hours. Do not ask your guardian to share the code with you.</p>
        {message && <p role="status" style={{ background: "#eef5ff", color: "#123779", borderRadius: "0.5rem", padding: "0.75rem", marginTop: "1rem" }}>{message}</p>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1.5rem" }}>
          <button type="button" disabled={busy} onClick={() => void check()} style={{ padding: "0.75rem 1rem", color: "white", background: "#0329b2", border: 0, borderRadius: "0.5rem" }}>Check guardian approval</button>
          <button type="button" disabled={busy} onClick={() => void resend()} style={{ padding: "0.75rem 1rem", color: "#0329b2", background: "#eef5ff", border: "1px solid #c5d6ff", borderRadius: "0.5rem" }}>Resend code to guardian</button>
        </div>
      </div>
    </main>
  );
}
