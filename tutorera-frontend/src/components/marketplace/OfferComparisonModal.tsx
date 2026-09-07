"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { 
  X, 
  ShieldCheck, 
  Star, 
  Sparkles, 
  Send, 
  MessageSquare, 
  Check, 
  AlertCircle,
  Clock,
  DollarSign
} from "lucide-react";
import api from "@/lib/axios";
import { useFocusTrap } from "@/hooks/useFocusTrap";

export interface TutorOfferItem {
  _id: string;
  tutor: {
    _id: string;
    name: string;
    avatar?: string;
    title?: string;
    city?: string;
    countryName?: string;
    policeVerificationStatus?: string;
    degreeVerificationStatus?: string;
    rating?: number;
    reviewsCount?: number;
    experience?: number;
  };
  amount: number;
  currency?: string;
  pricingUnit?: string;
  message?: string;
  availability?: string;
  matchScore?: number;
  matchReasons?: string[];
  status: "pending" | "accepted" | "rejected" | "countered" | "withdrawn";
  createdAt: string;
}

interface OfferComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestTitle: string;
  proposedBudget: number;
  currency: string;
  pricingUnit: string;
  offers: TutorOfferItem[];
  onAcceptOffer: (offerId: string) => void;
  onCounterOffer: (offerId: string, counterAmount: number) => void;
}

