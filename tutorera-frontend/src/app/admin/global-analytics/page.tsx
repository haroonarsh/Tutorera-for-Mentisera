"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { UI_COLORS, STATUS_COLORS } from "@/lib/brand";

interface CountryMetrics {
  countryCode: string;
  countryName: string;
  flag?: string;
  launchStatus: string;
  totalTutors: number;
  verifiedTutors: number;
  totalStudents: number;
  totalRequests: number;
  activeRequests: number;
  totalBookings: number;
  totalRevenueUSD: number;
  avgRating: number;
  matchRate: number;
  avgResponseMin: number;
}

interface GlobalSummary {
  totalCountries: number;
  liveCountries: number;
  totalTutors: number;
  totalStudents: number;
  totalBookings: number;
  totalRevenueUSD: number;
  countries: CountryMetrics[];
}

// This page uses a dark-surface layout (UI_COLORS.sidebar backgrounds) that brand.ts has no
// muted-secondary-text token for — TEXT_COLORS is tuned for light backgrounds and would be
// unreadable here. Kept as a single named constant rather than repeated ad-hoc literals.
const MUTED_ON_DARK = "#94a3b8";

const LAUNCH_STATUS_STYLES: Record<string, { bg: string; fg: string }> = {
  live: { bg: `${STATUS_COLORS.success.color}22`, fg: STATUS_COLORS.success.color },
  beta: { bg: `${STATUS_COLORS.warning.color}22`, fg: STATUS_COLORS.warning.color },
  planning: { bg: `${UI_COLORS.accentBright}22`, fg: UI_COLORS.accentBright },
  paused: { bg: `${STATUS_COLORS.danger.color}22`, fg: STATUS_COLORS.danger.color },
};

const PLACEHOLDER_COUNTRIES: CountryMetrics[] = [
  { countryCode: "PK", countryName: "Pakistan", flag: "🇵🇰", launchStatus: "live", totalTutors: 0, verifiedTutors: 0, totalStudents: 0, totalRequests: 0, activeRequests: 0, totalBookings: 0, totalRevenueUSD: 0, avgRating: 0, matchRate: 0, avgResponseMin: 0 },
  { countryCode: "AE", countryName: "United Arab Emirates", flag: "🇦🇪", launchStatus: "beta", totalTutors: 0, verifiedTutors: 0, totalStudents: 0, totalRequests: 0, activeRequests: 0, totalBookings: 0, totalRevenueUSD: 0, avgRating: 0, matchRate: 0, avgResponseMin: 0 },
  { countryCode: "GB", countryName: "United Kingdom", flag: "🇬🇧", launchStatus: "planning", totalTutors: 0, verifiedTutors: 0, totalStudents: 0, totalRequests: 0, activeRequests: 0, totalBookings: 0, totalRevenueUSD: 0, avgRating: 0, matchRate: 0, avgResponseMin: 0 },
  { countryCode: "US", countryName: "United States", flag: "🇺🇸", launchStatus: "planning", totalTutors: 0, verifiedTutors: 0, totalStudents: 0, totalRequests: 0, activeRequests: 0, totalBookings: 0, totalRevenueUSD: 0, avgRating: 0, matchRate: 0, avgResponseMin: 0 },
  { countryCode: "SA", countryName: "Saudi Arabia", flag: "🇸🇦", launchStatus: "planning", totalTutors: 0, verifiedTutors: 0, totalStudents: 0, totalRequests: 0, activeRequests: 0, totalBookings: 0, totalRevenueUSD: 0, avgRating: 0, matchRate: 0, avgResponseMin: 0 },
  { countryCode: "CA", countryName: "Canada", flag: "🇨🇦", launchStatus: "planning", totalTutors: 0, verifiedTutors: 0, totalStudents: 0, totalRequests: 0, activeRequests: 0, totalBookings: 0, totalRevenueUSD: 0, avgRating: 0, matchRate: 0, avgResponseMin: 0 },
  { countryCode: "AU", countryName: "Australia", flag: "🇦🇺", launchStatus: "planning", totalTutors: 0, verifiedTutors: 0, totalStudents: 0, totalRequests: 0, activeRequests: 0, totalBookings: 0, totalRevenueUSD: 0, avgRating: 0, matchRate: 0, avgResponseMin: 0 },
  { countryCode: "IN", countryName: "India", flag: "🇮🇳", launchStatus: "planning", totalTutors: 0, verifiedTutors: 0, totalStudents: 0, totalRequests: 0, activeRequests: 0, totalBookings: 0, totalRevenueUSD: 0, avgRating: 0, matchRate: 0, avgResponseMin: 0 },
];

