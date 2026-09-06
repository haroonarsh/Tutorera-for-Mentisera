"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  CheckCircle2, 
  Star, 
  Sparkles, 
  ArrowRight, 
  Check, 
  MessageSquare, 
  Award, 
  Clock 
} from "lucide-react";

interface DemoTutorOffer {
  id: string;
  name: string;
  title: string;
  avatar: string;
  matchScore: number;
  matchReasons: string[];
  proposedRate: number;
  offeredRate: number;
  currency: string;
  rating: number;
  reviewsCount: number;
  experienceYears: number;
  policeVerified: boolean;
  degreeVerified: boolean;
  message: string;
  fastResponder: boolean;
}

const DEMO_OFFERS: DemoTutorOffer[] = [
  {
    id: "offer-1",
    name: "Dr. Tariq Mahmood",
    title: "PhD Mathematics · Cambridge Certified Examiner",
    avatar: "T",
    matchScore: 97,
    matchReasons: ["Exact O/A-Level syllabus match", "Top 5% rated in Jeddah & Online", "Police certificate verified"],
    proposedRate: 200,
    offeredRate: 200,
    currency: "SAR",
    rating: 4.98,
    reviewsCount: 34,
    experienceYears: 12,
    policeVerified: true,
    degreeVerified: true,
    message: "I specialize in past-paper techniques and algebra mastery. Available for 3 weekly sessions as requested.",
    fastResponder: true,
  },
  {
    id: "offer-2",
    name: "Ayesha Farooq",
    title: "M.Phil Applied Physics · O/A-Level Gold Medallist",
    avatar: "A",
    matchScore: 94,
    matchReasons: ["100% past student grade improvements", "Interactive whiteboard expert", "Identity & degree verified"],
    proposedRate: 200,
    offeredRate: 220,
    currency: "SAR",
    rating: 4.92,
    reviewsCount: 22,
    experienceYears: 7,
    policeVerified: true,
    degreeVerified: true,
    message: "I provide comprehensive topical test series and revision notes. Proposing SAR 220 with all study kits included.",
    fastResponder: true,
  },
  {
    id: "offer-3",
    name: "Hamza Siddiqui",
    title: "B.S. Mathematics & Data Sciences",
    avatar: "H",
    matchScore: 89,
    matchReasons: ["Budget-friendly matched rate", "Immediate evening availability", "High response rate < 15m"],
    proposedRate: 200,
    offeredRate: 180,
    currency: "SAR",
    rating: 4.88,
    reviewsCount: 16,
    experienceYears: 5,
    policeVerified: true,
    degreeVerified: true,
    message: "Ready to start immediately. Happy to offer a competitive rate of SAR 180/hr with weekly progress reports for parents.",
    fastResponder: false,
  }
];

