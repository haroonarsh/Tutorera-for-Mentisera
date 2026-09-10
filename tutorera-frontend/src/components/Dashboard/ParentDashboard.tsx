"use client";
import { UI_COLORS } from "@/lib/brand";
import { useState, useEffect } from "react";
import { Link2, Plus, Trash2, Users, BookOpen, CheckCircle, Clock } from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import api from "@/lib/axios";
import { showSuccess, showError } from "@/lib/toast";
import { formatMoney } from "@/lib/site";
import ConsentLinkChildModal from "@/components/Parent/ConsentLinkChildModal";

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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    completed: { label: "Completed", color: "#059669", bg: "#ecfdf5" },
    upcoming: { label: "Upcoming", color: "#7c3aed", bg: "#f5f3ff" },
    ongoing: { label: "Ongoing", color: "#d97706", bg: "#fffbeb" },
    cancelled: { label: "Cancelled", color: "#dc2626", bg: "#fef2f2" },
    open: { label: "Open", color: "#2563eb", bg: "#eff6ff" },
  };
  const b = map[status] ?? { label: status, color: "#6b7280", bg: "#f9fafb" };
  return (
    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: b.color, backgroundColor: b.bg, padding: "0.2rem 0.6rem", borderRadius: "999px" }}>
      {b.label}
    </span>
  );
}

function TeachingModeBadge({ mode }: { mode: string }) {
  const label = mode === "online" ? "Online" : mode === "home" ? "Home" : "Hybrid";
  return (
    <span style={{ fontSize: "0.72rem", fontWeight: 600, color: C.accent, backgroundColor: "#EEF5FF", padding: "0.2rem 0.5rem", borderRadius: "999px" }}>
      {label}
    </span>
  );
}

