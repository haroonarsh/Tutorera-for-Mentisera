import Link from "next/link";
import { ShieldCheck, UserCheck, Lock, Award, Eye, FileText, ArrowRight } from "lucide-react";

const trustPillars = [
  {
    icon: UserCheck,
    title: "Verified Tutor Profiles",
    desc: "Every tutor undergoes CNIC verification, educational credential screening, and teaching background checks.",
    link: "/tutor-verification-standards"
  },
  {
    icon: Eye,
    title: "Transparent Tutor Offers",
    desc: "No hidden charges or arbitrary middleman markups. Tutors accept your rate or send clear counter-offers.",
    link: "/how-tutor-offers-work"
  },
  {
    icon: Lock,
    title: "Secure Booking & Escrow",
    desc: "Pay only when you choose your tutor. Sessions are protected under platform standards and fair cancellation rules.",
    link: "/payment-process"
  },
  {
    icon: Award,
    title: "Verified Student Reviews",
    desc: "Only students who actually attended and paid for tutoring sessions can leave ratings and feedback.",
    link: "/review-policy"
  },
  {
    icon: ShieldCheck,
    title: "Home Tuition Safety & Privacy",
    desc: "Your exact home address is never public. General locality is only used for travel estimation.",
    link: "/safety-policy"
  },
  {
    icon: FileText,
    title: "First-Session Guarantee",
    desc: "If your initial session does not meet expectations, request credit to try another tutor or receive a refund.",
    link: "/first-session-guarantee"
  }
];

export default function TrustSafetySection() {
  return (
    <section style={{ padding: "4.5rem 1.5rem", background: "#f8faff", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }} aria-labelledby="trust-section-title">
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 3.5rem" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#0329b2", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Trust & Security First
          </span>
          <h2 id="trust-section-title" style={{ fontSize: "2rem", fontWeight: 800, color: "#021550", margin: "0.5rem 0 0.75rem" }}>
            Built for Safe, Transparent Tutoring
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: 1.6 }}>
            TUTORERA eliminates informal tuition uncertainties by establishing verified standards for both home and online learning across Pakistan.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem"
        }}>
          {trustPillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                style={{
                  background: "white",
                  borderRadius: "1rem",
                  padding: "1.75rem",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 16px rgba(2, 21, 80, 0.04)",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: "0.625rem",
                  background: "#eef5ff",
                  color: "#0329b2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1rem"
                }}>
                  <Icon size={22} />
                </div>

                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#021550", marginBottom: "0.5rem" }}>
                  {pillar.title}
                </h3>
                <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.5, marginBottom: "1.25rem" }}>
                  {pillar.desc}
                </p>

                <div style={{ marginTop: "auto" }}>
                  <Link
                    href={pillar.link}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      fontSize: "0.825rem",
                      fontWeight: 700,
                      color: "#0329b2",
                      textDecoration: "none"
                    }}
                  >
                    Learn policy details <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
