"use client";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import { UI_COLORS } from "@/lib/brand";
import { AlertTriangle, CheckCircle2, Eye, Lock, Phone, Shield, ShieldAlert } from "lucide-react";
import Link from "next/link";

const C = UI_COLORS;

const TIPS = [
  { icon: <Eye size={20} color={C.accent} />, title: "Verify tutor identity", body: "All tutors on TUTORERA go through identity and qualification checks before they can accept requests. You can view a tutor's verification badge and approval status on their profile." },
  { icon: <Lock size={20} color={C.accent} />, title: "Pay only through the platform", body: "Never transfer money outside of TUTORERA. Payments made through the platform are protected by our Learner Guarantee and can be disputed if a session does not take place." },
  { icon: <ShieldAlert size={20} color={C.accent} />, title: "First sessions in shared spaces", body: "For in-person sessions, we recommend the first meeting in a public or shared space (library, coffee shop, or supervised room at home)." },
  { icon: <AlertTriangle size={20} color="#d97706" />, title: "Report suspicious behaviour", body: "If a tutor asks you to pay outside the platform, shares inappropriate content, or behaves suspiciously, report them immediately using the flag on their profile or via Support." },
  { icon: <CheckCircle2 size={20} color="#16a34a" />, title: "Trust your instincts", body: "If something feels wrong, end the session and contact our support team. You will not be penalised for reporting genuine safety concerns." },
  { icon: <Phone size={20} color={C.accent} />, title: "Keep personal details private", body: "Do not share your home address, phone number, or financial details directly in the chat. Use the platform's booking system for scheduling and payment." },
];

export default function SafetyPage() {
  return (
    <DashboardLayout>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "2rem 1rem" }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`, borderRadius: "1rem", padding: "2rem 2rem 2rem", marginBottom: "2rem", color: "white" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "0.75rem" }}>
            <Shield size={32} color="white" />
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0 }}>Your Safety on TUTORERA</h1>
          </div>
          <p style={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.65, margin: 0, maxWidth: 600 }}>
            TUTORERA is designed to keep every learner and tutor safe. We verify every tutor and protect every payment. Read our safety guidelines to stay protected.
          </p>
        </div>

        {/* Tips */}
        <div style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }}>
          {TIPS.map(tip => (
            <div key={tip.title} style={{ display: "flex", gap: "1rem", background: "white", border: "1px solid #dce5f4", borderRadius: "0.875rem", padding: "1.25rem 1.5rem", alignItems: "flex-start" }}>
              <div style={{ width: 40, height: 40, background: "#EEF5FF", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {tip.icon}
              </div>
              <div>
                <p style={{ fontWeight: 700, color: C.primary, margin: "0 0 0.35rem", fontSize: "0.95rem" }}>{tip.title}</p>
                <p style={{ color: "#425575", lineHeight: 1.6, margin: 0, fontSize: "0.875rem" }}>{tip.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Learner Guarantee */}
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "1rem", padding: "1.5rem 1.75rem", marginBottom: "2rem" }}>
          <h2 style={{ fontWeight: 800, color: "#15803d", fontSize: "1.1rem", margin: "0 0 0.5rem" }}>TUTORERA Learner Guarantee</h2>
          <p style={{ color: "#166534", lineHeight: 1.65, margin: "0 0 0.75rem", fontSize: "0.875rem" }}>
            If a booked session does not take place and the tutor is at fault, we will refund your payment in full. Disputes can be raised within 7 days of the session date.
          </p>
          <Link href="/support" style={{ color: "#15803d", fontWeight: 700, fontSize: "0.875rem" }}>Raise a dispute via Support →</Link>
        </div>

        {/* Emergency contact */}
        <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "1rem", padding: "1.5rem 1.75rem" }}>
          <h2 style={{ fontWeight: 800, color: "#be123c", fontSize: "1.1rem", margin: "0 0 0.5rem" }}>Emergency & urgent concerns</h2>
          <p style={{ color: "#9f1239", lineHeight: 1.65, margin: "0 0 0.75rem", fontSize: "0.875rem" }}>
            If you feel you are in immediate danger, contact local emergency services. For urgent platform safety issues, email us at <strong>safety@tutorera.ac.pk</strong>.
          </p>
          <Link href="/support" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 1.25rem", background: "#be123c", color: "white", borderRadius: "0.5rem", fontWeight: 700, fontSize: "0.85rem", textDecoration: "none", minHeight: 44 }}>
            Contact Support
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