export default function OfferComparisonModal({
  isOpen,
  onClose,
  requestTitle,
  proposedBudget,
  currency,
  pricingUnit,
  offers,
  onAcceptOffer,
  onCounterOffer,
}: OfferComparisonModalProps) {
  const [selectedOfferId, setSelectedOfferId] = useState<string>(offers[0]?._id || "");
  const [counteringOfferId, setCounteringOfferId] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState<string>("");
  const [showGuaranteeConfirm, setShowGuaranteeConfirm] = useState<string | null>(null);
  const modalRef = useFocusTrap(isOpen, onClose);

  if (!isOpen) return null;

  const activeOffer = offers.find((o) => o._id === selectedOfferId) || offers[0];

  const handleSendCounter = (offerId: string) => {
    const amt = parseFloat(counterAmount);
    if (!amt || isNaN(amt) || amt <= 0) return;
    onCounterOffer(offerId, amt);
    setCounteringOfferId(null);
    setCounterAmount("");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-title"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(2, 21, 80, 0.7)",
        backdropFilter: "blur(6px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        ref={modalRef}
        style={{
          background: "white",
          borderRadius: "1.25rem",
          maxWidth: "960px",
          width: "100%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #bfdbfe",
          overflow: "hidden",
          animation: "modalFadeIn 0.2s ease-out",
        }}
      >
        {/* Header */}
        <div 
          style={{ 
            background: "linear-gradient(135deg, #021550 0%, #0329b2 100%)", 
            color: "white", 
            padding: "1.25rem 1.75rem", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center" 
          }}
        >
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "rgba(255, 255, 255, 0.2)", padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700, marginBottom: "0.35rem" }}>
              <Sparkles size={12} /> Compare Tutor Offers
            </div>
            <h2 id="comparison-title" style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>
              {requestTitle}
            </h2>
            <p style={{ fontSize: "0.82rem", color: "#bfdbfe", margin: "0.25rem 0 0" }}>
              Your Proposed Budget: <strong style={{ color: "#34d399" }}>{currency} {proposedBudget.toLocaleString()}/{pricingUnit}</strong> · {offers.length} Tutor Offers Received
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close comparison modal"
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "none",
              color: "white",
              borderRadius: "50%",
              width: "44px",
              height: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content: Side-by-side Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", padding: "1.5rem", overflowY: "auto" }}>
          {offers.map((offer) => {
            const isSelected = selectedOfferId === offer._id;
            const isCountering = counteringOfferId === offer._id;
            const isPoliceVerified = offer.tutor?.policeVerificationStatus === "approved";
            const matchScore = offer.matchScore || 92;

            return (
              <div
                key={offer._id}
                style={{
                  background: isSelected ? "#f8faff" : "white",
                  borderRadius: "1rem",
                  border: isSelected ? "2.5px solid #0329b2" : "1.5px solid #e2e8f0",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: isSelected ? "0 8px 24px rgba(3, 41, 178, 0.12)" : "0 2px 8px rgba(0, 0, 0, 0.04)",
                  position: "relative",
                  transition: "all 0.15s ease",
                }}
              >
                <div>
                  {/* Tutor info */}
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.75rem" }}>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        background: "#021550",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.1rem",
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {offer.tutor?.name?.charAt(0) || "T"}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <strong style={{ fontSize: "0.98rem", color: "#021550" }}>
                          {offer.tutor?.name}
                        </strong>
                        {isPoliceVerified && (
                          <span title="Police Verified for In-Person Tuition" style={{ color: "#10b981", display: "inline-flex" }}>
                            <ShieldCheck size={16} />
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: "0.76rem", color: "#64748b" }}>
                        {offer.tutor?.title || "Verified Tutor"} · {offer.tutor?.city || "Online"}
                      </span>
                    </div>
                  </div>

                  {/* Rating & Match Score */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", background: "white", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "#f59e0b", fontSize: "0.8rem", fontWeight: 700 }}>
                      <Star size={13} fill="#f59e0b" color="#f59e0b" />
                      <span>{offer.tutor?.rating || 4.9} ({offer.tutor?.reviewsCount || 8} reviews)</span>
                    </div>
                    <span style={{ fontSize: "0.76rem", fontWeight: 800, color: "#0329b2", background: "#eef5ff", padding: "0.15rem 0.5rem", borderRadius: "999px" }}>
                      {matchScore}% Match
                    </span>
                  </div>

                  {/* Message */}
                  {offer.message && (
                    <p style={{ fontSize: "0.8rem", color: "#475569", background: "#f8fafc", padding: "0.6rem 0.75rem", borderRadius: "0.5rem", margin: "0 0 0.85rem", fontStyle: "italic", lineHeight: 1.4 }}>
                      &ldquo;{offer.message}&rdquo;
                    </p>
                  )}
                </div>

                {/* Price & Actions */}
                <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "0.76rem", color: "#64748b" }}>Offered Rate:</span>
                    <div>
                      <span style={{ fontSize: "1.2rem", fontWeight: 900, color: "#021550" }}>
                        {offer.currency || currency} {offer.amount.toLocaleString()}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>/{offer.pricingUnit || pricingUnit}</span>
                    </div>
                  </div>

                  {isCountering ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <input
                        type="number"
                        min="1"
                        placeholder={`Counter rate (${currency})`}
                        value={counterAmount}
                        onChange={(e) => setCounterAmount(e.target.value)}
                        style={{
                          padding: "0.5rem 0.75rem",
                          borderRadius: "0.4rem",
                          border: "1.5px solid #0329b2",
                          fontSize: "0.85rem",
                          outline: "none",
                        }}
                      />
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                        <button
                          type="button"
                          onClick={() => handleSendCounter(offer._id)}
                          style={{
                            background: "#0329b2",
                            color: "white",
                            border: "none",
                            padding: "0.5rem",
                            borderRadius: "0.4rem",
                            fontWeight: 700,
                            fontSize: "0.78rem",
                            cursor: "pointer",
                          }}
                        >
                          Send Counter
                        </button>
                        <button
                          type="button"
                          onClick={() => setCounteringOfferId(null)}
                          style={{
                            background: "#f1f5f9",
                            color: "#475569",
                            border: "none",
                            padding: "0.5rem",
                            borderRadius: "0.4rem",
                            fontWeight: 600,
                            fontSize: "0.78rem",
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                      <button
                        type="button"
                        onClick={() => setShowGuaranteeConfirm(offer._id)}
                        style={{
                          background: "#0329b2",
                          color: "white",
                          border: "none",
                          padding: "0.6rem",
                          borderRadius: "0.5rem",
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.3rem",
                        }}
                      >
                        <Check size={14} /> Accept Offer
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCounteringOfferId(offer._id);
                          setCounterAmount(String(offer.amount));
                        }}
                        style={{
                          background: "#f8fafc",
                          color: "#021550",
                          border: "1.5px solid #cbd5e1",
                          padding: "0.6rem",
                          borderRadius: "0.5rem",
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          cursor: "pointer",
                          textAlign: "center",
                        }}
                      >
                        Counter Rate
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info note */}
        <div style={{ background: "#f8faff", borderTop: "1px solid #e2e8f0", padding: "0.85rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem", color: "#64748b" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
            <ShieldCheck size={14} color="#10b981" /> 0% student fee · TUTORERA Satisfaction Guarantee
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "#0329b2", fontWeight: 700, cursor: "pointer" }}
          >
            Done Comparing
          </button>
        </div>

        {/* Guarantee Confirmation Dialog */}
        {showGuaranteeConfirm && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: "rgba(2,21,80,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            borderRadius: "1rem",
            backdropFilter: "blur(2px)",
          }}>
            <div style={{
              background: "white",
              borderRadius: "1rem",
              padding: "1.5rem",
              maxWidth: "420px",
              width: "90%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ background: "#ecfdf5", borderRadius: "50%", padding: "0.6rem" }}>
                  <ShieldCheck size={24} color="#10b981" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#021550" }}>TUTORERA Satisfaction Guarantee</h3>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>Powered by secure platform checkout</p>
                </div>
              </div>

              <div style={{ background: "#f8fafc", borderRadius: "0.75rem", padding: "1rem", marginBottom: "1rem", fontSize: "0.83rem", color: "#334155", lineHeight: 1.6 }}>
                <p style={{ margin: "0 0 0.5rem 0", fontWeight: 700, color: "#021550" }}>Your booking is protected:</p>
                <ul style={{ margin: 0, paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <li>First session protection — full refund if not satisfied</li>
                  <li>Verified tutor credentials before booking</li>
                  <li>Secure payment processing via Rapid Gateway</li>
                  <li>Dispute resolution support</li>
                  <li>0% platform fee — price shown is what tutor receives</li>
                </ul>
              </div>

              <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "1rem", lineHeight: 1.5 }}>
                By proceeding, you agree to TUTORERA's <a href="/terms" style={{ color: "#0329b2" }}>Terms of Service</a> and <a href="/guarantee" style={{ color: "#0329b2" }}>Satisfaction Guarantee</a> policy.
              </p>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => setShowGuaranteeConfirm(null)}
                  style={{ flex: 1, padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", background: "white", color: "#334155", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowGuaranteeConfirm(null); onAcceptOffer(showGuaranteeConfirm); }}
                  style={{ flex: 1, padding: "0.6rem", borderRadius: "0.5rem", border: "none", background: "#10b981", color: "white", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" }}
                >
                  Confirm Booking
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
