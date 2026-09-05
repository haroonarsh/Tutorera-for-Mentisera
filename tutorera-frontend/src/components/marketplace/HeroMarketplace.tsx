import Link from "next/link";
import { ArrowRight, BadgeCheck, CheckCircle, Sparkles } from "lucide-react";
import QuickRequestComposer from "./QuickRequestComposer";

export default function HeroMarketplace() {
  return (
    <section
      style={{
        position: "relative",
        background: "radial-gradient(circle at 50% 0%, #eef5ff 0%, #f8faff 50%, #ffffff 100%)",
        padding: "clamp(2rem, 5vw, 3.5rem) 1rem 2.5rem",
        borderBottom: "1px solid #e2e8f0",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
            gap: "clamp(1.5rem, 4vw, 2.5rem)",
            alignItems: "center",
            marginBottom: "2.5rem",
          }}
        >
          {/* Hero Copy */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "#eef5ff",
                border: "1px solid #bfdbfe",
                padding: "0.3rem 0.75rem",
                borderRadius: "999px",
                fontSize: "0.72rem",
                fontWeight: 800,
                color: "#0329b2",
                marginBottom: "1rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <BadgeCheck size={15} /> A Global Student-Led Tutoring Marketplace
            </div>

            <h1
              style={{
                fontSize: "clamp(1.85rem, 4.5vw, 3rem)",
                fontWeight: 900,
                color: "#021550",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                marginBottom: "1rem",
              }}
            >
              Need a Tutor? <br />
              <span style={{ color: "#016ef8" }}>Post Your Requirement.</span>
            </h1>

            <p
              style={{
                fontSize: "clamp(0.92rem, 2vw, 1.05rem)",
                color: "#475569",
                lineHeight: 1.6,
                marginBottom: "1.5rem",
                maxWidth: 540,
              }}
            >
              Set your subject, location, schedule and preferred budget. Verified tutors can accept your rate or send an offer.
            </p>

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: "1.5rem",
              }}
            >
              <Link
                href="/post-tuition-request"
                style={{
                  background: "#0329b2",
                  color: "white",
                  padding: "0.85rem 1.75rem",
                  borderRadius: "0.75rem",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  textDecoration: "none",
                  boxShadow: "0 8px 24px rgba(3, 41, 178, 0.35)",
                  minHeight: "48px",
                  flex: "1 1 auto",
                  maxWidth: "320px",
                }}
              >
                <span>Post Tuition Request</span>
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/tutors"
                style={{
                  background: "white",
                  color: "#021550",
                  padding: "0.85rem 1.5rem",
                  borderRadius: "0.75rem",
                  fontWeight: 700,
                  fontSize: "0.92rem",
                  border: "1.5px solid #cbd5e1",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "48px",
                  flex: "1 1 auto",
                  maxWidth: "320px",
                }}
              >
                Browse Verified Tutors
              </Link>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                flexWrap: "wrap",
                fontSize: "0.82rem",
                color: "#64748b",
              }}
            >
              <Link
                href="/how-tutor-offers-work"
                style={{
                  color: "#0329b2",
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                <Sparkles size={15} color="#016ef8" /> How Tutor Offers Work →
              </Link>
              <span>•</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                <CheckCircle size={15} color="#10b981" /> 0% student marketplace fee
              </span>
            </div>
          </div>

          {/* Quick Request Visual / Guarantee Card */}
          <div>
            <div
              style={{
                background: "white",
                borderRadius: "1.25rem",
                padding: "clamp(1.25rem, 3vw, 1.75rem)",
                border: "1.5px solid #bfdbfe",
                boxShadow: "0 12px 36px rgba(1, 110, 248, 0.1)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <span style={{ background: "#ecfdf5", color: "#059669", padding: "0.25rem 0.6rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 800 }}>
                  STUDENT-LED REVERSE MARKETPLACE
                </span>
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#021550", marginBottom: "0.5rem" }}>
                You Decide the Budget. Tutors Compete for You.
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#475569", lineHeight: "1.5", margin: "0 0 1rem 0" }}>
                Unlike traditional agency models, on TUTORERA students propose their preferred rate. Qualified tutors accept or counter transparently.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.78rem" }}>
                <div style={{ background: "#f8fafc", padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
                  <strong style={{ display: "block", color: "#021550" }}>Home Tuition</strong>
                  <span style={{ color: "#64748b" }}>Local verified tutors</span>
                </div>
                <div style={{ background: "#f8fafc", padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
                  <strong style={{ display: "block", color: "#021550" }}>Online Tuition</strong>
                  <span style={{ color: "#64748b" }}>Worldwide 1-on-1 tutors</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Embedded Quick Request Composer */}
        <QuickRequestComposer />
      </div>
    </section>
  );
}
