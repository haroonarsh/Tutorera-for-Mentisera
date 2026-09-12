"use client";
import React from "react";
import { DashBid } from "@/types/dashboard";
import { formatPKR } from "@/lib/site";
import MatchScoreBadge from "@/components/marketplace/MatchScoreBadge";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { UI_COLORS, TEXT_COLORS } from "@/lib/brand";
import { DashCard, DashButton, StatusBadge, statusTone } from "./ui";

interface OfferComparisonModalProps {
  offers: DashBid[];
  selected: string[];
  onClose: () => void;
  onAccept: (id: string) => void;
  acceptingId: string | null;
}

export default function OfferComparisonModal({
  offers,
  selected,
  onClose,
  onAccept,
  acceptingId,
}: OfferComparisonModalProps) {
  const modalRef = useFocusTrap(true, onClose);
  const selectedOffers = offers.filter((o) => selected.includes(o._id));

  const comparisonRows: {
    label: string;
    render: (bid: DashBid) => React.ReactNode;
  }[] = [
    {
      label: "Match Score",
      render: (bid) =>
        bid.matchScore ? (
          <MatchScoreBadge
            score={bid.matchScore}
            tier={bid.matchTier as any}
            reasons={bid.matchReasons}
            breakdown={bid.matchScoreBreakdown}
            showBreakdown={false}
          />
        ) : (
          <span style={{ color: TEXT_COLORS.muted }}>N/A</span>
        ),
    },
    {
      label: "Rate",
      render: (bid) => (
        <span style={{ fontWeight: 700, fontSize: "1rem" }}>
          {formatPKR(bid.amount, bid.pricingUnit || "hour")}
        </span>
      ),
    },
    {
      label: "Rating",
      render: (bid) => (
        <span>
          {bid.profile?.isVerified ? (
            <span style={{ color: TEXT_COLORS.success, fontWeight: 600 }}>✓ </span>
          ) : null}
          <strong>{bid.profile?.averageRating?.toFixed(1) || "New"}</strong>{" "}
          <span style={{ color: TEXT_COLORS.muted, fontSize: "0.85em" }}>
            ({bid.profile?.totalReviews || 0} reviews)
          </span>
        </span>
      ),
    },
    {
      label: "Experience",
      render: (bid) => (
        <span>
          {bid.profile?.experience || 0} years experience
        </span>
      ),
    },
    {
      label: "Sessions",
      render: (bid) => (
        <span>{bid.completedSessions || 0} completed</span>
      ),
    },
    {
      label: "Response Rate",
      render: (bid) => (
        <span>{bid.responseRate || 0}%</span>
      ),
    },
    {
      label: "Education",
      render: (bid) =>
        bid.profile?.education?.length ? (
          bid.profile.education.map((ed: any, i: number) => (
            <div key={i}>
              <strong>{ed.degree}</strong>
              {ed.institution ? ` — ${ed.institution}` : ""}
            </div>
          ))
        ) : (
          <span style={{ color: TEXT_COLORS.muted }}>Not listed</span>
        ),
    },
    {
      label: "Subjects",
      render: (bid) =>
        bid.profile?.subjects?.length ? (
          <span>{bid.profile.subjects.slice(0, 4).join(", ")}</span>
        ) : (
          <span style={{ color: TEXT_COLORS.muted }}>Not listed</span>
        ),
    },
    {
      label: "Availability",
      render: (bid) =>
        bid.availability ? (
          <span>{bid.availability}</span>
        ) : (
          <span style={{ color: TEXT_COLORS.muted }}>Not specified</span>
        ),
    },
    {
      label: "Verification",
      render: (bid) =>
        bid.profile?.isVerified ? (
          <span style={{ color: TEXT_COLORS.success, fontWeight: 600 }}>✓ Fully Verified</span>
        ) : (
          <span style={{ color: TEXT_COLORS.danger }}>Unverified</span>
        ),
    },
    {
      label: "Trust & Eligibility",
      render: (bid) => (
        <span style={{ fontSize: "0.82em", lineHeight: 1.5 }}>
          {bid.profile?.degreeVerificationStatus === "approved" ? "Education verified" : "Education pending"}<br />
          {bid.profile?.cnicVerificationStatus === "approved" ? "Identity verified" : "Identity pending"}<br />
          {bid.profile?.policeVerificationStatus === "approved" ? "Background check approved" : "No approved background check"}<br />
          {bid.profile?.homeTuitionEligible ? "Home tuition eligible" : "Online tuition only"}
        </span>
      ),
    },
    {
      label: "Demo Video",
      render: (bid) => bid.profile?.demoVideoStatus === "approved" && bid.profile.videoIntro ? (
        <a href={bid.profile.videoIntro} target="_blank" rel="noopener noreferrer">Watch demo</a>
      ) : <span style={{ color: TEXT_COLORS.muted }}>Not available</span>,
    },
    {
      label: "Message",
      render: (bid) => (
        <span style={{ fontSize: "0.85em", color: TEXT_COLORS.secondary }}>
          {bid.message || <span style={{ color: TEXT_COLORS.muted }}>No message</span>}
        </span>
      ),
    },
  ];

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label="Compare tutor offers"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <DashCard
        padding="none"
        style={{
          width: "100%",
          maxWidth: 900,
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: `1px solid ${UI_COLORS.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            background: UI_COLORS.surface,
            zIndex: 1,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: TEXT_COLORS.primary }}>
              Compare Tutor Offers ({selectedOffers.length})
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: TEXT_COLORS.muted }}>
              Side-by-side comparison of selected offers
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close comparison"
            style={{
              background: UI_COLORS.gray50,
              border: "none",
              borderRadius: "50%",
              width: 36,
              height: 36,
              cursor: "pointer",
              fontSize: "1.1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: TEXT_COLORS.secondary,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.88rem",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    padding: "0.75rem 1rem",
                    background: UI_COLORS.gray50,
                    borderBottom: `1px solid ${UI_COLORS.border}`,
                    fontWeight: 700,
                    color: TEXT_COLORS.secondary,
                    minWidth: 120,
                    position: "sticky",
                    left: 0,
                    zIndex: 1,
                  }}
                >
                  Criterion
                </th>
                {selectedOffers.map((bid) => (
                  <th
                    key={bid._id}
                    style={{
                      textAlign: "center",
                      padding: "0.75rem 1rem",
                      background: UI_COLORS.gray50,
                      borderBottom: `1px solid ${UI_COLORS.border}`,
                      minWidth: 200,
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          background: UI_COLORS.accentLight,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: "1.1rem",
                          color: UI_COLORS.accent,
                          overflow: "hidden",
                        }}
                      >
                        {bid.tutor.avatar ? (
                          <img src={bid.tutor.avatar} alt={bid.tutor.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          bid.tutor.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span style={{ fontWeight: 800, color: TEXT_COLORS.primary }}>{bid.tutor.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, i) => (
                <tr
                  key={row.label}
                  style={{
                    background: i % 2 === 0 ? UI_COLORS.surface : UI_COLORS.gray50,
                  }}
                >
                  <td
                    style={{
                      padding: "0.65rem 1rem",
                      borderBottom: `1px solid ${UI_COLORS.border}`,
                      fontWeight: 600,
                      color: TEXT_COLORS.secondary,
                      position: "sticky",
                      left: 0,
                      background: i % 2 === 0 ? UI_COLORS.surface : UI_COLORS.gray50,
                      zIndex: 1,
                    }}
                  >
                    {row.label}
                  </td>
                  {selectedOffers.map((bid) => (
                    <td
                      key={bid._id}
                      style={{
                        padding: "0.65rem 1rem",
                        borderBottom: `1px solid ${UI_COLORS.border}`,
                        textAlign: "center",
                        verticalAlign: "middle",
                      }}
                    >
                      {row.render(bid)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr style={{ background: UI_COLORS.accentLight }}>
                <td
                  style={{
                    padding: "0.75rem 1rem",
                    borderBottom: `1px solid ${UI_COLORS.border}`,
                    fontWeight: 700,
                    color: UI_COLORS.accent,
                    position: "sticky",
                    left: 0,
                    background: UI_COLORS.accentLight,
                    zIndex: 1,
                  }}
                >
                  Actions
                </td>
                {selectedOffers.map((bid) => (
                  <td
                    key={bid._id}
                    style={{
                      padding: "0.75rem 1rem",
                      borderBottom: `1px solid ${UI_COLORS.border}`,
                      textAlign: "center",
                      verticalAlign: "middle",
                    }}
                  >
                    {["pending", "submitted", "viewed", "countered"].includes(bid.status) ? (
                      <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                        <DashButton
                          variant="primary"
                          size="sm"
                          onClick={() => onAccept(bid._id)}
                          disabled={acceptingId === bid._id}
                        >
                          {acceptingId === bid._id ? "Accepting..." : "Accept"}
                        </DashButton>
                        <DashButton variant="secondary" size="sm" href={`/tutors/${bid.tutor._id}`}>
                          Profile
                        </DashButton>
                      </div>
                    ) : (
                      <StatusBadge tone={statusTone(bid.status)}>{bid.status}</StatusBadge>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </DashCard>
    </div>
  );
}
