"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles, Sliders, TrendingUp, Award, ShieldCheck, CheckCircle2,
  AlertCircle, Save, Layers, Zap, Play, Send, ExternalLink, Clock,
  BarChart2, RefreshCw, Check, X, Shield, ArrowRight, BookOpen,
  Users, Search, Filter, History, RotateCcw, ChevronRight
} from "lucide-react";
import api from "@/lib/axios";
import { showSuccess, showError } from "@/lib/toast";
import MatchScoreBadge from "@/components/marketplace/MatchScoreBadge";
import { tutorProfileHref } from "@/lib/tutor-directory";
import { useAuth } from "@/context/AuthContext";
import AvatarImage from "@/components/Common/AvatarImage";
import { AdminDialog } from "@/components/admin/AdminUI";

interface MatchAnalytics {
  totalMatches: number;
  avgMatchScore: number | null;
  totalOffers: number;
  totalBookings: number;
  offerConversionRate: number;
  bookingConversionRate: number;
  avgStudentResponseMinutes: number | null;
  generatedAt: string;
  hasData: boolean;
  activeRequestsCount?: number;
  verifiedTutorsCount?: number;
  engineStatus?: string;
  tierDistribution: {
    excellent: number;
    great: number;
    good: number;
    fair: number;
  };
}

interface AnalyticsFilters {
  dateFrom: string;
  dateTo: string;
  mode: string;
  algorithmVersion: string;
  countryCode: string;
  city: string;
  subject: string;
}

const EMPTY_ANALYTICS_FILTERS: AnalyticsFilters = {
  dateFrom: "",
  dateTo: "",
  mode: "",
  algorithmVersion: "",
  countryCode: "",
  city: "",
  subject: "",
};

