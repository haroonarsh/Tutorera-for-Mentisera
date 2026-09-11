"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HeartHandshake, ArrowLeft, RefreshCw, Search, Users,
  CheckCircle, AlertCircle, ShieldCheck, ExternalLink, Calendar,
} from "lucide-react";
import api from "@/lib/axios";

interface ParentRow {
  userId: string;
  profileId: string | null;
  name: string;
  email: string;
  countryCode: string | null;
  city: string | null;
  phase: "REGISTERED" | "PROFILE_STARTED" | "LEARNER_LINKED";
  linkedLearners: number;
  approvalRequiredForBookings: boolean;
  accountStatus: string;
  lastUpdatedAt: string;
  createdAt: string;
}

interface ParentSummary {
  REGISTERED?: number;
  PROFILE_STARTED?: number;
  LEARNER_LINKED?: number;
}

export default function ParentsDirectoryPage() {
  const [parents, setParents] = useState<ParentRow[]>([]);
  const [summary, setSummary] = useState<ParentSummary>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [phaseFilter, setPhaseFilter] = useState<string>("ALL");

  const fetchParents = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/onboarding/parents?limit=100");
      if (res.data?.success) {
        setParents(res.data.rows || []);
        setSummary(res.data.summary || {});
      }
    } catch (err) {
      console.error("Failed to load parents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParents();
  }, []);

  const totalParents = parents.length;
  const totalLearners = parents.reduce((acc, p) => acc + (p.linkedLearners || 0), 0);
  const learnerLinkedCount = summary.LEARNER_LINKED || parents.filter(p => p.phase === "LEARNER_LINKED").length;
  const consentRequiredCount = parents.filter(p => p.approvalRequiredForBookings).length;

  const filtered = parents.filter((p) => {
    if (phaseFilter !== "ALL" && p.phase !== phaseFilter) return false;
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.email && p.email.toLowerCase().includes(term)) ||
      (p.city && p.city.toLowerCase().includes(term)) ||
      (p.countryCode && p.countryCode.toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ padding: "1.75rem 2rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Breadcrumb & Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link href="/admin" style={{ color: "#64748b", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.82rem", fontWeight: 700 }}>
              <ArrowLeft size={14} /> Control Tower
            </Link>
            <span style={{ color: "#cbd5e1" }}>/</span>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0329b2" }}>Parents & Guardians</span>
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 900, color: "#0f172a", margin: 0 }}>
            Parents & Guardians Directory
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "0.25rem 0 0" }}>
            Monitor parent accounts, linked child learners, guardian booking approvals, and onboarding progression.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <Link
            href="/admin/onboarding?tab=parents"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.55rem 0.95rem",
              borderRadius: "0.5rem",
              background: "#021550",
              color: "#ffffff",
              fontSize: "0.82rem",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 2px 4px rgba(2,21,80,0.2)",
            }}
          >
            <Users size={15} />
            Parent Pipeline
          </Link>
          <button
            onClick={fetchParents}
            disabled={loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.55rem 0.9rem",
              borderRadius: "0.5rem",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              color: "#334155",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>Total Parents</span>
            <span style={{ padding: "0.3rem", borderRadius: "0.4rem", background: "#eff6ff", color: "#0329b2" }}><HeartHandshake size={16} /></span>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#0f172a" }}>{loading ? "..." : totalParents}</div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>Registered guardian accounts</div>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>Learners Linked</span>
            <span style={{ padding: "0.3rem", borderRadius: "0.4rem", background: "#ecfdf5", color: "#059669" }}><CheckCircle size={16} /></span>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#059669" }}>{loading ? "..." : learnerLinkedCount}</div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>{totalLearners} child student profiles active</div>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>Profile Started</span>
            <span style={{ padding: "0.3rem", borderRadius: "0.4rem", background: "#fffbeb", color: "#d97706" }}><AlertCircle size={16} /></span>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#d97706" }}>{loading ? "..." : (summary.PROFILE_STARTED || 0)}</div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>Profile created, pending child link</div>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>Guardian Consent</span>
            <span style={{ padding: "0.3rem", borderRadius: "0.4rem", background: "#f5f3ff", color: "#7c3aed" }}><ShieldCheck size={16} /></span>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#7c3aed" }}>{loading ? "..." : consentRequiredCount}</div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>Mandatory booking sign-off</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1rem 1.25rem", marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {[
            { id: "ALL", label: "All Parents", count: totalParents },
            { id: "LEARNER_LINKED", label: "Learner Linked", count: summary.LEARNER_LINKED || 0 },
            { id: "PROFILE_STARTED", label: "Profile Started", count: summary.PROFILE_STARTED || 0 },
            { id: "REGISTERED", label: "Registered Only", count: summary.REGISTERED || 0 },
          ].map((tab) => {
            const active = phaseFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setPhaseFilter(tab.id)}
                style={{
                  padding: "0.45rem 0.85rem",
                  borderRadius: "999px",
                  fontSize: "0.78rem",
                  fontWeight: active ? 800 : 600,
                  border: active ? "1px solid #0329b2" : "1px solid #e2e8f0",
                  background: active ? "#0329b2" : "#f8fafc",
                  color: active ? "#ffffff" : "#475569",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  transition: "all 150ms ease",
                }}
              >
                <span>{tab.label}</span>
                <span style={{ fontSize: "0.7rem", opacity: 0.85 }}>({tab.count})</span>
              </button>
            );
          })}
        </div>

        <div style={{ position: "relative", minWidth: "260px" }}>
          <Search size={15} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Search parent name, email, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem 0.85rem 0.5rem 2.2rem",
              borderRadius: "0.5rem",
              border: "1px solid #cbd5e1",
              fontSize: "0.82rem",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Parents Table */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0.75rem", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 0.75rem" }} />
            <p style={{ fontSize: "0.9rem", fontWeight: 600 }}>Loading parents directory...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <Users size={32} style={{ margin: "0 auto 0.75rem", opacity: 0.4 }} />
            <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>No parents found</p>
            <p style={{ fontSize: "0.82rem", margin: "0.25rem 0 0" }}>
              {search || phaseFilter !== "ALL" ? "Try adjusting your search query or phase filter." : "No parent accounts registered in this scope yet."}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 700 }}>
                  <th style={{ padding: "0.75rem 1rem" }}>Parent Name</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Contact / Location</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Readiness Phase</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Linked Learners</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Consent Rules</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Joined</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const phaseColor =
                    p.phase === "LEARNER_LINKED"
                      ? { bg: "#ecfdf5", text: "#065f46", border: "#a7f3d0" }
                      : p.phase === "PROFILE_STARTED"
                      ? { bg: "#fffbeb", text: "#92400e", border: "#fde68a" }
                      : { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" };

                  return (
                    <tr key={p.userId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={{ width: "26px", height: "26px", borderRadius: "999px", background: "#eff6ff", color: "#0329b2", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800 }}>
                            {p.name?.charAt(0)?.toUpperCase() || "P"}
                          </span>
                          {p.name || "Unnamed Parent"}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.15rem", paddingLeft: "30px" }}>
                          {p.email}
                        </div>
                      </td>
                      <td style={{ padding: "0.85rem 1rem", color: "#334155" }}>
                        <div>{p.city || "City not set"}</div>
                        <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{p.countryCode || "PK"}</div>
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.2rem 0.55rem",
                            borderRadius: "999px",
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            background: phaseColor.bg,
                            color: phaseColor.text,
                            border: `1px solid ${phaseColor.border}`,
                          }}
                        >
                          {p.phase.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span style={{ fontWeight: 800, color: p.linkedLearners > 0 ? "#059669" : "#64748b" }}>
                          {p.linkedLearners} {p.linkedLearners === 1 ? "Learner" : "Learners"}
                        </span>
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        {p.approvalRequiredForBookings ? (
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#7c3aed", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                            <ShieldCheck size={13} /> Required
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Standard</span>
                        )}
                      </td>
                      <td style={{ padding: "0.85rem 1rem", color: "#64748b", fontSize: "0.75rem" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                          <Calendar size={12} />
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}
                        </div>
                      </td>
                      <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                        <Link
                          href={`/admin/onboarding?tab=parents&search=${encodeURIComponent(p.name || p.email)}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            padding: "0.35rem 0.65rem",
                            borderRadius: "0.4rem",
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            color: "#0329b2",
                            textDecoration: "none",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                          }}
                        >
                          Triage <ExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
