"use client";
import { UI_COLORS, STATUS_COLORS, TEXT_COLORS, SPACING } from "@/lib/brand";
import { useState, useEffect } from "react";
import { Link2, Plus, Trash2, Users, BookOpen, Clock } from "lucide-react";
import api from "@/lib/axios";
import { showSuccess, showError } from "@/lib/toast";
import { formatMoney } from "@/lib/site";
import ConsentLinkChildModal from "@/components/Parent/ConsentLinkChildModal";
import { DashCard, DashButton, StatusBadge, EmptyState, StatTile, statusTone } from "./ui";

const C = UI_COLORS;

interface ChildProfile {
  _id: string;
  studentUser: string;
  name: string;
  level: string;
  subjects: string[];
  relationship: string;
  studentProfile?: {
    fullName: string;
    city?: string;
    institution?: string;
    currentLevel?: string;
  } | null;
}

interface RecentBooking {
  _id: string;
  studentName: string;
  tutorName: string;
  subject: string;
  amount: number;
  currency?: string;
  status: string;
  teachingMode: string;
  createdAt: string;
}

interface ParentProfileData {
  profile: {
    _id: string;
    children: ChildProfile[];
    approvalRequiredForBookings: boolean;
    spendingLimitMonthly?: number;
    notificationsEnabled: boolean;
  };
  recentBookings: RecentBooking[];
  pendingLinkRequests?: { _id: string; name: string; relationship: string; createdAt: string; expiresAt: string }[];
  pendingApprovals?: { _id: string; subject: string; studentName: string; currency?: string; offer?: { amount: number; currency?: string; pricingUnit?: string } | null }[];
}

function TeachingModeBadge({ mode }: { mode: string }) {
  const label = mode === "online" ? "Online" : mode === "home" ? "Home" : "Hybrid";
  return (
    <span style={{ fontSize: "0.72rem", fontWeight: 600, color: C.accent, backgroundColor: C.accentLight, padding: "0.2rem 0.5rem", borderRadius: "999px" }}>
      {label}
    </span>
  );
}

interface ParentDashboardProps {
  userId: string;
  userName: string;
  userAvatar?: string;
}