function EmptyState({ onLink }: { onLink: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "4rem 2rem", backgroundColor: "white", borderRadius: "1rem", border: "1px solid #e5e7eb" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👨‍👩‍👧‍👦</div>
      <h3 style={{ fontWeight: 700, color: C.primary, fontSize: "1.1rem", marginBottom: "0.5rem" }}>
        No children linked yet
      </h3>
      <p style={{ color: C.gray500, fontSize: "0.875rem", maxWidth: "360px", margin: "0 auto 1.5rem" }}>
        Link a student account to manage bookings, track progress, and approve sessions for your children.
      </p>
      <button onClick={onLink} style={{ backgroundColor: C.accent, color: "white", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", border: "none", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
          <Plus size={16} /> Link Child Account
        </span>
      </button>
    </div>
  );
}

/* Legacy direct-ID linking UI retired. ConsentLinkChildModal is the only supported flow.
function LinkChildModal({ onClose, onLinked }: { onClose: () => void; onLinked: () => void }) {
  const [studentUserId, setStudentUserId] = useState("");
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [subjects, setSubjects] = useState("");
  const [relationship, setRelationship] = useState("child");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentUserId.trim() || !name.trim()) { setError("Student User ID and Name are required."); return; }
    setLoading(true);
    setError("");
    try {
      await api.post("/parent/children", {
        studentUserId: studentUserId.trim(),
        name: name.trim(),
        level: level.trim(),
        subjects: subjects.split(",").map(s => s.trim()).filter(Boolean),
        relationship,
      });
      showSuccess("Child account linked successfully.");
      onLinked();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to link child account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }}>
      <div style={{ backgroundColor: "white", borderRadius: "1rem", padding: "2rem", width: "100%", maxWidth: "480px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: C.primary, marginBottom: "0.25rem" }}>Link Child Account</h2>
        <p style={{ color: C.gray500, fontSize: "0.8rem", marginBottom: "1.5rem" }}>Enter the student account ID and details of the child you want to manage.</p>

        {error && (
          <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.5rem", padding: "0.75rem 1rem", marginBottom: "1rem", color: C.error, fontSize: "0.875rem" }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: C.primary, marginBottom: "0.3rem", display: "block" }}>Student User ID *</label>
            <input value={studentUserId} onChange={e => setStudentUserId(e.target.value)} required placeholder="Paste the student's user ID"
              style={{ width: "100%", padding: "0.7rem 1rem", border: "1.5px solid #e5e7eb", borderRadius: "0.5rem", fontSize: "0.875rem", outline: "none", boxSizing: "border-box", color: C.primary }} />
            <p style={{ fontSize: "0.72rem", color: C.gray500, marginTop: "0.3rem" }}>Share your Parent ID with the student so they can add you as guardian.</p>
          </div>
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: C.primary, marginBottom: "0.3rem", display: "block" }}>Child's Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Ahmad Khan"
              style={{ width: "100%", padding: "0.7rem 1rem", border: "1.5px solid #e5e7eb", borderRadius: "0.5rem", fontSize: "0.875rem", outline: "none", boxSizing: "border-box", color: C.primary }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: C.primary, marginBottom: "0.3rem", display: "block" }}>Education Level</label>
              <input value={level} onChange={e => setLevel(e.target.value)} placeholder="e.g. Matric, FSC"
                style={{ width: "100%", padding: "0.7rem 1rem", border: "1.5px solid #e5e7eb", borderRadius: "0.5rem", fontSize: "0.875rem", outline: "none", boxSizing: "border-box", color: C.primary }} />
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: C.primary, marginBottom: "0.3rem", display: "block" }}>Relationship</label>
              <select value={relationship} onChange={e => setRelationship(e.target.value)}
                style={{ width: "100%", padding: "0.7rem 1rem", border: "1.5px solid #e5e7eb", borderRadius: "0.5rem", fontSize: "0.875rem", outline: "none", boxSizing: "border-box", color: C.primary }}>
                <option value="child">Child</option>
                <option value="sibling">Sibling</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: C.primary, marginBottom: "0.3rem", display: "block" }}>Subjects (comma-separated)</label>
            <input value={subjects} onChange={e => setSubjects(e.target.value)} placeholder="e.g. Mathematics, Physics"
              style={{ width: "100%", padding: "0.7rem 1rem", border: "1.5px solid #e5e7eb", borderRadius: "0.5rem", fontSize: "0.875rem", outline: "none", boxSizing: "border-box", color: C.primary }} />
          </div>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
            <button type="button" onClick={onClose} style={{ padding: "0.7rem 1.25rem", borderRadius: "0.5rem", border: "1.5px solid #e5e7eb", backgroundColor: "white", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", color: C.primary }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: "0.7rem 1.25rem", borderRadius: "0.5rem", border: "none", backgroundColor: loading ? "#93c5fd" : C.accent, fontWeight: 700, fontSize: "0.85rem", cursor: loading ? "not-allowed" : "pointer", color: "white" }}>
              {loading ? "Linking..." : "Link Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

*/
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
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: C.primary, marginBottom: "0.4rem" }}>
          Parent Dashboard
        </h1>
        <p style={{ color: C.gray500, fontSize: "0.875rem" }}>
          Manage your children&apos;s tutoring accounts, track sessions, and oversee bookings.
        </p>
      </div>

      {/* Consent explainer */}
      <div style={{ backgroundColor: "#EEF5FF", border: "1px solid #bfdbfe", borderRadius: "0.875rem", padding: "1.25rem 1.5rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, color: C.accent, fontSize: "0.85rem", marginBottom: "0.2rem" }}>Student consent protects both accounts</p>
          <p style={{ fontSize: "0.85rem", color: C.gray500, margin: 0 }}>Enter the student&apos;s registered email to send a time-limited consent code. Access starts only after confirmation.</p>
        </div>
      </div>

      {pendingLinkRequests.length > 0 && <section aria-labelledby="pending-consent-title" style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "0.875rem", padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
        <h2 id="pending-consent-title" style={{ margin: 0, color: C.primary, fontSize: "1rem" }}>Awaiting student consent</h2>
        {pendingLinkRequests.map((item) => <div key={item._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", paddingTop: "0.75rem", flexWrap: "wrap" }}>
          <p style={{ margin: 0, color: "#475569", fontSize: "0.875rem" }}><strong>{item.name}</strong> · {item.relationship} · expires {new Date(item.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
          <button type="button" onClick={() => cancelLinkRequest(item._id)} style={{ minHeight: 36, border: "1px solid #d97706", borderRadius: "0.5rem", background: "white", color: "#92400e", fontWeight: 700, cursor: "pointer", padding: "0.4rem 0.65rem" }}>Cancel request</button>
        </div>)}
      </section>}

      {pendingApprovals.length > 0 && <section aria-labelledby="pending-approval-title" style={{ background: "#eef5ff", border: "1px solid #93c5fd", borderRadius: "0.875rem", padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
        <h2 id="pending-approval-title" style={{ margin: 0, color: C.primary, fontSize: "1rem" }}>Booking approvals needed</h2>
        {pendingApprovals.map((item) => <div key={item._id} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", paddingTop: "0.8rem", flexWrap: "wrap" }}>
          <p style={{ margin: 0, color: "#334155", fontSize: "0.9rem" }}><strong>{item.studentName}</strong> selected a tutor offer for <strong>{item.subject}</strong>{item.offer ? ` — ${formatMoney(item.offer.amount, item.offer.currency || item.currency || "PKR", item.offer.pricingUnit)}` : ""}.</p>
          <div style={{ display: "flex", gap: "0.5rem" }}><button type="button" onClick={() => decideApproval(item._id, "decline")} style={{ minHeight: 38, border: "1px solid #b91c1c", borderRadius: "0.5rem", background: "white", color: "#b91c1c", fontWeight: 700, cursor: "pointer", padding: "0.4rem 0.65rem" }}>Decline</button><button type="button" onClick={() => decideApproval(item._id, "approve")} style={{ minHeight: 38, border: 0, borderRadius: "0.5rem", background: "#0329B2", color: "white", fontWeight: 700, cursor: "pointer", padding: "0.4rem 0.65rem" }}>Approve & pay</button></div>
        </div>)}
      </section>}

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ backgroundColor: "white", borderRadius: "0.875rem", padding: "1.25rem", border: "1px solid #e5e7eb", borderTop: `3px solid ${C.accent}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
            <Users size={18} color={C.accent} />
            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>Linked Children</p>
          </div>
          <p style={{ fontSize: "1.75rem", fontWeight: 800, color: C.primary }}>{children.length}</p>
        </div>
        <div style={{ backgroundColor: "white", borderRadius: "0.875rem", padding: "1.25rem", border: "1px solid #e5e7eb", borderTop: "3px solid #16a34a" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
            <BookOpen size={18} color="#16a34a" />
            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Sessions</p>
          </div>
          <p style={{ fontSize: "1.75rem", fontWeight: 800, color: C.primary }}>{recentBookings.filter(b => b.status === "completed").length}</p>
        </div>
        <div style={{ backgroundColor: "white", borderRadius: "0.875rem", padding: "1.25rem", border: "1px solid #e5e7eb", borderTop: "3px solid #7c3aed" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
            <Clock size={18} color="#7c3aed" />
            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.05em" }}>Upcoming</p>
          </div>
          <p style={{ fontSize: "1.75rem", fontWeight: 800, color: C.primary }}>{recentBookings.filter(b => b.status === "upcoming").length}</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <div style={{ width: 36, height: 36, border: `3px solid ${C.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : children.length === 0 ? (
        <EmptyState onLink={() => setShowLinkModal(true)} />
      ) : (
        <>
          {/* Children list */}
          <div style={{ backgroundColor: "white", borderRadius: "0.875rem", border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: "1.5rem" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontWeight: 700, color: C.primary, fontSize: "0.95rem", margin: 0 }}>Your Children</h3>
              <button onClick={() => setShowLinkModal(true)} style={{ display: "flex", alignItems: "center", gap: "0.4rem", backgroundColor: C.accent, color: "white", padding: "0.55rem 1rem", borderRadius: "0.5rem", border: "none", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }}>
                <Plus size={14} /> Link Child
              </button>
            </div>
            {children.map(child => (
              <div key={child._id} style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f9fafb" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "1rem", flexShrink: 0 }}>
                        {child.name.charAt(0)}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, color: C.primary, fontSize: "0.95rem", margin: 0 }}>{child.name}</p>
                        <p style={{ fontSize: "0.75rem", color: C.gray500, margin: 0 }}>
                          {child.studentProfile?.currentLevel || child.level || "Student"} •
                          {child.studentProfile?.city ? ` ${child.studentProfile.city}` : ""}
                        </p>
                      </div>
                    </div>
                    {child.subjects.length > 0 && (
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                        {child.subjects.map(s => (
                          <span key={s} style={{ fontSize: "0.72rem", fontWeight: 600, color: C.accent, backgroundColor: "#EEF5FF", padding: "0.2rem 0.5rem", borderRadius: "999px" }}>{s}</span>
                        ))}
                      </div>
                    )}
                    <p style={{ fontSize: "0.72rem", color: C.gray500, marginTop: "0.4rem" }}>
                      Student ID: <code style={{ backgroundColor: "#f3f4f6", padding: "0.1rem 0.3rem", borderRadius: "0.25rem", fontSize: "0.7rem" }}>{child.studentUser}</code>
                    </p>
                  </div>
                  <button onClick={() => setPendingUnlink(child._id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: "0.4rem", borderRadius: "0.375rem" }} title="Unlink child">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Recent bookings */}
          {recentBookings.length > 0 && (
            <div style={{ backgroundColor: "white", borderRadius: "0.875rem", border: "1px solid #e5e7eb", overflow: "hidden" }}>
              <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f3f4f6" }}>
                <h3 style={{ fontWeight: 700, color: C.primary, fontSize: "0.95rem", margin: 0 }}>Recent Sessions Across All Children</h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr", padding: "0.6rem 1.5rem", backgroundColor: C.gray50, borderBottom: "1px solid #e5e7eb" }} className="parent-table-header">
                {["Child", "Tutor", "Subject", "Amount", "Status"].map(h => (
                  <p key={h} style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{h}</p>
                ))}
              </div>
              {recentBookings.map((b, idx) => (
                <div key={b._id}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr", padding: "0.875rem 1.5rem", alignItems: "center", borderBottom: idx < recentBookings.length - 1 ? "1px solid #f9fafb" : "none" }} className="parent-table-row">
                    <p style={{ fontWeight: 600, color: C.primary, fontSize: "0.875rem", margin: 0 }}>{b.studentName}</p>
                    <p style={{ fontSize: "0.875rem", color: C.gray500, margin: 0 }}>{b.tutorName}</p>
                    <span style={{ fontSize: "0.78rem", fontWeight: 600, padding: "0.2rem 0.5rem", borderRadius: "999px", backgroundColor: "#EEF5FF", color: C.accent, width: "fit-content" }}>{b.subject}</span>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: C.primary, margin: 0 }}>{formatMoney(b.amount, b.currency || "PKR")}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <StatusBadge status={b.status} />
                      <TeachingModeBadge mode={b.teachingMode} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Link modal */}
      {showLinkModal && <ConsentLinkChildModal onClose={() => setShowLinkModal(false)} onLinked={fetchProfile} />}
      {pendingUnlink && <div role="presentation" style={{ position: "fixed", inset: 0, zIndex: 1000, display: "grid", placeItems: "center", padding: "1rem", background: "rgba(2,21,80,.62)" }}><section role="alertdialog" aria-modal="true" aria-labelledby="unlink-child-title" style={{ maxWidth: 440, background: "white", borderRadius: "1rem", padding: "1.5rem", color: C.primary }}><h2 id="unlink-child-title" style={{ marginTop: 0 }}>Unlink learner?</h2><p style={{ color: "#475569", lineHeight: 1.5 }}>This removes your access to this learner&apos;s tutoring activity. You can send a new consent request later.</p><div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}><button type="button" onClick={() => setPendingUnlink(null)}>Cancel</button><button type="button" onClick={() => handleUnlink(pendingUnlink)} style={{ background: "#b91c1c", color: "white", border: 0, borderRadius: 6, padding: "0.55rem 0.8rem", fontWeight: 700 }}>Unlink</button></div></section></div>}

      <style>{`
        @media (max-width: 640px) {
          .parent-table-header { display: none !important; }
          .parent-table-row { display: none !important; }
        }
      `}</style>
    </div>
  );
}