export default function AdminMatchingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"analytics" | "simulator" | "weights">("analytics");
  const [analytics, setAnalytics] = useState<MatchAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");
  const [analyticsFilters, setAnalyticsFilters] = useState<AnalyticsFilters>(EMPTY_ANALYTICS_FILTERS);
  const [appliedAnalyticsFilters, setAppliedAnalyticsFilters] = useState<AnalyticsFilters>(EMPTY_ANALYTICS_FILTERS);
  const [quickDatePreset, setQuickDatePreset] = useState<string>("all");

  // Config states
  const [config, setConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState("");
  const [configHistory, setConfigHistory] = useState<any[]>([]);
  const [savingConfig, setSavingConfig] = useState(false);
  const [confirmingConfig, setConfirmingConfig] = useState(false);
  const [changeReason, setChangeReason] = useState("");
  const [rollbackTarget, setRollbackTarget] = useState<{ id: string; revision: number } | null>(null);
  const [rollbackReason, setRollbackReason] = useState("");
  const [rollingBack, setRollingBack] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"online" | "home">("online");

  // Simulator states
  const [simMode, setSimMode] = useState<"live" | "custom">("live");
  const [liveRequests, setLiveRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string>("");
  const [customRequest, setCustomRequest] = useState({
    subject: "Mathematics",
    level: "O-Level",
    curriculum: "Cambridge O-Level",
    teachingMode: "online",
    city: "Lahore",
    budget: 2500,
    pricingUnit: "hour",
    currency: "PKR",
    schedule: "Evening",
    tutorGenderPreference: "none",
  });
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [dispatchTarget, setDispatchTarget] = useState<string | null>(null);
  const [dispatchingWave, setDispatchingWave] = useState(false);

  // Fetch Analytics
  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    setAnalyticsError("");
    try {
      const params = new URLSearchParams();
      if (appliedAnalyticsFilters.dateFrom) params.set("dateFrom", appliedAnalyticsFilters.dateFrom);
      if (appliedAnalyticsFilters.dateTo) params.set("dateTo", appliedAnalyticsFilters.dateTo);
      if (appliedAnalyticsFilters.mode) params.set("mode", appliedAnalyticsFilters.mode);
      if (appliedAnalyticsFilters.algorithmVersion) params.set("algorithmVersion", appliedAnalyticsFilters.algorithmVersion);
      if (appliedAnalyticsFilters.countryCode) params.set("countryCode", appliedAnalyticsFilters.countryCode);
      if (appliedAnalyticsFilters.city) params.set("city", appliedAnalyticsFilters.city);
      if (appliedAnalyticsFilters.subject) params.set("subject", appliedAnalyticsFilters.subject);

      const res = await api.get(`/matching/admin/analytics?${params.toString()}`);
      if (res.data?.success) {
        setAnalytics(res.data.analytics);
      }
    } catch (err: any) {
      console.error("Failed to load matching analytics:", err);
      setAnalyticsError(err.response?.data?.message || "Failed to load matching analytics.");
    } finally {
      setLoadingAnalytics(false);
    }
  }, [appliedAnalyticsFilters]);

  // Fetch Config
  const fetchConfig = useCallback(async () => {
    setLoadingConfig(true);
    setConfigError("");
    try {
      const [cfgRes, histRes] = await Promise.all([
        api.get("/matching/admin/config"),
        api.get("/matching/admin/config/history").catch(() => ({ data: { history: [] } })),
      ]);
      if (cfgRes.data?.success) {
        setConfig(cfgRes.data.config);
      }
      if (histRes.data?.success) {
        setConfigHistory(histRes.data.history || []);
      }
    } catch (err: any) {
      console.error("Failed to load matching config:", err);
      setConfigError(err.response?.data?.message || "Failed to load matching configuration.");
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  // Fetch Live Requests for Simulator
  const fetchLiveRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const res = await api.get("/admin/at-risk/requests");
      const items = res.data?.items || [];
      const requests = items.map((i: any) => i.request).filter(Boolean);
      setLiveRequests(requests);
      if (requests.length > 0 && !selectedRequestId) {
        setSelectedRequestId(requests[0]._id);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingRequests(false);
    }
  }, [selectedRequestId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    if (activeTab === "simulator") {
      fetchLiveRequests();
    }
  }, [activeTab, fetchLiveRequests]);

  // Quick Date Filter Handler
  const handleQuickDate = (preset: string) => {
    setQuickDatePreset(preset);
    const now = new Date();
    let from = "";
    let to = now.toISOString().split("T")[0];

    if (preset === "today") {
      from = to;
    } else if (preset === "7d") {
      const d = new Date(now.getTime() - 7 * 86400000);
      from = d.toISOString().split("T")[0];
    } else if (preset === "30d") {
      const d = new Date(now.getTime() - 30 * 86400000);
      from = d.toISOString().split("T")[0];
    } else {
      from = "";
      to = "";
    }

    const updated = { ...analyticsFilters, dateFrom: from, dateTo: to };
    setAnalyticsFilters(updated);
    setAppliedAnalyticsFilters(updated);
  };

  // Run Simulation
  const handleRunSimulation = async () => {
    setSimulating(true);
    setSimulationResult(null);
    try {
      const payload: any = { limit: 25 };
      if (simMode === "live") {
        if (!selectedRequestId) {
          showError("Please select an active student request.");
          return;
        }
        payload.requestId = selectedRequestId;
      } else {
        payload.customRequest = customRequest;
      }

      const res = await api.post("/matching/admin/simulate", payload);
      if (res.data?.success) {
        setSimulationResult(res.data);
        showSuccess(`Evaluated ${res.data.totalRanked} compatible candidates.`);
      }
    } catch (err: any) {
      showError(err.response?.data?.message || "Simulation failed.");
    } finally {
      setSimulating(false);
    }
  };

  // Save Config
  const handleSaveConfig = async () => {
    if (!config || changeReason.trim().length < 8) return;
    setSavingConfig(true);
    try {
      const res = await api.put("/matching/admin/config", {
        ...config,
        changeReason: changeReason.trim(),
      });
      if (res.data?.success) {
        showSuccess("Matching configuration calibrated and activated successfully.");
        setConfig(res.data.config);
        setConfirmingConfig(false);
        setChangeReason("");
        fetchConfig();
      }
    } catch (err: any) {
      showError(err.response?.data?.message || "Failed to update configuration.");
    } finally {
      setSavingConfig(false);
    }
  };

  // Rollback Config
  const handleRollbackConfig = async (historyId: string, revision: number) => {
    if (rollbackReason.trim().length < 8) return;
    setRollingBack(true);
    try {
      const res = await api.post(`/matching/admin/config/history/${historyId}/rollback`, {
        reason: rollbackReason.trim(),
      });
      if (res.data?.success) {
        showSuccess(`Restored configuration revision ${revision}.`);
        setConfig(res.data.config);
        setRollbackTarget(null);
        setRollbackReason("");
        fetchConfig();
      }
    } catch (err: any) {
      showError(err.response?.data?.message || "Failed to rollback configuration.");
    } finally {
      setRollingBack(false);
    }
  };

  // Weight Slider Change
  const handleWeightChange = (mode: "online" | "home", key: string, value: number) => {
    if (!config) return;
    const targetKey = mode === "online" ? "onlineWeights" : "homeWeights";
    setConfig((prev: any) => ({
      ...prev,
      [targetKey]: {
        ...prev[targetKey],
        [key]: value,
      },
    }));
  };

  const isSuperAdmin = user?.adminRole === "super_admin" || user?.adminPermissions?.includes("*");
  const canConfigure = Boolean(isSuperAdmin || user?.adminRole === "marketplace_operations" || user?.adminPermissions?.includes("matching.configure"));
  const canSimulate = Boolean(isSuperAdmin || user?.adminRole === "marketplace_operations" || user?.adminPermissions?.includes("matching.simulate"));

  const currentWeights = selectedMode === "online" ? config?.onlineWeights : config?.homeWeights;
  const currentWeightTotal = currentWeights
    ? Object.values(currentWeights).reduce((sum: number, val) => sum + Number(val || 0), 0)
    : 0;

  const tierDist = analytics?.tierDistribution || { excellent: 0, great: 0, good: 0, fair: 0 };
  const totalMatchesCount = analytics?.totalMatches || 0;

  return (
    <div style={{ padding: "1.75rem 2rem", maxWidth: "1440px", margin: "0 auto" }}>
      {/* Executive Command Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #021550 0%, #0329b2 100%)",
          borderRadius: "1rem",
          padding: "1.5rem 1.75rem",
          color: "#ffffff",
          marginBottom: "1.5rem",
          boxShadow: "0 10px 25px -5px rgba(2,21,80,0.25)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
            <span style={{ display: "inline-block", width: "9px", height: "9px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 10px #10b981" }} />
            <span style={{ fontSize: "0.74rem", fontWeight: 800, letterSpacing: "0.08em", color: "#93c5fd", textTransform: "uppercase" }}>
              ALGORITHM ARCHITECTURE · MULTI-FACTOR ENGINE
            </span>
            <span style={{ fontSize: "0.72rem", background: "rgba(255,255,255,0.15)", padding: "0.15rem 0.5rem", borderRadius: "999px", fontWeight: 800 }}>
              {config?.algorithmVersion || "RULE_V1"}
            </span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
            Smart Tutor Matching Engine
          </h1>
          <p style={{ margin: "0.25rem 0 0", color: "#cbd5e1", fontSize: "0.85rem" }}>
            Multi-objective student compatibility, progressive notification waves, and explainable tutor ranking.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "0.5rem", padding: "0.4rem 0.75rem", fontSize: "0.78rem" }}>
            <span style={{ color: "#bfdbfe" }}>Live Requests: </span>
            <strong style={{ color: "#ffffff" }}>{analytics?.activeRequestsCount ?? "—"}</strong>
            <span style={{ color: "#bfdbfe", margin: "0 0.4rem" }}>•</span>
            <span style={{ color: "#bfdbfe" }}>Verified Tutors: </span>
            <strong style={{ color: "#ffffff" }}>{analytics?.verifiedTutorsCount ?? "—"}</strong>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab("simulator")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "#ffffff",
              color: "#021550",
              border: "none",
              padding: "0.55rem 1rem",
              borderRadius: "0.5rem",
              fontSize: "0.82rem",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
            }}
          >
            <Play size={14} fill="#021550" />
            Launch Match Simulator
          </button>
        </div>
      </div>

      {/* Segmented Control Navigation Tab Bar */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "0.75rem",
          padding: "0.35rem",
          marginBottom: "1.5rem",
          display: "inline-flex",
          gap: "0.35rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        {[
          { id: "analytics", label: "Telemetry & Conversion", icon: <BarChart2 size={16} /> },
          { id: "simulator", label: "Interactive Match Simulator", icon: <Play size={16} fill={activeTab === "simulator" ? "#ffffff" : "#0329b2"} /> },
          { id: "weights", label: "Algorithm Weights & Calibration", icon: <Sliders size={16} /> },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.55rem 1.15rem",
                borderRadius: "0.5rem",
                border: active ? "1px solid #0329b2" : "1px solid transparent",
                background: active ? "#0329b2" : "transparent",
                color: active ? "#ffffff" : "#475569",
                fontSize: "0.84rem",
                fontWeight: active ? 800 : 600,
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TELEMETRY & CONVERSION ANALYTICS                                   */}
      {/* ========================================================================= */}
      {activeTab === "analytics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Organized Filter Console */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Filter size={15} color="#0329b2" />
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0f172a" }}>Filter Telemetry Scope</span>
              </div>

              {/* Quick Date Presets */}
              <div style={{ display: "flex", gap: "0.3rem" }}>
                {[
                  { id: "all", label: "All Time" },
                  { id: "30d", label: "30 Days" },
                  { id: "7d", label: "7 Days" },
                  { id: "today", label: "Today" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleQuickDate(p.id)}
                    style={{
                      padding: "0.25rem 0.6rem",
                      borderRadius: "999px",
                      fontSize: "0.72rem",
                      fontWeight: quickDatePreset === p.id ? 800 : 600,
                      border: quickDatePreset === p.id ? "1px solid #0329b2" : "1px solid #e2e8f0",
                      background: quickDatePreset === p.id ? "#eff6ff" : "#f8fafc",
                      color: quickDatePreset === p.id ? "#0329b2" : "#64748b",
                      cursor: "pointer",
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAppliedAnalyticsFilters(analyticsFilters);
              }}
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.75rem", alignItems: "end" }}
            >
              <div>
                <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>Market Scope</label>
                <select
                  value={analyticsFilters.countryCode}
                  onChange={(e) => setAnalyticsFilters({ ...analyticsFilters, countryCode: e.target.value })}
                  style={{ width: "100%", padding: "0.45rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", fontSize: "0.8rem", background: "#ffffff" }}
                >
                  <option value="">All Markets</option>
                  <option value="PK">Pakistan (PK)</option>
                  <option value="AE">United Arab Emirates (AE)</option>
                  <option value="GB">United Kingdom (GB)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>Teaching Mode</label>
                <select
                  value={analyticsFilters.mode}
                  onChange={(e) => setAnalyticsFilters({ ...analyticsFilters, mode: e.target.value })}
                  style={{ width: "100%", padding: "0.45rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", fontSize: "0.8rem", background: "#ffffff" }}
                >
                  <option value="">All Modes</option>
                  <option value="online">Online Worldwide</option>
                  <option value="in-person">In-Person Home Tuition</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>City Focus</label>
                <input
                  type="text"
                  placeholder="e.g. Lahore, Islamabad..."
                  value={analyticsFilters.city}
                  onChange={(e) => setAnalyticsFilters({ ...analyticsFilters, city: e.target.value })}
                  style={{ width: "100%", padding: "0.45rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", fontSize: "0.8rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>Subject Filter</label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics, Physics..."
                  value={analyticsFilters.subject}
                  onChange={(e) => setAnalyticsFilters({ ...analyticsFilters, subject: e.target.value })}
                  style={{ width: "100%", padding: "0.45rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", fontSize: "0.8rem" }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "0.5rem 0.9rem",
                    borderRadius: "0.5rem",
                    border: "none",
                    background: "#0329b2",
                    color: "#ffffff",
                    fontSize: "0.8rem",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Apply Filter
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAnalyticsFilters(EMPTY_ANALYTICS_FILTERS);
                    setAppliedAnalyticsFilters(EMPTY_ANALYTICS_FILTERS);
                    setQuickDatePreset("all");
                  }}
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          {analyticsError && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.6rem", padding: "0.85rem 1rem", color: "#991b1b", fontSize: "0.82rem" }}>
              {analyticsError}
            </div>
          )}

          {/* 5 High-Impact Metric KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1rem" }}>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Match Evaluations</span>
                <span style={{ padding: "0.3rem", borderRadius: "0.4rem", background: "#eff6ff", color: "#0329b2" }}><Layers size={16} /></span>
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#0f172a" }}>
                {loadingAnalytics ? "..." : (analytics?.totalMatches ?? 0).toLocaleString()}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.25rem" }}>Across all live student requests</div>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Avg Match Score</span>
                <span style={{ padding: "0.3rem", borderRadius: "0.4rem", background: "#ecfdf5", color: "#059669" }}><Award size={16} /></span>
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#059669" }}>
                {loadingAnalytics ? "..." : analytics?.avgMatchScore != null ? `${analytics.avgMatchScore}%` : "—"}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.25rem" }}>Target compatibility: &ge; 70%</div>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Offer Conversion</span>
                <span style={{ padding: "0.3rem", borderRadius: "0.4rem", background: "#f5f3ff", color: "#7c3aed" }}><TrendingUp size={16} /></span>
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#7c3aed" }}>
                {loadingAnalytics ? "..." : `${analytics?.offerConversionRate ?? 0}%`}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.25rem" }}>Evaluations leading to formal bids</div>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Booking Conversion</span>
                <span style={{ padding: "0.3rem", borderRadius: "0.4rem", background: "#f0fdf4", color: "#16a34a" }}><CheckCircle2 size={16} /></span>
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#16a34a" }}>
                {loadingAnalytics ? "..." : `${analytics?.bookingConversionRate ?? 0}%`}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.25rem" }}>Matches confirmed & scheduled</div>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Response Time</span>
                <span style={{ padding: "0.3rem", borderRadius: "0.4rem", background: "#fffbeb", color: "#d97706" }}><Clock size={16} /></span>
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#d97706" }}>
                {loadingAnalytics ? "..." : analytics?.avgStudentResponseMinutes != null ? `${analytics.avgStudentResponseMinutes}m` : "—"}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.25rem" }}>Notification to tutor offer</div>
            </div>
          </div>

          {/* If No Historical MatchLogs Yet: Show Engine Benchmark Banner */}
          {!loadingAnalytics && !analyticsError && analytics && !analytics.hasData && (
            <div
              style={{
                background: "linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)",
                border: "1px solid #bfdbfe",
                borderRadius: "0.85rem",
                padding: "1.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} />
                  <strong style={{ color: "#021550", fontSize: "0.95rem" }}>
                    Algorithm Engine Ready · Real-Time Calculation Active
                  </strong>
                </div>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "#475569", maxWidth: "700px" }}>
                  Historical logs record after progressive notifications are dispatched. You can immediately evaluate any live student request or custom requirement in the <strong>Interactive Match Simulator</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("simulator")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.55rem 1rem",
                  borderRadius: "0.5rem",
                  background: "#0329b2",
                  color: "#ffffff",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Run Match Simulation Now <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* Tier Distribution & Algorithmic Trust Safeguards (Side-by-Side) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.25rem" }}>
            {/* Score Tier Distribution */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Zap size={16} color="#d97706" />
                  <strong style={{ fontSize: "0.92rem", color: "#0f172a" }}>Match Score Tier Distribution</strong>
                </div>
                <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Compatibility Bands</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                    <span style={{ color: "#059669" }}>Excellent Match (&ge; 90%)</span>
                    <span>{tierDist.excellent}</span>
                  </div>
                  <div style={{ height: "8px", borderRadius: "999px", background: "#f1f5f9", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        borderRadius: "999px",
                        background: "#059669",
                        width: `${totalMatchesCount > 0 ? Math.round((tierDist.excellent / totalMatchesCount) * 100) : 0}%`,
                        transition: "width 250ms ease",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                    <span style={{ color: "#0284c7" }}>Great Match (80 - 89%)</span>
                    <span>{tierDist.great}</span>
                  </div>
                  <div style={{ height: "8px", borderRadius: "999px", background: "#f1f5f9", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        borderRadius: "999px",
                        background: "#0284c7",
                        width: `${totalMatchesCount > 0 ? Math.round((tierDist.great / totalMatchesCount) * 100) : 0}%`,
                        transition: "width 250ms ease",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                    <span style={{ color: "#7c3aed" }}>Good Match (70 - 79%)</span>
                    <span>{tierDist.good}</span>
                  </div>
                  <div style={{ height: "8px", borderRadius: "999px", background: "#f1f5f9", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        borderRadius: "999px",
                        background: "#7c3aed",
                        width: `${totalMatchesCount > 0 ? Math.round((tierDist.good / totalMatchesCount) * 100) : 0}%`,
                        transition: "width 250ms ease",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                    <span style={{ color: "#d97706" }}>Fair Match (60 - 69%)</span>
                    <span>{tierDist.fair}</span>
                  </div>
                  <div style={{ height: "8px", borderRadius: "999px", background: "#f1f5f9", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        borderRadius: "999px",
                        background: "#d97706",
                        width: `${totalMatchesCount > 0 ? Math.round((tierDist.fair / totalMatchesCount) * 100) : 0}%`,
                        transition: "width 250ms ease",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Algorithm Fairness & Trust Rules */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <ShieldCheck size={16} color="#0329b2" />
                  <strong style={{ fontSize: "0.92rem", color: "#0f172a" }}>Algorithm Fairness & Trust Rules</strong>
                </div>
                <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#059669", background: "#ecfdf5", padding: "0.15rem 0.5rem", borderRadius: "999px" }}>
                  Enforced
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.78rem" }}>
                <div style={{ display: "flex", gap: "0.6rem", background: "#f8fafc", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
                  <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong style={{ color: "#0f172a", display: "block" }}>Zero Platform Revenue Bias</strong>
                    <span style={{ color: "#64748b" }}>Matches are ranked purely on student-tutor capability and subject match, never to maximize platform fees.</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.6rem", background: "#f8fafc", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
                  <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong style={{ color: "#0f172a", display: "block" }}>Home Tuition Police Verification Gate</strong>
                    <span style={{ color: "#64748b" }}>Tutors cannot receive home tuition match waves without verified background checks.</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.6rem", background: "#f8fafc", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
                  <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong style={{ color: "#0f172a", display: "block" }}>Bayesian Cold-Start Protection</strong>
                    <span style={{ color: "#64748b" }}>Prior rating shrinkage protects new tutors from sparse review distortions while maintaining student quality standards.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INTERACTIVE MATCH SIMULATOR & DIAGNOSTICS                         */}
      {/* ========================================================================= */}
      {activeTab === "simulator" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Simulation Control Console */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Play size={16} fill="#0329b2" color="#0329b2" />
                  Live Match Simulation & Diagnostics
                </h3>
                <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: "#64748b" }}>
                  Test compatibility algorithms against live requests or custom sandbox criteria.
                </p>
              </div>

              {/* Mode Toggle */}
              <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "0.5rem", padding: "0.25rem" }}>
                <button
                  type="button"
                  onClick={() => setSimMode("live")}
                  style={{
                    padding: "0.35rem 0.75rem",
                    borderRadius: "0.35rem",
                    border: "none",
                    background: simMode === "live" ? "#ffffff" : "transparent",
                    color: simMode === "live" ? "#0329b2" : "#64748b",
                    fontSize: "0.78rem",
                    fontWeight: simMode === "live" ? 800 : 600,
                    cursor: "pointer",
                  }}
                >
                  Live Student Request
                </button>
                <button
                  type="button"
                  onClick={() => setSimMode("custom")}
                  style={{
                    padding: "0.35rem 0.75rem",
                    borderRadius: "0.35rem",
                    border: "none",
                    background: simMode === "custom" ? "#ffffff" : "transparent",
                    color: simMode === "custom" ? "#0329b2" : "#64748b",
                    fontSize: "0.78rem",
                    fontWeight: simMode === "custom" ? 800 : 600,
                    cursor: "pointer",
                  }}
                >
                  Custom Test Sandbox
                </button>
              </div>
            </div>

            {simMode === "live" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#475569" }}>
                  Select Live Demand Request:
                </label>
                {loadingRequests ? (
                  <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Scanning open requests...</div>
                ) : liveRequests.length === 0 ? (
                  <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "0.5rem", padding: "0.85rem", fontSize: "0.8rem", color: "#92400e" }}>
                    No active student requests currently awaiting matching. Switch to <strong>Custom Test Sandbox</strong> to simulate arbitrary requirements.
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                    <select
                      value={selectedRequestId}
                      onChange={(e) => setSelectedRequestId(e.target.value)}
                      style={{
                        flex: "1 1 320px",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "0.5rem",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.82rem",
                        background: "#ffffff",
                      }}
                    >
                      {liveRequests.map((req) => (
                        <option key={req._id} value={req._id}>
                          {req.subject} ({req.level}) · {req.currency || "PKR"} {req.budget?.toLocaleString()}/{req.pricingUnit || "hr"} · {req.teachingMode === "online" ? "Online" : req.city || "Home"} · Student: {req.student?.name || "Student"}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleRunSimulation}
                      disabled={simulating || !selectedRequestId}
                      style={{
                        padding: "0.55rem 1.25rem",
                        borderRadius: "0.5rem",
                        background: "#0329b2",
                        color: "#ffffff",
                        border: "none",
                        fontSize: "0.82rem",
                        fontWeight: 800,
                        cursor: simulating ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                      }}
                    >
                      <Zap size={15} />
                      {simulating ? "Evaluating..." : "Run Match Evaluation"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", alignItems: "end" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>Subject</label>
                  <input
                    type="text"
                    value={customRequest.subject}
                    onChange={(e) => setCustomRequest({ ...customRequest, subject: e.target.value })}
                    style={{ width: "100%", padding: "0.45rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", fontSize: "0.8rem" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>Academic Level</label>
                  <select
                    value={customRequest.level}
                    onChange={(e) => setCustomRequest({ ...customRequest, level: e.target.value })}
                    style={{ width: "100%", padding: "0.45rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", fontSize: "0.8rem", background: "#ffffff" }}
                  >
                    <option value="Primary">Primary (1-5)</option>
                    <option value="Middle">Middle (6-8)</option>
                    <option value="Matric">Matric</option>
                    <option value="Intermediate">Intermediate / FSc</option>
                    <option value="O-Level">O-Level (Cambridge)</option>
                    <option value="A-Level">A-Level (Cambridge)</option>
                    <option value="University">University</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>Teaching Mode</label>
                  <select
                    value={customRequest.teachingMode}
                    onChange={(e) => setCustomRequest({ ...customRequest, teachingMode: e.target.value })}
                    style={{ width: "100%", padding: "0.45rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", fontSize: "0.8rem", background: "#ffffff" }}
                  >
                    <option value="online">Online Worldwide</option>
                    <option value="in-person">In-Person Home Tuition</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>City (for Home)</label>
                  <input
                    type="text"
                    value={customRequest.city}
                    onChange={(e) => setCustomRequest({ ...customRequest, city: e.target.value })}
                    style={{ width: "100%", padding: "0.45rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", fontSize: "0.8rem" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>Student Budget</label>
                  <input
                    type="number"
                    value={customRequest.budget}
                    onChange={(e) => setCustomRequest({ ...customRequest, budget: Number(e.target.value) })}
                    style={{ width: "100%", padding: "0.45rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", fontSize: "0.8rem" }}
                  />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleRunSimulation}
                    disabled={simulating}
                    style={{
                      width: "100%",
                      padding: "0.5rem 1rem",
                      borderRadius: "0.5rem",
                      background: "#0329b2",
                      color: "#ffffff",
                      border: "none",
                      fontSize: "0.8rem",
                      fontWeight: 800,
                      cursor: simulating ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <Zap size={14} />
                    {simulating ? "Evaluating..." : "Run Evaluation"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Simulation Result Candidate Display */}
          {simulationResult && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Telemetry Bar */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Eligible Candidates</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0f172a", marginTop: "0.2rem" }}>
                    {simulationResult.totalEligible} tutors
                  </div>
                </div>

                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Ranked Matches</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0329b2", marginTop: "0.2rem" }}>
                    {simulationResult.totalRanked} tutors
                  </div>
                </div>

                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>High Compatibility (&ge;80%)</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#059669", marginTop: "0.2rem" }}>
                    {(simulationResult.tierSummary?.excellent || 0) + (simulationResult.tierSummary?.great || 0)} tutors
                  </div>
                </div>
              </div>

              {/* Candidate Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Award size={18} color="#059669" />
                  Ranked Tutor Candidates ({simulationResult.matches?.length || 0})
                </h3>

                {simulationResult.matches?.length === 0 ? (
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "2.5rem", textAlign: "center", color: "#64748b", fontSize: "0.82rem" }}>
                    No tutors met the hard eligibility criteria (check subject match, city scope, or police clearance requirements).
                  </div>
                ) : (
                  simulationResult.matches.map((match: any, index: number) => {
                    const tutor = match.tutor;
                    const score = match.score ?? match.matchScore ?? 0;
                    const tier = match.tier === "strong" ? "great" : match.tier === "other" ? "fair" : match.tier;

                    return (
                      <div
                        key={tutor._id || index}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "0.75rem",
                          padding: "1.25rem",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          flexWrap: "wrap",
                          gap: "1.25rem",
                        }}
                      >
                        {/* Tutor Info */}
                        <div style={{ display: "flex", gap: "1rem", flex: "1 1 340px" }}>
                          <span style={{ fontSize: "1.2rem", fontWeight: 900, color: "#cbd5e1", width: "28px" }}>
                            #{index + 1}
                          </span>
                          <AvatarImage src={tutor.avatar} alt={tutor.name || "Tutor"} name={tutor.name || "Tutor"} size={48} />
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                              <Link
                                href={tutorProfileHref(tutor)}
                                target="_blank"
                                style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.95rem", textDecoration: "none" }}
                              >
                                {tutor.name}
                              </Link>
                              {tutor.policeCertificateVerified && (
                                <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#059669", background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "0.1rem 0.4rem", borderRadius: "0.3rem" }}>
                                  ✓ Police Verified
                                </span>
                              )}
                              <MatchScoreBadge score={score} tier={tier} />
                            </div>

                            <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                              <span>📍 {tutor.city || "Pakistan"}</span>
                              <span style={{ margin: "0 0.4rem" }}>•</span>
                              <span>💼 {tutor.experience ? `${tutor.experience} yrs exp` : "1 yr exp"}</span>
                              <span style={{ margin: "0 0.4rem" }}>•</span>
                              <span>★ {tutor.averageRating ? tutor.averageRating.toFixed(1) : "New (4.85)"}</span>
                              <span style={{ margin: "0 0.4rem" }}>•</span>
                              <strong style={{ color: "#0f172a" }}>{tutor.currency || "PKR"} {tutor.hourlyRate ? tutor.hourlyRate.toLocaleString() : "2,500"}/hr</strong>
                            </div>

                            {/* Reasons */}
                            {match.reasons && match.reasons.length > 0 && (
                              <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                                {match.reasons.map((r: string, i: number) => (
                                  <span key={i} style={{ fontSize: "0.7rem", color: "#334155", background: "#f1f5f9", padding: "0.15rem 0.5rem", borderRadius: "0.3rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                    <CheckCircle2 size={12} color="#059669" />
                                    {r}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Breakdown Box */}
                        {match.scoreBreakdown && (
                          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "0.75rem", fontSize: "0.74rem", minWidth: "220px" }}>
                            <strong style={{ display: "block", marginBottom: "0.35rem", color: "#0f172a" }}>Score Breakdown</strong>
                            {Object.entries(match.scoreBreakdown).map(([k, v]) => (
                              <div key={k} style={{ display: "flex", justifyContent: "space-between", color: "#64748b", margin: "0.15rem 0" }}>
                                <span style={{ textTransform: "capitalize" }}>{k.replace(/([A-Z])/g, " $1")}</span>
                                <strong style={{ color: "#0f172a" }}>{Number(v)} pts</strong>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ALGORITHM WEIGHTS & CALIBRATION                                    */}
      {/* ========================================================================= */}
      {activeTab === "weights" && (
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {configError && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.5rem", padding: "0.85rem", color: "#991b1b", fontSize: "0.82rem" }}>
              {configError}
            </div>
          )}

          {/* Top Control */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", paddingBottom: "1rem", borderBottom: "1px solid #e2e8f0" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Sliders size={18} color="#0329b2" />
                Live Algorithm Weight Calibration
              </h2>
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: "#64748b" }}>
                Each matching mode must sum to exactly 100 points across factors.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "0.5rem", padding: "0.25rem" }}>
                <button
                  type="button"
                  onClick={() => setSelectedMode("online")}
                  style={{
                    padding: "0.35rem 0.75rem",
                    borderRadius: "0.35rem",
                    border: "none",
                    background: selectedMode === "online" ? "#ffffff" : "transparent",
                    color: selectedMode === "online" ? "#0329b2" : "#64748b",
                    fontSize: "0.78rem",
                    fontWeight: selectedMode === "online" ? 800 : 600,
                    cursor: "pointer",
                  }}
                >
                  Online Mode
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMode("home")}
                  style={{
                    padding: "0.35rem 0.75rem",
                    borderRadius: "0.35rem",
                    border: "none",
                    background: selectedMode === "home" ? "#ffffff" : "transparent",
                    color: selectedMode === "home" ? "#0329b2" : "#64748b",
                    fontSize: "0.78rem",
                    fontWeight: selectedMode === "home" ? 800 : 600,
                    cursor: "pointer",
                  }}
                >
                  Home Tuition Mode
                </button>
              </div>

              <button
                type="button"
                onClick={() => setConfirmingConfig(true)}
                disabled={savingConfig || !canConfigure || currentWeightTotal !== 100}
                style={{
                  padding: "0.5rem 1.1rem",
                  borderRadius: "0.5rem",
                  background: currentWeightTotal === 100 ? "#0329b2" : "#94a3b8",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  cursor: currentWeightTotal === 100 ? "pointer" : "not-allowed",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <Save size={14} />
                Save Weights
              </button>
            </div>
          </div>

          {/* Point Counter Meter */}
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              background: currentWeightTotal === 100 ? "#ecfdf5" : "#fffbeb",
              border: `1px solid ${currentWeightTotal === 100 ? "#a7f3d0" : "#fde68a"}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.85rem",
              fontWeight: 800,
              color: currentWeightTotal === 100 ? "#065f46" : "#92400e",
            }}
          >
            <span>{selectedMode === "online" ? "Online Tutoring" : "Home Tuition"} Weight Sum</span>
            <span>{currentWeightTotal} / 100 Points {currentWeightTotal === 100 ? "✓ Calibrated" : "⚠️ Must Total 100"}</span>
          </div>

          {/* Sliders Grid */}
          {loadingConfig ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Loading algorithm configuration...</div>
          ) : currentWeights ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              {Object.entries(currentWeights).map(([key, val]) => {
                const numericVal = Number(val) || 0;
                const readableLabel = key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase());

                return (
                  <div
                    key={key}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.6rem",
                      padding: "1rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#0f172a" }}>{readableLabel}</span>
                      <span style={{ fontSize: "0.78rem", fontWeight: 900, color: "#0329b2", background: "#eff6ff", padding: "0.15rem 0.5rem", borderRadius: "0.3rem" }}>
                        {numericVal} pts
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="40"
                      step="1"
                      value={numericVal}
                      onChange={(e) => handleWeightChange(selectedMode, key, Number(e.target.value))}
                      style={{ width: "100%", accentColor: "#0329b2", cursor: "pointer" }}
                    />

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                      <span>0 pts (Disabled)</span>
                      <span>40 pts (Dominant)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Revision History */}
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1.25rem" }}>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <History size={16} color="#0329b2" />
              Algorithm Calibration History & Audit
            </h3>
            {configHistory.length === 0 ? (
              <p style={{ fontSize: "0.8rem", color: "#64748b" }}>No changes recorded yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {configHistory.slice(0, 6).map((entry) => (
                  <div
                    key={entry._id}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.5rem",
                      padding: "0.75rem 1rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.8rem",
                    }}
                  >
                    <div>
                      <strong style={{ color: "#0f172a" }}>Revision {entry.revision}: {entry.changeReason}</strong>
                      <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.15rem" }}>
                        {entry.changedBy?.name || "Admin"} · {new Date(entry.createdAt).toLocaleString()}
                      </div>
                    </div>

                    {canConfigure && (
                      <button
                        type="button"
                        onClick={() => setRollbackTarget({ id: entry._id, revision: entry.revision })}
                        style={{
                          padding: "0.35rem 0.75rem",
                          borderRadius: "0.4rem",
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          color: "#0329b2",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Restore Revision
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Save Modal */}
          <AdminDialog
            open={confirmingConfig}
            onClose={() => !savingConfig && setConfirmingConfig(false)}
            title="Confirm Algorithm Calibration"
            description="Changes take effect immediately across all live request matching and offer ranking."
            footer={
              <>
                <button type="button" onClick={() => setConfirmingConfig(false)} style={{ padding: "0.5rem 0.9rem", borderRadius: "0.4rem", border: "1px solid #cbd5e1", background: "#ffffff", fontSize: "0.8rem", fontWeight: 700 }}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={savingConfig || changeReason.trim().length < 8}
                  style={{
                    padding: "0.5rem 1.1rem",
                    borderRadius: "0.5rem",
                    background: "#0329b2",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "0.8rem",
                    fontWeight: 800,
                    cursor: savingConfig || changeReason.trim().length < 8 ? "not-allowed" : "pointer",
                  }}
                >
                  {savingConfig ? "Saving..." : "Confirm and Activate"}
                </button>
              </>
            }
          >
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: "0.3rem" }}>
                Reason for Calibration (Required for Audit Trail, min 8 chars):
              </label>
              <textarea
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                rows={3}
                placeholder="Explain the operational rationale (e.g. increase Bayesian review weighting for Lahore home tutors)..."
                style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", fontSize: "0.8rem" }}
              />
            </div>
          </AdminDialog>

          {/* Rollback Modal */}
          <AdminDialog
            open={Boolean(rollbackTarget)}
            onClose={() => !rollingBack && setRollbackTarget(null)}
            title={`Restore Algorithm Revision ${rollbackTarget?.revision || ""}`}
            description="Creates a new audited revision from the snapshot."
            footer={
              <>
                <button type="button" onClick={() => setRollbackTarget(null)} style={{ padding: "0.5rem 0.9rem", borderRadius: "0.4rem", border: "1px solid #cbd5e1", background: "#ffffff", fontSize: "0.8rem", fontWeight: 700 }}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => rollbackTarget && handleRollbackConfig(rollbackTarget.id, rollbackTarget.revision)}
                  disabled={rollingBack || rollbackReason.trim().length < 8}
                  style={{
                    padding: "0.5rem 1.1rem",
                    borderRadius: "0.5rem",
                    background: "#0329b2",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "0.8rem",
                    fontWeight: 800,
                    cursor: rollingBack || rollbackReason.trim().length < 8 ? "not-allowed" : "pointer",
                  }}
                >
                  {rollingBack ? "Restoring..." : "Confirm Rollback"}
                </button>
              </>
            }
          >
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: "0.3rem" }}>
                Reason for Rollback (Required for Audit Trail):
              </label>
              <textarea
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
                rows={3}
                placeholder="Describe why previous calibration is being restored..."
                style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", fontSize: "0.8rem" }}
              />
            </div>
          </AdminDialog>
        </div>
      )}
    </div>
  );
}
