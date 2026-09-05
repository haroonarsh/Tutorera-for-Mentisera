"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calendar, PlusCircle, Star } from "lucide-react";
import DirectBookingModal from "@/components/Dashboard/DirectBookingModal";

interface StickyTutorProfileCTAProps {
  tutorId: string;
  tutorUserId: string;
  tutorName: string;
  hourlyRate: number;
  currency?: string;
  rating?: number;
  teachingMode: "online" | "in-person" | "both";
  city: string;
  subjects: string[];
}

export default function StickyTutorProfileCTA({
  tutorId,
  tutorUserId,
  tutorName,
  hourlyRate,
  currency = "PKR",
  rating = 4.9,
  teachingMode,
  city,
  subjects,
}: StickyTutorProfileCTAProps) {
  const [bookingOpen, setBookingOpen] = useState(false);

  return (
    <>
      <div
        className="mobile-sticky-tutor-cta"
        style={{
          position: "fixed",
          bottom: "calc(3.85rem + env(safe-area-inset-bottom, 0px))",
          left: 0,
          right: 0,
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(12px)",
          borderTop: "1.5px solid #e2e8f0",
          padding: "0.65rem 1rem",
          display: "none",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 48,
          boxShadow: "0 -4px 16px rgba(2, 21, 80, 0.08)",
        }}
      >
        {/* Rate & Rating Display */}
        <div style={{ minWidth: 0, paddingRight: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <strong style={{ fontSize: "1.05rem", fontWeight: 900, color: "#0329b2" }}>
              {currency} {hourlyRate.toLocaleString()}
            </strong>
            <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>/hr</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.72rem", color: "#d97706" }}>
            <Star size={12} fill="#d97706" />
            <span style={{ fontWeight: 700 }}>{rating ? rating.toFixed(1) : "5.0"}</span>
            <span style={{ color: "#94a3b8" }}>· {teachingMode}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexShrink: 0 }}>
          <Link
            href={`/post-tuition-request?subject=${encodeURIComponent(subjects[0] || "")}&city=${encodeURIComponent(city || "")}`}
            style={{
              background: "#eef5ff",
              color: "#0329b2",
              border: "1px solid #bfdbfe",
              padding: "0.6rem 0.75rem",
              borderRadius: "0.5rem",
              fontSize: "0.78rem",
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
              minHeight: "44px",
            }}
          >
            <PlusCircle size={14} /> Invite
          </Link>

          <button
            type="button"
            onClick={() => setBookingOpen(true)}
            style={{
              background: "linear-gradient(135deg, #0329b2 0%, #016ef8 100%)",
              color: "white",
              border: "none",
              padding: "0.6rem 1.15rem",
              borderRadius: "0.5rem",
              fontSize: "0.85rem",
              fontWeight: 800,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              boxShadow: "0 4px 12px rgba(3, 41, 178, 0.3)",
              minHeight: "44px",
            }}
          >
            <Calendar size={15} /> Request Tutor
          </button>
        </div>

        <style jsx>{`
          @media (max-width: 768px) {
            .mobile-sticky-tutor-cta {
              display: flex !important;
            }
          }
        `}</style>
      </div>

      {bookingOpen && (
        <DirectBookingModal
          tutorId={tutorUserId}
          tutorUserId={tutorUserId}
          tutorName={tutorName}
          hourlyRate={hourlyRate}
          currency={currency}
          tutorSubjects={subjects}
          tutorTeachingMode={teachingMode}
          tutorCity={city}
          onClose={() => setBookingOpen(false)}
          onSuccess={() => setBookingOpen(false)}
        />
      )}
    </>
  );
}
