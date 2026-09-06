import type { Metadata } from "next";
import Link from "next/link";
import { 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  FileCheck, 
  Lock, 
  Sparkles, 
  Award,
  Users,
  Eye
} from "lucide-react";
import QuickRequestComposer from "@/components/marketplace/QuickRequestComposer";
import MarketplaceFlow from "@/components/marketplace/MarketplaceFlow";

export const metadata: Metadata = {
  title: "Parent Safety Guide & Verified Tutors for Your Child | TUTORERA",
  description: "Find verified, background-checked tutors for your child. Mandatory police verification for home tuition, credential checks, and transparent payment protection.",
  alternates: { canonical: "/parents" },
};

export default function ParentsLandingPage() {
  return (
    <div style={{ backgroundColor: "white", minHeight: "100vh" }}>
      {/* Hero Header */}
      <section style={{ background: "linear-gradient(135deg, #021550 0%, #0329b2 100%)", color: "white", padding: "5rem 1.5rem 4rem" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(255, 255, 255, 0.15)", padding: "0.3rem 0.85rem", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 700, marginBottom: "1.25rem" }}>
            <ShieldCheck size={14} color="#34d399" /> Parent Peace of Mind Standard
          </div>
          <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 3.25rem)", fontWeight: 900, lineHeight: 1.15, marginBottom: "1.25rem", letterSpacing: "-0.02em" }}>
            Safe, Verified Tutoring <br />
            <span style={{ color: "#60a5fa" }}>for Your Child&apos;s Academic Success.</span>
          </h1>
          <p style={{ fontSize: "1.1rem", color: "#bfdbfe", maxWidth: 680, margin: "0 auto 2.5rem", lineHeight: 1.6 }}>
            Every home tutor is screened with mandatory police character certificates and verified university degrees. Post your requirements, receive transparent offers, and retain 100% payment control.
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/post-tuition-request"
              id="parent-landing-post-btn"
              style={{
                background: "white",
                color: "#0329b2",
                padding: "0.95rem 2rem",
                borderRadius: "0.75rem",
                fontWeight: 800,
                fontSize: "1rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.25)",
              }}
            >
              <span>Find a Tutor for My Child</span>
              <ArrowRight size={18} />
            </Link>

            <Link
              href="/help/for-parents"
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                color: "white",
                border: "1.5px solid rgba(255, 255, 255, 0.3)",
                padding: "0.95rem 1.75rem",
                borderRadius: "0.75rem",
                fontWeight: 700,
                fontSize: "0.95rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Read Safety Checklist
            </Link>
          </div>
        </div>
      </section>

      {/* Embedded Composer for Parents */}
      <section style={{ maxWidth: 1120, margin: "-2rem auto 4rem", padding: "0 1.5rem", position: "relative", zIndex: 10 }}>
        <QuickRequestComposer />
      </section>

      {/* Parent Verification Guarantees */}
      <section style={{ padding: "4rem 1.5rem", background: "#f8faff" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 3rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#0329b2", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Parent Safeguards
            </span>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#021550", margin: "0.4rem 0 0.75rem" }}>
              How We Protect Your Family & Home
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
              Unlike unmoderated WhatsApp or Facebook groups, TUTORERA enforces strict institutional verification.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            <div style={{ background: "white", padding: "2rem", borderRadius: "1rem", border: "1.5px solid #e2e8f0" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                <FileCheck size={24} />
              </div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#021550", marginBottom: "0.5rem" }}>
                Mandatory Police Verification
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.85rem", lineHeight: 1.6 }}>
                Before any educator can teach in-person home tuition, they must provide an official, approved Police Character Certificate. Online-only tutors are distinguished clearly.
              </p>
            </div>

            <div style={{ background: "white", padding: "2rem", borderRadius: "1rem", border: "1.5px solid #e2e8f0" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#eff6ff", color: "#0329b2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                <Award size={24} />
              </div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#021550", marginBottom: "0.5rem" }}>
                Academic Degree Audits
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.85rem", lineHeight: 1.6 }}>
                Our operations team verifies higher education degrees, transcripts, and subject specialization certificates before awarding verified tutor badges.
              </p>
            </div>

            <div style={{ background: "white", padding: "2rem", borderRadius: "1rem", border: "1.5px solid #e2e8f0" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                <Lock size={24} />
              </div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#021550", marginBottom: "0.5rem" }}>
                Platform Payment Protection
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.85rem", lineHeight: 1.6 }}>
                You never pay cash directly or risk upfront losses. Payments remain safely protected by TUTORERA guarantees until you verify the session was delivered to your satisfaction.
              </p>
            </div>

            <div style={{ background: "white", padding: "2rem", borderRadius: "1rem", border: "1.5px solid #e2e8f0" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#f3e8ff", color: "#7c1bea", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                <Eye size={24} />
              </div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#021550", marginBottom: "0.5rem" }}>
                Direct Parent Oversight
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.85rem", lineHeight: 1.6 }}>
                Parents can create accounts on behalf of their children, review tutor communication, receive lesson summaries, and approve payments from one centralized dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5-Step Marketplace Flow */}
      <MarketplaceFlow />

      {/* Final Action */}
      <section style={{ padding: "4rem 1.5rem", background: "white", textAlign: "center" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#021550", marginBottom: "1rem" }}>
            Give Your Child the Advantage of Qualified Mentorship
          </h2>
          <p style={{ color: "#64748b", fontSize: "1rem", marginBottom: "2rem", lineHeight: 1.6 }}>
            Set your budget, compare background-checked tutors, and book with total confidence.
          </p>
          <Link
            href="/post-tuition-request"
            style={{
              background: "#0329b2",
              color: "white",
              padding: "1rem 2.25rem",
              borderRadius: "0.75rem",
              fontWeight: 800,
              fontSize: "1rem",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              boxShadow: "0 8px 25px rgba(3, 41, 178, 0.35)",
            }}
          >
            <span>Post a Requirement for Your Child</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