export default function GlobalAnalyticsPage() {
  const [data, setData] = useState<GlobalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/admin/global-analytics");
      setData(res.data);
    } catch {
      setError("Global analytics could not be loaded. No placeholder data is shown.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredCountries = data?.countries.filter(
    c => statusFilter === "all" || c.launchStatus === statusFilter
  ) || [];

  const cardStyle: React.CSSProperties = { background: UI_COLORS.sidebar, border: `1px solid ${UI_COLORS.sidebarBorder}`, borderRadius: 10, padding: "16px 20px", flex: 1, minWidth: 160 };
  const metricLabel: React.CSSProperties = { fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.06em", color: MUTED_ON_DARK, marginBottom: 2 };

  return (
    <div style={{ padding: "32px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 12 }}>🌍 Global Analytics</h2>
          <p style={{ margin: "4px 0 0", color: MUTED_ON_DARK, fontSize: "0.875rem" }}>Cross-country performance metrics and market health</p>
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${UI_COLORS.sidebarBorder}`, background: UI_COLORS.sidebar, color: UI_COLORS.surface, fontSize: "0.875rem" }}>
          <option value="all">All Markets</option>
          <option value="live">Live</option>
          <option value="beta">Beta</option>
          <option value="planning">Planning</option>
          <option value="paused">Paused</option>
        </select>
      </div>

      {error && <div role="alert" style={{ background: `${STATUS_COLORS.warning.color}22`, border: `1px solid ${STATUS_COLORS.warning.color}`, borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: STATUS_COLORS.warning.color, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}><span>{error}</span><button type="button" onClick={fetchData} style={{ minHeight: 36, border: `1px solid ${STATUS_COLORS.warning.color}`, borderRadius: 6, background: "transparent", color: STATUS_COLORS.warning.color, fontWeight: 700, cursor: "pointer", padding: "0 10px" }}>Try again</button></div>}

      {loading ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: MUTED_ON_DARK }}>Loading…</div>
      ) : data ? (
        <>
          {/* Summary Row */}
          <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
            <div style={cardStyle}>
              <div style={metricLabel}>Markets</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{data.totalCountries}</div>
              <div style={{ fontSize: "0.8rem", color: MUTED_ON_DARK }}>{data.liveCountries} live</div>
            </div>
            <div style={cardStyle}>
              <div style={metricLabel}>Total Tutors</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{data.totalTutors.toLocaleString()}</div>
            </div>
            <div style={cardStyle}>
              <div style={metricLabel}>Total Students</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{data.totalStudents.toLocaleString()}</div>
            </div>
            <div style={cardStyle}>
              <div style={metricLabel}>Total Bookings</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{data.totalBookings.toLocaleString()}</div>
            </div>
            <div style={cardStyle}>
              <div style={metricLabel}>Revenue</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: STATUS_COLORS.warning.color, paddingTop: "0.45rem" }}>Not aggregated across currencies</div>
            </div>
          </div>

          {/* Per-Country Cards */}
          <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 16 }}>Market Breakdown</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {filteredCountries.map((c) => {
              const statusColor = LAUNCH_STATUS_STYLES[c.launchStatus] || { bg: UI_COLORS.sidebarBorder, fg: MUTED_ON_DARK };
              return (
                <div key={c.countryCode} style={{ background: UI_COLORS.sidebar, border: `1px solid ${UI_COLORS.sidebarBorder}`, borderRadius: 10, padding: 24, position: "relative" }}>
                  {/* Status chip */}
                  <span style={{ position: "absolute", top: 12, right: 12, display: "inline-block", padding: "2px 10px", borderRadius: 12, fontSize: "0.72rem", fontWeight: 600, background: statusColor.bg, color: statusColor.fg, border: `1px solid ${statusColor.fg}44` }}>{c.launchStatus}</span>

                  {/* Country header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <span style={{ fontSize: 28 }}>{c.flag || "🌐"}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{c.countryName}</div>
                      <div style={{ fontSize: "0.8rem", color: MUTED_ON_DARK }}>{c.countryCode}</div>
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
                    <div>
                      <div style={metricLabel}>Tutors</div>
                      <div style={{ fontWeight: 700 }}>{c.totalTutors} <span style={{ fontSize: "0.8rem", color: MUTED_ON_DARK }}>({c.verifiedTutors} verified)</span></div>
                    </div>
                    <div>
                      <div style={metricLabel}>Students</div>
                      <div style={{ fontWeight: 700 }}>{c.totalStudents}</div>
                    </div>
                    <div>
                      <div style={metricLabel}>Requests</div>
                      <div style={{ fontWeight: 700 }}>{c.totalRequests} <span style={{ fontSize: "0.8rem", color: MUTED_ON_DARK }}>({c.activeRequests} active)</span></div>
                    </div>
                    <div>
                      <div style={metricLabel}>Bookings</div>
                      <div style={{ fontWeight: 700 }}>{c.totalBookings}</div>
                    </div>
                    <div>
                      <div style={metricLabel}>Revenue</div>
                      <div style={{ fontWeight: 700, color: MUTED_ON_DARK }}>See market finance reports</div>
                    </div>
                    <div>
                      <div style={metricLabel}>Match Rate</div>
                      <div style={{ fontWeight: 700 }}>{c.matchRate}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : <div style={{ textAlign: "center", padding: "48px 0", color: MUTED_ON_DARK }}>No analytics data is available right now.</div>}
    </div>
  );
}