export default function ParentDashboard({ userId, userName }: ParentDashboardProps) {
  const [data, setData] = useState<ParentProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [pendingUnlink, setPendingUnlink] = useState<string | null>(null);

  const fetchProfile = () => {
    api.get("/parent/profile")
      .then(res => {
        setData(res.data);
      })
      .catch(() => showError("Failed to load parent profile."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleUnlink = async (childId: string) => {
    try {
      await api.delete(`/parent/children/${childId}`);
      showSuccess("Child account unlinked.");
      fetchProfile();
    } catch {
      showError("Failed to unlink child account.");
    }
    finally { setPendingUnlink(null); }
  };

  const children = data?.profile?.children ?? [];
  const recentBookings = data?.recentBookings ?? [];
  const pendingLinkRequests = data?.pendingLinkRequests ?? [];
  const pendingApprovals = data?.pendingApprovals ?? [];

  const cancelLinkRequest = async (requestId: string) => {
    try {
      await api.delete(`/parent/children/requests/${requestId}`);
      showSuccess("Consent request cancelled.");
      fetchProfile();
    } catch {
      showError("Unable to cancel the consent request.");
    }
  };
  const decideApproval = async (requestId: string, decision: "approve" | "decline") => {
    try {
      const response = await api.post(`/parent/booking-approvals/${requestId}`, { decision });
      if (decision === "approve" && response.data?.checkoutUrl) window.location.assign(response.data.checkoutUrl);
      else { showSuccess(response.data?.message || "Decision recorded."); fetchProfile(); }
    } catch (caught: unknown) {
      showError((caught as { response?: { data?: { message?: string } } })?.response?.data?.message || "Unable to record this decision.");
    }
  };

  return (
    <div style={{ maxWidth: "960px" }}>
      {/* Header */}
      <div style={{ marginBottom: SPACING.space8 }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: TEXT_COLORS.primary, marginBottom: "0.4rem" }}>
          Parent Dashboard
        </h1>
        <p style={{ color: TEXT_COLORS.muted, fontSize: "0.875rem" }}>
          Manage your children&apos;s tutoring accounts, track sessions, and oversee bookings.
        </p>
      </div>

      {/* Consent explainer */}
      <DashCard padding="md" accent={C.accent} style={{ marginBottom: SPACING.space6, background: STATUS_COLORS.info.bg, borderColor: STATUS_COLORS.info.border }}>
        <div style={{ display: "flex", alignItems: "center", gap: SPACING.space4, flexWrap: "wrap" }}>
          <Link2 size={20} color={C.accent} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <p style={{ fontWeight: 700, color: C.accent, fontSize: "0.85rem", marginBottom: "0.2rem" }}>Student consent protects both accounts</p>
            <p style={{ fontSize: "0.85rem", color: TEXT_COLORS.muted, margin: 0 }}>Enter the student&apos;s registered email to send a time-limited consent code. Access starts only after confirmation.</p>
          </div>
        </div>
      </DashCard>

      {pendingLinkRequests.length > 0 && (
        <DashCard padding="md" accent={STATUS_COLORS.warning.color} style={{ marginBottom: SPACING.space6, background: STATUS_COLORS.warning.bg, borderColor: STATUS_COLORS.warning.border }}>
          <section aria-labelledby="pending-consent-title">
            <h2 id="pending-consent-title" style={{ margin: 0, color: TEXT_COLORS.primary, fontSize: "1rem" }}>Awaiting student consent</h2>
            {pendingLinkRequests.map((item) => (
              <div key={item._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: SPACING.space4, paddingTop: SPACING.space3, flexWrap: "wrap" }}>
                <p style={{ margin: 0, color: TEXT_COLORS.secondary, fontSize: "0.875rem" }}><strong>{item.name}</strong> · {item.relationship} · expires {new Date(item.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                <DashButton variant="secondary" size="sm" onClick={() => cancelLinkRequest(item._id)} style={{ color: STATUS_COLORS.warning.color, borderColor: STATUS_COLORS.warning.color }}>Cancel request</DashButton>
              </div>
            ))}
          </section>
        </DashCard>
      )}

      {pendingApprovals.length > 0 && (
        <DashCard padding="md" accent={C.accent} style={{ marginBottom: SPACING.space6, background: STATUS_COLORS.info.bg, borderColor: STATUS_COLORS.info.border }}>
          <section aria-labelledby="pending-approval-title">
            <h2 id="pending-approval-title" style={{ margin: 0, color: TEXT_COLORS.primary, fontSize: "1rem" }}>Booking approvals needed</h2>
            {pendingApprovals.map((item) => (
              <div key={item._id} style={{ display: "flex", justifyContent: "space-between", gap: SPACING.space4, alignItems: "center", paddingTop: SPACING.space3, flexWrap: "wrap" }}>
                <p style={{ margin: 0, color: TEXT_COLORS.secondary, fontSize: "0.9rem" }}><strong>{item.studentName}</strong> selected a tutor offer for <strong>{item.subject}</strong>{item.offer ? ` — ${formatMoney(item.offer.amount, item.offer.currency || item.currency || "PKR", item.offer.pricingUnit)}` : ""}.</p>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <DashButton variant="danger" size="sm" onClick={() => decideApproval(item._id, "decline")}>Decline</DashButton>
                  <DashButton variant="primary" size="sm" onClick={() => decideApproval(item._id, "approve")}>Approve & pay</DashButton>
                </div>
              </div>
            ))}
          </section>
        </DashCard>
      )}

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: SPACING.space4, marginBottom: SPACING.space6 }}>
        <StatTile icon={<Users size={20} />} value={children.length} label="Linked children" tone="info" />
        <StatTile icon={<BookOpen size={20} />} value={recentBookings.filter(b => b.status === "completed").length} label="Total sessions" tone="success" />
        <StatTile icon={<Clock size={20} />} value={recentBookings.filter(b => b.status === "upcoming").length} label="Upcoming" tone="purple" />
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <div style={{ width: 36, height: 36, border: `3px solid ${C.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : children.length === 0 ? (
        <EmptyState
          icon="👨‍👩‍👧‍👦"
          title="No children linked yet"
          description="Link a student account to manage bookings, track progress, and approve sessions for your children."
          action={{ label: "Link Child Account", icon: <Plus size={16} />, onClick: () => setShowLinkModal(true) }}
        />
      ) : (
        <>
          {/* Children list */}
          <DashCard padding="none" style={{ overflow: "hidden", marginBottom: SPACING.space6 }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontWeight: 700, color: TEXT_COLORS.primary, fontSize: "0.95rem", margin: 0 }}>Your Children</h3>
              <DashButton variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowLinkModal(true)}>Link Child</DashButton>
            </div>
            {children.map(child => (
              <div key={child._id} style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: SPACING.space4, flexWrap: "wrap" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: SPACING.space3, marginBottom: "0.5rem" }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "1rem", flexShrink: 0 }}>
                        {child.name.charAt(0)}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, color: TEXT_COLORS.primary, fontSize: "0.95rem", margin: 0 }}>{child.name}</p>
                        <p style={{ fontSize: "0.75rem", color: TEXT_COLORS.muted, margin: 0 }}>
                          {child.studentProfile?.currentLevel || child.level || "Student"} •
                          {child.studentProfile?.city ? ` ${child.studentProfile.city}` : ""}
                        </p>
                      </div>
                    </div>
                    {child.subjects.length > 0 && (
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                        {child.subjects.map(s => (
                          <span key={s} style={{ fontSize: "0.72rem", fontWeight: 600, color: C.accent, backgroundColor: C.accentLight, padding: "0.2rem 0.5rem", borderRadius: "999px" }}>{s}</span>
                        ))}
                      </div>
                    )}
                    <p style={{ fontSize: "0.72rem", color: TEXT_COLORS.muted, marginTop: "0.4rem" }}>
                      Student ID: <code style={{ backgroundColor: C.gray50, padding: "0.1rem 0.3rem", borderRadius: "0.25rem", fontSize: "0.7rem" }}>{child.studentUser}</code>
                    </p>
                  </div>
                  <button onClick={() => setPendingUnlink(child._id)} style={{ background: "none", border: "none", cursor: "pointer", color: STATUS_COLORS.danger.color, padding: "0.4rem", borderRadius: "0.375rem" }} title="Unlink child">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </DashCard>

          {/* Recent bookings */}
          {recentBookings.length > 0 && (
            <DashCard padding="none" style={{ overflow: "hidden" }}>
              <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${C.border}` }}>
                <h3 style={{ fontWeight: 700, color: TEXT_COLORS.primary, fontSize: "0.95rem", margin: 0 }}>Recent Sessions Across All Children</h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr", padding: "0.6rem 1.5rem", backgroundColor: C.gray50, borderBottom: `1px solid ${C.border}` }} className="parent-table-header">
                {["Child", "Tutor", "Subject", "Amount", "Status"].map(h => (
                  <p key={h} style={{ fontSize: "0.72rem", fontWeight: 700, color: TEXT_COLORS.muted, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{h}</p>
                ))}
              </div>
              {recentBookings.map((b, idx) => (
                <div key={b._id}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr", padding: "0.875rem 1.5rem", alignItems: "center", borderBottom: idx < recentBookings.length - 1 ? `1px solid ${C.border}` : "none" }} className="parent-table-row">
                    <p style={{ fontWeight: 600, color: TEXT_COLORS.primary, fontSize: "0.875rem", margin: 0 }}>{b.studentName}</p>
                    <p style={{ fontSize: "0.875rem", color: TEXT_COLORS.muted, margin: 0 }}>{b.tutorName}</p>
                    <span style={{ fontSize: "0.78rem", fontWeight: 600, padding: "0.2rem 0.5rem", borderRadius: "999px", backgroundColor: C.accentLight, color: C.accent, width: "fit-content" }}>{b.subject}</span>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: TEXT_COLORS.primary, margin: 0 }}>{formatMoney(b.amount, b.currency || "PKR")}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <StatusBadge tone={statusTone(b.status)}>{b.status.charAt(0).toUpperCase() + b.status.slice(1)}</StatusBadge>
                      <TeachingModeBadge mode={b.teachingMode} />
                    </div>
                  </div>
                </div>
              ))}
            </DashCard>
          )}
        </>
      )}

      {/* Link modal */}
      {showLinkModal && <ConsentLinkChildModal onClose={() => setShowLinkModal(false)} onLinked={fetchProfile} />}
      {pendingUnlink && (
        <div role="presentation" style={{ position: "fixed", inset: 0, zIndex: 1000, display: "grid", placeItems: "center", padding: "1rem", background: "rgba(2,21,80,.62)" }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="unlink-child-title" style={{ maxWidth: 440, background: "white", borderRadius: "1rem", padding: "1.5rem", color: TEXT_COLORS.primary }}>
            <h2 id="unlink-child-title" style={{ marginTop: 0 }}>Unlink learner?</h2>
            <p style={{ color: TEXT_COLORS.secondary, lineHeight: 1.5 }}>This removes your access to this learner&apos;s tutoring activity. You can send a new consent request later.</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
              <DashButton variant="secondary" size="sm" onClick={() => setPendingUnlink(null)}>Cancel</DashButton>
              <DashButton variant="danger" size="sm" onClick={() => handleUnlink(pendingUnlink)}>Unlink</DashButton>
            </div>
          </section>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .parent-table-header { display: none !important; }
          .parent-table-row { display: none !important; }
        }
      `}</style>
    </div>
  );
}
