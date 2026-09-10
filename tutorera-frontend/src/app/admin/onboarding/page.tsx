"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, Users, BookOpen, ArrowRight, Search, HeartHandshake } from "lucide-react";
import api from "@/lib/axios";
import { showError } from "@/lib/toast";

type TutorRow = { userId: string; profileId: string | null; name: string; email: string; countryCode?: string; city?: string; applicationId?: string; phase: string; onboardingStep: number; onboardingComplete: boolean; marketplaceEligible: boolean; homeTuitionEligible: boolean; lastUpdatedAt: string };
type StudentRow = { userId: string; name: string; email: string; countryCode?: string; city?: string; phase: string; onboardingComplete: boolean; requestCount: number; lastRequestAt?: string; lastUpdatedAt: string };
type ParentRow = { userId: string; name: string; email: string; countryCode?: string; city?: string; phase: string; linkedLearners: number; approvalRequiredForBookings: boolean; lastUpdatedAt: string };

const tutorLabels: Record<string, string> = {
  APPLICATION_STARTED: "Started", DOCUMENTS_REQUIRED: "Documents required", APPLICATION_SUBMITTED: "Submitted", UNDER_REVIEW: "Under review", ACTION_REQUIRED: "Action required", VERIFICATION_IN_PROGRESS: "Verification in progress", APPROVED_FOR_MARKETPLACE: "Marketplace active", HOME_TUITION_VERIFICATION_REQUIRED: "Home verification pending", HOME_TUITION_ELIGIBLE: "Home tuition eligible", REJECTED: "Rejected", SUSPENDED: "Suspended", RE_VERIFICATION_REQUIRED: "Re-verification required",
};
const studentLabels: Record<string, string> = { REGISTERED: "Registered", PROFILE_STARTED: "Profile started", READY_TO_POST: "Ready to post", ACTIVE_REQUESTER: "Active requester" };
const parentLabels: Record<string, string> = { REGISTERED: "Registered", PROFILE_STARTED: "Profile started", LEARNER_LINKED: "Learner linked" };
const date = (value?: string) => value ? new Date(value).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function AdminOnboardingPage() {
  const [tab, setTab] = useState<"tutors" | "students" | "parents">("tutors");
  const [tutors, setTutors] = useState<TutorRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [parents, setParents] = useState<ParentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState("");
  const [search, setSearch] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [summary, setSummary] = useState<Record<string, number>>({});

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (phase) params.set("phase", phase);
      if (search.trim()) params.set("search", search.trim());
      if (countryCode.trim()) params.set("countryCode", countryCode.trim().toUpperCase());
      const endpoint = `/admin/onboarding/${tab}?${params.toString()}`;
      const response = await api.get(endpoint);
      setSummary(response.data.summary || {});
      if (tab === "tutors") setTutors(response.data.rows || []); else if (tab === "students") setStudents(response.data.rows || []); else setParents(response.data.rows || []);
    } catch (error) { showError(error, "Unable to load onboarding operations"); }
    finally { setLoading(false); }
  };
  useEffect(() => { setPhase(""); setSearch(""); }, [tab]);
  useEffect(() => { load(); }, [tab, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const tabStyle = (active: boolean): React.CSSProperties => ({ border: 0, borderBottom: active ? "3px solid #016EF8" : "3px solid transparent", background: "transparent", color: active ? "#021550" : "#64748b", fontWeight: 800, padding: "12px 16px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 });
  return <main style={{ padding: 24, maxWidth: 1240, margin: "0 auto" }}>
    <header style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
      <div><p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: ".12em", color: "#0329B2" }}>OPERATIONS · ONBOARDING</p><h1 style={{ margin: "6px 0", color: "#021550", fontSize: 28 }}>Application pipeline</h1><p style={{ margin: 0, color: "#52627e" }}>Track tutors, students, and parents from registration to marketplace readiness.</p></div>
      <button type="button" onClick={load} disabled={loading} style={button}><RefreshCw size={16} /> Refresh</button>
    </header>
    <section style={card}><div style={{ borderBottom: "1px solid #e2e8f0" }}><button type="button" onClick={() => setTab("tutors")} style={tabStyle(tab === "tutors")}><BookOpen size={17}/>Tutor onboarding</button><button type="button" onClick={() => setTab("students")} style={tabStyle(tab === "students")}><Users size={17}/>Student onboarding</button><button type="button" onClick={() => setTab("parents")} style={tabStyle(tab === "parents")}><HeartHandshake size={17}/>Parent onboarding</button></div>
      <div style={{ padding: 16, borderBottom: "1px solid #e2e8f0", background: "#fbfdff" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 14 }}>
          {Object.entries(summary).map(([key, count]) => <button type="button" key={key} onClick={() => setPhase(phase === key ? "" : key)} style={{ textAlign: "left", border: phase === key ? "2px solid #016EF8" : "1px solid #dbe5f3", background: "#fff", padding: 10, borderRadius: 10, cursor: "pointer" }}><span style={{ display: "block", color: "#52627e", fontSize: 11, fontWeight: 800 }}>{(tab === "tutors" ? tutorLabels : tab === "students" ? studentLabels : parentLabels)[key] || key}</span><strong style={{ fontSize: 20, color: "#021550" }}>{count}</strong></button>)}
        </div>
        <form onSubmit={(event) => { event.preventDefault(); load(); }} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><label style={{ flex: "1 1 280px", display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #cbd5e1", borderRadius: 9, padding: "0 10px" }}><Search size={15} color="#64748b"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, city, or application ID" style={{ border: 0, outline: 0, width: "100%", padding: 10, fontSize: 13 }}/></label><label style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #cbd5e1", borderRadius: 9, padding: "0 10px", color: "#52627e", fontSize: 12, fontWeight: 700 }}>Market<input value={countryCode} onChange={(event) => setCountryCode(event.target.value.toUpperCase().slice(0, 2))} placeholder="PK" aria-label="Filter by two-letter country code" style={{ width: 38, border: 0, outline: 0, padding: 10, fontWeight: 800, textTransform: "uppercase" }}/></label><button type="submit" style={button}>Search</button></form>
      </div>
      {loading ? <p style={empty}>Loading application phases…</p> : tab === "tutors" ? <TutorTable rows={tutors}/> : tab === "students" ? <StudentTable rows={students}/> : <ParentTable rows={parents}/>}
    </section>
  </main>;
}

function TutorTable({ rows }: { rows: TutorRow[] }) { return <div style={{ overflowX: "auto" }}><table style={table}><thead><tr>{["Tutor", "Phase", "Step", "Location", "Visibility", "Updated", ""].map((x) => <th key={x} style={th}>{x}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row) => <tr key={row.userId}><td style={td}><strong>{row.name}</strong><small style={small}>{row.email} · {row.applicationId || "No application ID"}</small></td><td style={td}><Pill value={tutorLabels[row.phase] || row.phase}/></td><td style={td}>Step {row.onboardingStep}/5 {row.onboardingComplete ? "· complete" : ""}</td><td style={td}>{row.city || "—"}{row.countryCode ? `, ${row.countryCode}` : ""}</td><td style={td}>{row.marketplaceEligible ? "Marketplace active" : row.homeTuitionEligible ? "Home active" : "Not visible"}</td><td style={td}>{date(row.lastUpdatedAt)}</td><td style={td}>{row.profileId && <Link href={`/admin/applications/${row.profileId}`} style={link}>Review <ArrowRight size={14}/></Link>}</td></tr>) : <tr><td style={empty} colSpan={7}>No tutor onboarding records found.</td></tr>}</tbody></table></div>; }
function StudentTable({ rows }: { rows: StudentRow[] }) { return <div style={{ overflowX: "auto" }}><table style={table}><thead><tr>{["Student", "Phase", "Profile", "Requests", "Location", "Updated", ""].map((x) => <th key={x} style={th}>{x}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row) => <tr key={row.userId}><td style={td}><strong>{row.name}</strong><small style={small}>{row.email}</small></td><td style={td}><Pill value={studentLabels[row.phase] || row.phase}/></td><td style={td}>{row.onboardingComplete ? "Complete" : "In progress"}</td><td style={td}>{row.requestCount}{row.lastRequestAt ? ` · last ${date(row.lastRequestAt)}` : ""}</td><td style={td}>{row.city || "—"}{row.countryCode ? `, ${row.countryCode}` : ""}</td><td style={td}>{date(row.lastUpdatedAt)}</td><td style={td}><Link href={`/admin/students`} style={link}>Open student <ArrowRight size={14}/></Link></td></tr>) : <tr><td style={empty} colSpan={7}>No student onboarding records found.</td></tr>}</tbody></table></div>; }
function ParentTable({ rows }: { rows: ParentRow[] }) { return <div style={{ overflowX: "auto" }}><table style={table}><thead><tr>{["Parent / guardian", "Phase", "Learners", "Booking approval", "Location", "Updated", ""].map((x) => <th key={x} style={th}>{x}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row) => <tr key={row.userId}><td style={td}><strong>{row.name}</strong><small style={small}>{row.email}</small></td><td style={td}><Pill value={parentLabels[row.phase] || row.phase}/></td><td style={td}>{row.linkedLearners}</td><td style={td}>{row.approvalRequiredForBookings ? "Required" : "Optional"}</td><td style={td}>{row.city || "—"}{row.countryCode ? `, ${row.countryCode}` : ""}</td><td style={td}>{date(row.lastUpdatedAt)}</td><td style={td}><Link href="/admin/students" style={link}>Open accounts <ArrowRight size={14}/></Link></td></tr>) : <tr><td style={empty} colSpan={7}>No parent onboarding records found.</td></tr>}</tbody></table></div>; }
function Pill({ value }: { value: string }) { return <span style={{ display: "inline-block", borderRadius: 999, padding: "4px 8px", background: "#eff6ff", color: "#0329B2", fontSize: 12, fontWeight: 800 }}>{value}</span>; }
const card: React.CSSProperties = { background: "#fff", border: "1px solid #dbe5f3", borderRadius: 16, overflow: "hidden", boxShadow: "0 6px 24px rgba(2,21,80,.05)" };
const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", minWidth: 920 };
const th: React.CSSProperties = { textAlign: "left", color: "#52627e", fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", padding: "13px 16px", background: "#f8faff", borderBottom: "1px solid #e2e8f0" };
const td: React.CSSProperties = { padding: "14px 16px", color: "#263652", fontSize: 13, borderBottom: "1px solid #edf2f7", verticalAlign: "middle" };
const small: React.CSSProperties = { display: "block", color: "#64748b", marginTop: 3, fontSize: 12 };
const empty: React.CSSProperties = { padding: 32, textAlign: "center", color: "#64748b" };
const button: React.CSSProperties = { alignSelf: "center", display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid #b9c9e2", background: "#fff", color: "#021550", padding: "10px 14px", borderRadius: 10, fontWeight: 800, cursor: "pointer" };
const link: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 4, color: "#0329B2", fontWeight: 800, textDecoration: "none", whiteSpace: "nowrap" };
