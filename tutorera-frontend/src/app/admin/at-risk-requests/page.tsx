"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle, RefreshCw, ArrowLeft, Search, Filter,
  Clock, CheckCircle, Sparkles, AlertCircle,
} from "lucide-react";
import api from "@/lib/axios";
import { showSuccess, showError } from "@/lib/toast";
import { UI_COLORS, STATUS_COLORS, TEXT_COLORS } from "@/lib/brand";

interface AtRiskItem {
  request: {
    _id: string;
    subject: string;
    level: string;
    budget: number;
    currency?: string;
    city?: string;
    teachingMode: string;
    createdAt: string;
    expiresAt?: string;
    student: { _id?: string; name: string; email?: string; phone?: string; city?: string };
  };
  riskReasons: string[];
  urgencyLevel: "critical" | "high" | "medium";
  urgencyScore: number;
  offersCount: number;
  hoursSinceCreated: number;
  hoursUntilExpiry: number;
  recommendedAction: "rematch" | "extend" | "suggest_online" | "escalate";
}

function AtRiskRequestsContent() {
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get("filter") as "all" | "zero_offers" | "expiring" | "low_liquidity" | null;

  const [items, setItems] = useState<AtRiskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "zero_offers" | "expiring" | "low_liquidity">(
    urlFilter === "zero_offers" || urlFilter === "expiring" || urlFilter === "low_liquidity" ? urlFilter : "all"
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const f = searchParams.get("filter") as "all" | "zero_offers" | "expiring" | "low_liquidity" | null;
    if (f && (f === "zero_offers" || f === "expiring" || f === "low_liquidity")) {
      setFilter(f);
    }
  }, [searchParams]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/at-risk/requests");
      setItems(res.data.items || []);
    } catch (err) {
      console.error("Failed to load at-risk requests:", err);
      showError("Failed to fetch at-risk requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAction = async (requestId: string, action: string) => {
    setActionLoading(`${requestId}-${action}`);
    try {
      const res = await api.post(`/admin/at-risk/requests/${requestId}/action`, { action });
      showSuccess(res.data.message || "Rescue action executed.");
      fetchItems();
    } catch {
      showError("Action failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = items.filter((item) => {
    if (filter === "zero_offers" && item.offersCount > 0) return false;
    if (filter === "expiring" && item.hoursUntilExpiry > 24) return false;
    if (filter === "low_liquidity" && item.offersCount > 1) return false;

    if (!search) return true;
    const term = search.toLowerCase();
    const req = item.request;
    return (
      req.subject.toLowerCase().includes(term) ||
      req.student?.name?.toLowerCase().includes(term) ||
      req.city?.toLowerCase().includes(term)
    );
  });

  return (
    <div style={{ padding: "1.75rem 2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link href="/admin" style={{ color: TEXT_COLORS.muted, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.82rem", fontWeight: 700 }}>
              <ArrowLeft size={14} /> Control Tower
            </Link>
            <span style={{ color: UI_COLORS.border }}>/</span>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: STATUS_COLORS.warning.color }}>Student Demand</span>
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: TEXT_COLORS.body, margin: 0 }}>
            At-Risk Student Request Queue
          </h1>
          <p style={{ color: TEXT_COLORS.muted, fontSize: "0.85rem", margin: "0.2rem 0 0" }}>
            Intelligent liquidity detection to prevent valid student demand from silently failing.
          </p>
        </div>

        <button
          onClick={fetchItems}
          disabled={loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.55rem 0.9rem",
            backgroundColor: UI_COLORS.surface,
            border: `1px solid ${UI_COLORS.border}`,
            borderRadius: "0.4rem",
            fontSize: "0.82rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh Queue
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ backgroundColor: UI_COLORS.surface, borderRadius: "0.75rem", padding: "1rem", border: `1px solid ${UI_COLORS.border}`, marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {[
            { id: "all", label: `All At-Risk (${items.length})` },
            { id: "zero_offers", label: "0 Offers > 24h" },
            { id: "expiring", label: "Expiring < 24h" },
            { id: "low_liquidity", label: "Low Liquidity (≤1 Offer)" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "999px",
                fontSize: "0.78rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                backgroundColor: filter === f.id ? TEXT_COLORS.body : STATUS_COLORS.neutral.bg,
                color: filter === f.id ? UI_COLORS.surface : TEXT_COLORS.secondary,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ position: "relative", minWidth: "240px" }}>
          <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: TEXT_COLORS.muted }} />
          <input
            type="text"
            placeholder="Search subject, student, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.45rem 0.75rem 0.45rem 2.2rem",
              borderRadius: "0.4rem",
              border: `1px solid ${UI_COLORS.border}`,
              fontSize: "0.82rem",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Requests Table / Cards */}
      <div style={{ backgroundColor: UI_COLORS.surface, borderRadius: "0.75rem", border: `1px solid ${UI_COLORS.border}`, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: TEXT_COLORS.muted }}>Loading At-Risk Queue…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: STATUS_COLORS.success.color }}>
            <CheckCircle size={36} style={{ margin: "0 auto 0.75rem" }} />
            <strong style={{ display: "block", fontSize: "1rem" }}>No requests matching current filter!</strong>
            <span style={{ fontSize: "0.82rem", color: TEXT_COLORS.muted }}>Marketplace liquidity is currently stable across this segment.</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filtered.map((item, idx) => (
              <div
                key={item.request._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1.2rem 1.4rem",
                  borderBottom: idx < filtered.length - 1 ? `1px solid ${STATUS_COLORS.neutral.bg}` : "none",
                  flexWrap: "wrap",
                  gap: "1.25rem",
                }}
              >
                {/* Left info */}
                <div style={{ flex: 1, minWidth: "280px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: TEXT_COLORS.body, margin: 0 }}>
                      {item.request.subject}
                    </h3>
                    <span style={{ fontSize: "0.72rem", background: UI_COLORS.accentLight, color: UI_COLORS.accent, padding: "0.15rem 0.5rem", borderRadius: "999px", fontWeight: 700 }}>
                      {item.request.level}
                    </span>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "999px",
                        fontWeight: 800,
                        backgroundColor:
                          item.urgencyLevel === "critical"
                            ? STATUS_COLORS.danger.bg
                            : item.urgencyLevel === "high"
                            ? STATUS_COLORS.warning.bg
                            : STATUS_COLORS.warning.bg,
                        color:
                          item.urgencyLevel === "critical"
                            ? STATUS_COLORS.danger.color
                            : item.urgencyLevel === "high"
                            ? STATUS_COLORS.warning.color
                            : STATUS_COLORS.warning.color,
                      }}
                    >
                      Urgency Score: {item.urgencyScore}
                    </span>
                  </div>

                  <div style={{ fontSize: "0.8rem", color: TEXT_COLORS.muted, display: "flex", gap: "1.2rem", flexWrap: "wrap" }}>
                    <span>Student: <strong style={{ color: TEXT_COLORS.body }}>{item.request.student?.name}</strong></span>
                    <span>City: <strong style={{ color: TEXT_COLORS.body }}>{item.request.city || "Online"}</strong></span>
                    <span>Mode: <strong style={{ color: TEXT_COLORS.body }}>{item.request.teachingMode}</strong></span>
                    <span>Rate: <strong style={{ color: TEXT_COLORS.body }}>{item.request.currency || "PKR"} {item.request.budget?.toLocaleString()}</strong></span>
                    <span>Offers: <strong style={{ color: item.offersCount === 0 ? STATUS_COLORS.danger.color : STATUS_COLORS.success.color }}>{item.offersCount}</strong></span>
                    <span>Active: <strong>{item.hoursSinceCreated}h</strong></span>
                    <span>Expires in: <strong style={{ color: item.hoursUntilExpiry <= 24 ? STATUS_COLORS.danger.color : TEXT_COLORS.body }}>{item.hoursUntilExpiry}h</strong></span>
                  </div>

                  {/* Badges */}
                  <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                    {item.riskReasons.map((r) => (
                      <span
                        key={r}
                        style={{
                          fontSize: "0.7rem",
                          background: STATUS_COLORS.danger.bg,
                          color: STATUS_COLORS.danger.color,
                          border: `1px solid ${STATUS_COLORS.danger.border}`,
                          padding: "0.15rem 0.5rem",
                          borderRadius: "4px",
                          fontWeight: 600,
                        }}
                      >
                        ⚠️ {r}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right Action buttons */}
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button
                    onClick={() => handleAction(item.request._id, "rematch")}
                    disabled={actionLoading === `${item.request._id}-rematch`}
                    title="Notify top matched & secondary tier tutors"
                    style={{
                      padding: "0.45rem 0.85rem",
                      backgroundColor: STATUS_COLORS.success.bg,
                      color: STATUS_COLORS.success.color,
                      border: `1px solid ${STATUS_COLORS.success.border}`,
                      borderRadius: "0.4rem",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ⚡ Rematch Pool
                  </button>
                  <button
                    onClick={() => handleAction(item.request._id, "extend")}
                    disabled={actionLoading === `${item.request._id}-extend`}
                    title="Add 7 days to request expiry"
                    style={{
                      padding: "0.45rem 0.85rem",
                      backgroundColor: UI_COLORS.accentLight,
                      color: STATUS_COLORS.info.color,
                      border: `1px solid ${STATUS_COLORS.info.border}`,
                      borderRadius: "0.4rem",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    + 7d Expiry
                  </button>
                  <button
                    onClick={() => handleAction(item.request._id, "suggest_online")}
                    disabled={actionLoading === `${item.request._id}-suggest_online`}
                    title="Proactively recommend online tuition conversion"
                    style={{
                      padding: "0.45rem 0.85rem",
                      backgroundColor: STATUS_COLORS.warning.bg,
                      color: STATUS_COLORS.warning.color,
                      border: `1px solid ${STATUS_COLORS.warning.border}`,
                      borderRadius: "0.4rem",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    💡 Propose Online
                  </button>
                  <button
                    onClick={() => handleAction(item.request._id, "escalate")}
                    disabled={actionLoading === `${item.request._id}-escalate`}
                    title="Escalate to human concierge team"
                    style={{
                      padding: "0.45rem 0.85rem",
                      backgroundColor: STATUS_COLORS.danger.bg,
                      color: STATUS_COLORS.danger.color,
                      border: `1px solid ${STATUS_COLORS.danger.border}`,
                      borderRadius: "0.4rem",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    🚨 Escalate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default function AtRiskRequestsPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading At-Risk Requests...</div>}>
      <AtRiskRequestsContent />
    </Suspense>
  );
}
