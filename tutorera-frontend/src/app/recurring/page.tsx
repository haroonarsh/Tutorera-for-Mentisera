"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarDays, Check, Pause, Play, RefreshCw, ShieldCheck, X } from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { showError, showSuccess } from "@/lib/toast";
import { UI_COLORS } from "@/lib/brand";

type Plan = {
  _id: string;
  name: string;
  type: string;
  sessionCount: number;
  durationWeeks: number;
  pricePerSession: number;
  totalPrice: number;
  discountPercent: number;
  description?: string;
};

type RecurringBooking = {
  _id: string;
  subject: string;
  planType: string;
  sessionsRemaining: number;
  sessionsCompleted: number;
  sessionsUsed: number[];
  dayOfWeek?: number;
  timeOfDay?: string;
  startDate: string;
  nextBillingDate?: string;
  status: "active" | "paused" | "completed" | "cancelled";
  paymentStatus?: "pending" | "authorized" | "confirmed" | "failed" | "refunded";
  totalPaid: number;
  tutor?: { _id: string; name: string };
  student?: { _id: string; name: string };
  plan?: Plan;
};
type LinkedChild = { studentUser: string; name: string; level?: string };

const C = UI_COLORS;

function money(value: number) {
  return `PKR ${Number(value || 0).toLocaleString("en-PK")}`;
}

function date(value?: string) {
  return value ? new Date(value).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "—";
}

function RecurringLearningContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const tutorId = searchParams.get("tutorId") || "";
  const subject = searchParams.get("subject") || "";
  const tutorName = searchParams.get("tutorName") || "your tutor";
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState({ enabled: false, message: "Recurring plan checkout is not available yet." });
  const [bookings, setBookings] = useState<RecurringBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [children, setChildren] = useState<LinkedChild[]>([]);
  const [selectedChild, setSelectedChild] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const parentRes = user?.role === "parent" ? await api.get("/parent/profile") : null;
      const linkedChildren: LinkedChild[] = (parentRes?.data?.profile?.children || []).map((child: any) => ({ studentUser: String(child.studentUser), name: child.name, level: child.level }));
      if (user?.role === "parent") setChildren(linkedChildren);
      const childId = selectedChild && linkedChildren.some(child => child.studentUser === selectedChild) ? selectedChild : linkedChildren[0]?.studentUser || "";
      if (user?.role === "parent" && childId !== selectedChild) setSelectedChild(childId);
      const [planRes, bookingRes] = await Promise.all([
        api.get("/recurring/plans"),
        user?.role === "tutor" ? api.get("/recurring/tutor-bookings") : api.get("/recurring/my-bookings", { params: childId ? { childId } : undefined }),
      ]);
      setPlans(planRes.data?.plans || []);
      setSubscription(planRes.data?.subscription || { enabled: false, message: "Recurring plan checkout is not available yet." });
      setBookings(bookingRes.data?.bookings || []);
    } catch (error) {
      showError(error, "Unable to load recurring learning plans.");
    } finally {
      setLoading(false);
    }
  }, [selectedChild, setSelectedChild, user]);

  useEffect(() => { if (user) void load(); }, [load, user]);

  const action = async (id: string, verb: "pause" | "resume" | "cancel") => {
    setActionId(id);
    try {
      await api.patch(`/recurring/${id}/${verb}`);
      showSuccess(verb === "cancel" ? "Recurring plan cancelled." : `Recurring plan ${verb}d.`);
      await load();
    } catch (error) {
      showError(error, "Unable to update this recurring plan.");
    } finally {
      setActionId(null);
    }
  };

  const recordSession = async (booking: RecurringBooking) => {
    const next = Array.from({ length: booking.plan?.sessionCount || booking.sessionsCompleted + booking.sessionsRemaining }, (_, i) => i + 1)
      .find((i) => !booking.sessionsUsed.includes(i));
    if (!next) return;
    setActionId(booking._id);
    try {
      await api.patch(`/recurring/${booking._id}/sessions/${next}`);
      showSuccess("Session marked as delivered.");
      await load();
    } catch (error) {
      showError(error, "Unable to record the session.");
    } finally {
      setActionId(null);
    }
  };

  const subscribe = async (plan: Plan) => {
    if (!tutorId || !subject) {
      showError(new Error("Missing tutor"), "Open this page from a tutor profile so the tutor and subject are selected.");
      return;
    }
    setSubmitting(plan._id);
    try {
      await api.post("/recurring/subscribe", { tutorId, subject, planId: plan._id });
      showSuccess(`${plan.name} started with ${tutorName}.`);
      await load();
    } catch (error) {
      showError(error, "Unable to start this recurring plan.");
    } finally {
      setSubmitting(null);
    }
  };

  const activeCount = useMemo(() => bookings.filter((b) => b.status === "active").length, [bookings]);

  if (!user) {
    return <main style={styles.shell}><section style={styles.card}><h1 style={styles.title}>Recurring learning</h1><p style={styles.muted}>Sign in to manage lesson packages and recurring schedules.</p><Link href="/login" style={styles.primary}>Sign in</Link></section></main>;
  }

  return (
    <main style={styles.shell}>
      <header style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>CONTINUE LEARNING</p>
          <h1 style={styles.title}>Recurring lessons, clearly managed.</h1>
          <p style={styles.lede}>Choose a transparent package, track every session, and pause or cancel when your learning plan changes.</p>
        </div>
        <div style={styles.trust}><ShieldCheck size={18} /> No student marketplace fee</div>
      </header>

      {tutorId && subject && (
        <div style={styles.context} role="status"><CalendarDays size={18} /><span>Setting up a plan with <strong>{tutorName}</strong> for <strong>{subject}</strong>.</span></div>
      )}

      {user.role !== "tutor" && (
        <section aria-labelledby="plans-heading">
          <div style={styles.sectionHeader}><div><p style={styles.eyebrow}>PLANS</p><h2 id="plans-heading" style={styles.sectionTitle}>Pick a rhythm that fits</h2></div><Link href="/tutors" style={styles.textLink}>Browse tutors</Link></div>
          {!loading && !subscription.enabled && <div style={styles.notice} role="status"><ShieldCheck size={18} /><span>{subscription.message} <Link href="/tutors" style={styles.textLink}>Find a tutor for a single booking.</Link></span></div>}
          {loading ? <div style={styles.loading}><RefreshCw className="spin" size={20} /> Loading plans…</div> : plans.length === 0 ? <div style={styles.empty}>Recurring plans are being prepared. You can still book individual sessions today.</div> : <div style={styles.grid}>
            {plans.map((plan) => <article key={plan._id} style={styles.planCard}>
              {plan.discountPercent > 0 && <span style={styles.discount}>{plan.discountPercent}% package saving</span>}
              <h3 style={styles.planName}>{plan.name}</h3><p style={styles.muted}>{plan.description || `${plan.sessionCount} sessions over ${plan.durationWeeks} weeks.`}</p>
              <div style={styles.price}>{money(plan.totalPrice)} <small>{money(plan.pricePerSession)}/session</small></div>
              <ul style={styles.features}><li><Check size={15} /> {plan.sessionCount} sessions</li><li><Check size={15} /> Valid for {plan.durationWeeks} weeks</li><li><Check size={15} /> Pause or cancel from your dashboard</li></ul>
              <button type="button" onClick={() => void subscribe(plan)} disabled={!subscription.enabled || submitting !== null} aria-describedby={!subscription.enabled ? "recurring-unavailable" : undefined} style={{ ...styles.primary, width: "100%", opacity: !subscription.enabled || (submitting && submitting !== plan._id) ? 0.55 : 1, cursor: subscription.enabled ? "pointer" : "not-allowed" }}>{submitting === plan._id ? "Starting…" : subscription.enabled ? tutorId && subject ? "Start this plan" : "Choose from a tutor profile" : "Recurring checkout unavailable"}</button>
            </article>)}
          </div>}
          {!subscription.enabled && <span id="recurring-unavailable" style={styles.srOnly}>Recurring checkout is unavailable.</span>}
        </section>
      )}

      <section aria-labelledby="active-heading" style={{ marginTop: "3rem" }}>
        <div style={styles.sectionHeader}><div><p style={styles.eyebrow}>YOUR PLANS · {activeCount} ACTIVE</p><h2 id="active-heading" style={styles.sectionTitle}>{user.role === "tutor" ? "Students on recurring plans" : "Your learning plans"}</h2></div></div>
        {user.role === "parent" && children.length > 0 && <label style={styles.childPicker}><span>Manage plans for</span><select value={selectedChild} onChange={event=>setSelectedChild(event.target.value)}>{children.map(child=><option key={child.studentUser} value={child.studentUser}>{child.name}{child.level?` · ${child.level}`:""}</option>)}</select></label>}
        {user.role === "parent" && !loading && children.length === 0 && <div style={styles.notice} role="status"><ShieldCheck size={18}/><span>Link a student account with their consent before managing recurring plans. <Link href="/parents" style={styles.textLink}>Manage linked students.</Link></span></div>}
        {loading ? <div style={styles.loading}><RefreshCw className="spin" size={20} /> Loading your plans…</div> : bookings.length === 0 ? <div style={styles.empty}>No recurring plans yet. Start with a tutor profile when you are ready for a consistent schedule.</div> : <div style={{ display: "grid", gap: "0.9rem" }}>
          {bookings.map((booking) => <article key={booking._id} style={styles.bookingCard}><div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}><div><h3 style={styles.bookingTitle}>{booking.subject}</h3><p style={styles.muted}>{user.role === "tutor" ? `Student: ${booking.student?.name || "Student"}` : `Tutor: ${booking.tutor?.name || "Tutor"}`} · Started {date(booking.startDate)}</p></div><span style={styles.status}>{booking.status}</span></div><div style={styles.progressRow}><span>{booking.sessionsCompleted} delivered</span><strong>{booking.sessionsRemaining} remaining</strong></div><div style={styles.progress}><span style={{ width: `${Math.min(100, (booking.sessionsCompleted / Math.max(1, booking.sessionsCompleted + booking.sessionsRemaining)) * 100)}%` }} /></div><p style={styles.muted}>Next billing: {date(booking.nextBillingDate)} · Payment: {booking.paymentStatus || "pending"} · Paid: {money(booking.totalPaid)}</p><div style={styles.actions}>{user.role === "tutor" && booking.status === "active" && booking.paymentStatus === "confirmed" && <button type="button" onClick={() => void recordSession(booking)} disabled={actionId === booking._id} style={styles.secondary}>{actionId === booking._id ? "Saving…" : "Mark session delivered"}</button>}{user.role !== "tutor" && booking.status === "active" && <button type="button" onClick={() => void action(booking._id, "pause")} disabled={actionId === booking._id} style={styles.secondary}><Pause size={15} /> Pause</button>}{user.role !== "tutor" && booking.status === "paused" && booking.paymentStatus === "confirmed" && <button type="button" onClick={() => void action(booking._id, "resume")} disabled={actionId === booking._id} style={styles.secondary}><Play size={15} /> Resume</button>}{user.role !== "tutor" && ["active", "paused"].includes(booking.status) && <button type="button" onClick={() => void action(booking._id, "cancel")} disabled={actionId === booking._id} style={styles.danger}><X size={15} /> Cancel plan</button>}</div></article>)}
        </div>}
      </section>
      <style jsx>{`.spin{animation:spin 0.8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion:reduce){.spin{animation:none}}`}</style>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: { maxWidth: 1120, margin: "0 auto", padding: "3rem 1.25rem 5rem", color: C.primary },
  hero: { background: `linear-gradient(135deg, ${C.primary} 0%, #0329B2 68%, #016EF8 100%)`, color: "white", borderRadius: "1.5rem", padding: "2.5rem", display: "flex", justifyContent: "space-between", gap: "2rem", flexWrap: "wrap", marginBottom: "1.5rem" },
  eyebrow: { color: C.accent, fontSize: "0.72rem", letterSpacing: "0.12em", fontWeight: 800, margin: "0 0 0.45rem" },
  title: { fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05, margin: 0, fontWeight: 900 },
  lede: { maxWidth: 620, color: "#dbeafe", lineHeight: 1.65, margin: "0.9rem 0 0" },
  trust: { alignSelf: "flex-end", display: "inline-flex", gap: "0.45rem", alignItems: "center", background: "rgba(255,255,255,.12)", padding: "0.65rem 0.8rem", borderRadius: 999, fontSize: "0.8rem", fontWeight: 700 },
  context: { display: "flex", alignItems: "center", gap: "0.6rem", background: "#eef5ff", border: "1px solid #bfdbfe", padding: "0.9rem 1rem", borderRadius: "0.75rem", marginBottom: "2rem", color: C.primary },
  notice: { display: "flex", alignItems: "center", gap: "0.6rem", background: "#fffbeb", border: "1px solid #fcd34d", padding: "0.9rem 1rem", borderRadius: "0.75rem", marginBottom: "1rem", color: "#713f12" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "end", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" },
  sectionTitle: { margin: 0, fontSize: "1.55rem", fontWeight: 850 },
  textLink: { color: "#0329B2", fontWeight: 800, textDecoration: "none" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "1rem" },
  planCard: { position: "relative", background: "white", border: "1px solid #dbe5f3", borderRadius: "1rem", padding: "1.25rem", boxShadow: "0 8px 25px rgba(2,21,80,.06)" },
  discount: { display: "inline-block", color: "#166534", background: "#dcfce7", borderRadius: 999, padding: "0.25rem 0.55rem", fontSize: "0.7rem", fontWeight: 800, marginBottom: "0.65rem" },
  planName: { margin: 0, fontSize: "1.15rem", fontWeight: 850 },
  price: { color: "#0329B2", fontWeight: 900, fontSize: "1.5rem", margin: "1rem 0 0.75rem" },
  features: { listStyle: "none", padding: 0, margin: "0 0 1.1rem", display: "grid", gap: "0.5rem", color: "#475569", fontSize: "0.8rem" },
  primary: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", background: "#0329B2", color: "white", border: 0, borderRadius: "0.65rem", padding: "0.72rem 1rem", fontWeight: 800, textDecoration: "none", cursor: "pointer", minHeight: 44 },
  secondary: { display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "#eef5ff", color: "#0329B2", border: "1px solid #bfdbfe", borderRadius: "0.55rem", padding: "0.55rem 0.75rem", fontWeight: 800, cursor: "pointer", minHeight: 42 },
  danger: { display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3", borderRadius: "0.55rem", padding: "0.55rem 0.75rem", fontWeight: 800, cursor: "pointer", minHeight: 42 },
  bookingCard: { background: "white", border: "1px solid #dbe5f3", borderRadius: "1rem", padding: "1.15rem", boxShadow: "0 5px 18px rgba(2,21,80,.04)" },
  bookingTitle: { margin: 0, fontWeight: 850, fontSize: "1.05rem" },
  status: { textTransform: "capitalize", background: "#ecfdf5", color: "#166534", padding: "0.3rem 0.6rem", borderRadius: 999, fontSize: "0.72rem", fontWeight: 800, alignSelf: "start" },
  progressRow: { display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#475569", marginTop: "1rem" },
  progress: { background: "#e2e8f0", borderRadius: 999, height: 8, overflow: "hidden", margin: "0.4rem 0 0.7rem" },
  actions: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  childPicker: { display: "grid", gap: "0.35rem", maxWidth: 420, color: "#475569", fontSize: "0.8rem", fontWeight: 800, marginBottom: "1rem" },
  muted: { color: "#64748b", lineHeight: 1.55, fontSize: "0.82rem", margin: "0.35rem 0" },
  loading: { display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", padding: "2.5rem", color: "#64748b" },
  empty: { border: "1px dashed #cbd5e1", background: "#f8fafc", borderRadius: "0.9rem", padding: "2rem", color: "#64748b", textAlign: "center" },
  srOnly: { position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 },
};

export default function RecurringLearningPage() {
  return <Suspense fallback={<main style={styles.shell}><section style={styles.empty}><p style={styles.muted}>Loading recurring learning…</p></section></main>}><RecurringLearningContent /></Suspense>;
}