export default function OfferComparisonDemo() {
  const [selectedOffer, setSelectedOffer] = useState<string>("offer-1");

  return (
    <section 
      style={{ 
        padding: "4.5rem 1.5rem", 
        background: "linear-gradient(180deg, #f8faff 0%, #edf4ff 100%)",
        borderBottom: "1px solid #e2e8f0" 
      }} 
      aria-labelledby="comparison-demo-title"
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        {/* Section Header */}
        <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 3rem" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#0329b2", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            The Student Advantage
          </span>
          <h2 id="comparison-demo-title" style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.35rem)", fontWeight: 900, color: "#021550", margin: "0.5rem 0 0.85rem" }}>
            Compare Tutor Offers Side-by-Side
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.98rem", lineHeight: 1.6 }}>
            When you post a tuition need, tutors respond with transparent offers. Evaluate their match score, qualifications, background verification, and pricing before you accept.
          </p>
        </div>

        {/* Interactive Example Header Bar */}
        <div 
          style={{
            background: "white",
            border: "1.5px solid #cbd5e1",
            borderRadius: "1rem",
            padding: "1rem 1.5rem",
            marginBottom: "1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            boxShadow: "0 4px 12px rgba(2, 21, 80, 0.04)",
          }}
        >
          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#016ef8", textTransform: "uppercase" }}>
              Active Student Request
            </span>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#021550", margin: "0.2rem 0" }}>
              Mathematics & Physics (O-Level) · Jeddah, Saudi Arabia
            </h3>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
              Your Proposed Budget: <strong style={{ color: "#059669" }}>SAR 200 / hour</strong> · 3 Tutor Offers Received
            </span>
          </div>

          <Link
            href="/post-tuition-request"
            style={{
              background: "#0329b2",
              color: "white",
              padding: "0.65rem 1.25rem",
              borderRadius: "0.6rem",
              fontSize: "0.85rem",
              fontWeight: 800,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              boxShadow: "0 4px 12px rgba(3, 41, 178, 0.25)",
            }}
          >
            <span>Post Similar Need</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Offers Grid */}
        <div 
          style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", 
            gap: "1.25rem" 
          }}
        >
          {DEMO_OFFERS.map((offer) => {
            const isBestMatch = offer.matchScore >= 95;
            const isSelected = selectedOffer === offer.id;

            return (
              <div
                key={offer.id}
                onClick={() => setSelectedOffer(offer.id)}
                style={{
                  background: "white",
                  borderRadius: "1rem",
                  border: isSelected ? "2.5px solid #0329b2" : "1.5px solid #e2e8f0",
                  padding: "1.5rem",
                  boxShadow: isSelected 
                    ? "0 14px 32px rgba(3, 41, 178, 0.16)" 
                    : "0 4px 16px rgba(2, 21, 80, 0.05)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  position: "relative",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Top Badge */}
                {isBestMatch && (
                  <div 
                    style={{
                      position: "absolute",
                      top: "-12px",
                      left: "1.5rem",
                      background: "linear-gradient(135deg, #0329b2 0%, #016ef8 100%)",
                      color: "white",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "999px",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      boxShadow: "0 2px 8px rgba(3, 41, 178, 0.3)",
                    }}
                  >
                    <Sparkles size={12} /> HIGHEST MATCH
                  </div>
                )}

                <div>
                  {/* Tutor Header */}
                  <div style={{ display: "flex", gap: "0.85rem", alignItems: "center", marginBottom: "0.85rem", marginTop: isBestMatch ? "0.4rem" : "0" }}>
                    <div 
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        background: "#021550",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.2rem",
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {offer.avatar}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#021550", margin: 0 }}>
                          {offer.name}
                        </h4>
                        {offer.policeVerified && (
                          <span title="Police Background Checked" style={{ color: "#10b981", display: "inline-flex" }}>
                            <ShieldCheck size={16} />
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0.15rem 0 0" }}>
                        {offer.title}
                      </p>
                    </div>
                  </div>

                  {/* Ratings & Experience Row */}
                  <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.78rem", color: "#475569", marginBottom: "0.85rem", flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "#f59e0b", fontWeight: 700 }}>
                      <Star size={13} fill="#f59e0b" color="#f59e0b" /> {offer.rating} ({offer.reviewsCount} reviews)
                    </span>
                    <span>•</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                      <Clock size={13} /> {offer.experienceYears} yrs experience
                    </span>
                  </div>

                  {/* Match Score Bar */}
                  <div style={{ background: "#f8faff", borderRadius: "0.6rem", padding: "0.6rem 0.75rem", border: "1px solid #e2e8f0", marginBottom: "0.85rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                      <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#021550" }}>Smart Match Score</span>
                      <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#0329b2" }}>{offer.matchScore}%</span>
                    </div>
                    <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
                      <div 
                        style={{ 
                          width: `${offer.matchScore}%`, 
                          height: "100%", 
                          background: offer.matchScore >= 95 ? "#10b981" : "#0329b2",
                          borderRadius: "999px" 
                        }} 
                      />
                    </div>
                  </div>

                  {/* Key Match Badges */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "1rem" }}>
                    {offer.matchReasons.map((reason, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "#475569" }}>
                        <Check size={13} color="#10b981" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tutor Message Quote */}
                  <p 
                    style={{ 
                      fontSize: "0.82rem", 
                      color: "#334155", 
                      background: "#f1f5f9", 
                      borderRadius: "0.5rem", 
                      padding: "0.6rem 0.75rem", 
                      fontStyle: "italic",
                      lineHeight: 1.4,
                      margin: "0 0 1rem 0" 
                    }}
                  >
                    &ldquo;{offer.message}&rdquo;
                  </p>
                </div>

                {/* Offer Price & Direct Action */}
                <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Tutor Offered Rate:</span>
                    <span style={{ fontSize: "1.2rem", fontWeight: 900, color: "#021550" }}>
                      {offer.currency} {offer.offeredRate} <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>/ hr</span>
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                    <Link
                      href="/post-tuition-request"
                      style={{
                        background: "#0329b2",
                        color: "white",
                        padding: "0.6rem",
                        borderRadius: "0.5rem",
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        textAlign: "center",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      Accept Offer
                    </Link>
                    <Link
                      href="/post-tuition-request"
                      style={{
                        background: "#f8fafc",
                        color: "#021550",
                        border: "1px solid #cbd5e1",
                        padding: "0.6rem",
                        borderRadius: "0.5rem",
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        textAlign: "center",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      Counter Rate
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Under-Grid Assurance Banner */}
        <div 
          style={{ 
            marginTop: "2.5rem", 
            background: "white", 
            borderRadius: "1rem", 
            padding: "1.25rem 1.75rem", 
            border: "1px solid #bfdbfe",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Award size={24} color="#0329b2" />
            <div>
              <strong style={{ fontSize: "0.95rem", color: "#021550", display: "block" }}>
                Zero Commitment until You Accept an Offer
              </strong>
              <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                Posting a requirement is 100% free. No card required until you choose your tutor.
              </span>
            </div>
          </div>

          <Link
            href="/post-tuition-request"
            style={{
              color: "#0329b2",
              fontWeight: 800,
              fontSize: "0.88rem",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            <span>Start My Tutor Search</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
