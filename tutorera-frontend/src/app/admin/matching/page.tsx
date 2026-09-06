"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Sliders,
  TrendingUp,
  Award,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Layers,
  Zap,
  Play,
  Send,
  ExternalLink,
} from "lucide-react";
import axiosInstance from "@/lib/axios";
import { showSuccess, showError } from "@/lib/toast";
import MatchScoreBadge from "@/components/marketplace/MatchScoreBadge";
import { tutorProfileHref } from "@/lib/tutor-directory";

interface MatchAnalytics {
  totalMatches: number;
  avgMatchScore: number;
  totalOffers: number;
  totalBookings: number;
  offerConversionRate: number;
  bookingConversionRate: number;
  avgStudentResponseMinutes: number;
  tierDistribution: {
    excellent: number;
    great: number;
    good: number;
    fair: number;
  };
}

export default function AdminMatchingPage() {
  const [activeTab, setActiveTab] = useState<"analytics" | "weights" | "simulator">("analytics");
  const [analytics, setAnalytics] = useState<MatchAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
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
  const [dispatchingWave, setDispatchingWave] = useState(false);

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await axiosInstance.get("/matching/admin/analytics");
      setAnalytics(res.data.analytics);
    } catch (err) {
      console.error("Failed to load matching analytics:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchConfig = async () => {
    setLoadingConfig(true);
    try {
      const res = await axiosInstance.get("/matching/admin/config");
      setConfig(res.data.config);
    } catch (err) {
      console.error("Failed to load matching config:", err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const fetchLiveRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await axiosInstance.get("/requests?status=open,published,receiving_offers&limit=30");
      const list = res.data?.requests || res.data?.data || [];
      setLiveRequests(list);
      if (list.length > 0 && !selectedRequestId) {
        setSelectedRequestId(list[0]._id);
      }
    } catch (err) {
      console.error("Failed to load live requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchConfig();
    fetchLiveRequests();
  }, []);

  const handleWeightChange = (mode: "online" | "home", key: string, value: number) => {
    if (!config) return;
    const modeKey = mode === "online" ? "onlineWeights" : "homeWeights";
    setConfig({
      ...config,
      [modeKey]: {
        ...config[modeKey],
        [key]: value,
      },
    });
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    setSavingConfig(true);
    try {
      await axiosInstance.put("/matching/admin/config", config);
      showSuccess("Matching weights successfully saved and activated in memory!");
      fetchConfig();
    } catch {
      showError("Failed to update matching configuration.");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleRunSimulation = async () => {
    setSimulating(true);
    try {
      const payload =
        simMode === "live"
          ? { requestId: selectedRequestId, limit: 25 }
          : { customRequest, limit: 25 };

      const res = await axiosInstance.post("/matching/admin/simulate", payload);
      setSimulationResult(res.data);
      showSuccess(`Smart matching evaluated: found ${res.data.totalRanked} candidate tutors.`);
    } catch (err: any) {
      showError(err?.response?.data?.message || "Failed to execute matching simulation.");
    } finally {
      setSimulating(false);
    }
  };

  const handleDispatchNotificationWave = async (requestId: string) => {
    if (!requestId) return;
    setDispatchingWave(true);
    try {
      await axiosInstance.post(`/admin/requests/${requestId}/rescue`, { action: "rematch" });
      showSuccess("Progressive tutor notifications wave dispatched successfully!");
    } catch {
      showError("Failed to trigger match dispatch wave.");
    } finally {
      setDispatchingWave(false);
    }
  };

  const currentWeights = config ? (selectedMode === "online" ? config.onlineWeights : config.homeWeights) : null;
  const tierDist = analytics?.tierDistribution || { excellent: 0, great: 0, good: 0, fair: 0 };
  const totalMatchesCount = analytics?.totalMatches || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-cyan-400/20 text-cyan-300 rounded-xl border border-cyan-400/30">
            <Sparkles className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white">Smart Tutor Matching Engine</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 font-bold border border-cyan-400/30">
                {config?.algorithmVersion || config?.activeVersion || "8L-HYBRID-V2.1"}
              </span>
            </div>
            <p className="text-xs text-blue-200/80 mt-1">
              8-layer two-sided marketplace intelligence: compatibility, Bayesian ratings, reliability, and explainable scoring.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "analytics"
                ? "bg-white text-blue-900 shadow-md"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            Analytics & Conversion
          </button>
          <button
            onClick={() => setActiveTab("simulator")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "simulator"
                ? "bg-cyan-400 text-slate-950 font-black shadow-md"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Match Simulator
          </button>
          <button
            onClick={() => setActiveTab("weights")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "weights"
                ? "bg-white text-blue-900 shadow-md"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            Algorithm Weights
          </button>
        </div>
      </div>

      {/* TAB 1: ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Key KPI Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Match Evaluations</span>
                <Layers className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {analytics?.totalMatches !== undefined ? analytics.totalMatches.toLocaleString() : "—"}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Across student requests & offers</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Average Match Score</span>
                <Award className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {analytics?.avgMatchScore !== undefined ? `${analytics.avgMatchScore}%` : "—"}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Target compatibility threshold: &ge; 70%</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Offer Conversion</span>
                <TrendingUp className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {analytics?.offerConversionRate !== undefined ? `${analytics.offerConversionRate}%` : "—"}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Matches converting to formal tutor offers</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Booking Conversion</span>
                <CheckCircle2 className="w-4 h-4 text-cyan-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {analytics?.bookingConversionRate !== undefined ? `${analytics.bookingConversionRate}%` : "—"}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Matches leading to paid student bookings</p>
            </div>
          </div>

          {/* Tier Breakdown & Marketplace Fairness */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Tier Distribution */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Match Score Tier Distribution
                </h3>
                <span className="text-xs text-slate-400">All-Time Live Data</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-emerald-600 dark:text-emerald-400">Excellent Match (&ge; 90%)</span>
                    <span>{tierDist.excellent}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${totalMatchesCount > 0 ? Math.round((tierDist.excellent / totalMatchesCount) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-blue-600 dark:text-blue-400">Great Match (80 - 89%)</span>
                    <span>{tierDist.great}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${totalMatchesCount > 0 ? Math.round((tierDist.great / totalMatchesCount) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-purple-600 dark:text-purple-400">Good Match (70 - 79%)</span>
                    <span>{tierDist.good}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${totalMatchesCount > 0 ? Math.round((tierDist.good / totalMatchesCount) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-amber-600 dark:text-amber-400">Fair Match (60 - 69%)</span>
                    <span>{tierDist.fair}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${totalMatchesCount > 0 ? Math.round((tierDist.fair / totalMatchesCount) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Principles & Safety Checks */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Algorithm Fairness & Trust Rules
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                  Enforced
                </span>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 dark:text-white block">Zero Platform Revenue Bias</strong>
                    Matches are scored strictly on student-tutor compatibility and quality, never to maximize platform fees.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 dark:text-white block">Home Tuition Police Verification Gate</strong>
                    Tutors cannot receive home tuition match notifications or rank for home requests without verified police clearance.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 dark:text-white block">Bayesian Cold-Start Protection</strong>
                    Prior rating (C = 4.85, m = 5) prevents new high-quality tutors from being penalized while protecting students from statistical rating anomalies.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MATCH SIMULATOR & DIAGNOSTICS */}
      {activeTab === "simulator" && (
        <div className="space-y-6">
          {/* Simulator Control Console */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Play className="w-5 h-5 text-cyan-600 fill-cyan-600" />
                  Live Match Simulation & Diagnostics
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Evaluate smart matching against live requests or test custom parameters to verify eligibility, scoring breakdown, and explainability reasons.
                </p>
              </div>

              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                <button
                  type="button"
                  onClick={() => setSimMode("live")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    simMode === "live"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Live Student Request
                </button>
                <button
                  type="button"
                  onClick={() => setSimMode("custom")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    simMode === "custom"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Custom Test Sandbox
                </button>
              </div>
            </div>

            {/* Input Selection */}
            {simMode === "live" ? (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Select Active Student Request:
                </label>
                {loadingRequests ? (
                  <div className="text-xs text-slate-500 py-3">Loading active requests...</div>
                ) : liveRequests.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-xs border border-amber-200 dark:border-amber-900">
                    No active student requests found currently. Switch to <strong>Custom Test Sandbox</strong> to simulate arbitrary requirements.
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={selectedRequestId}
                      onChange={(e) => setSelectedRequestId(e.target.value)}
                      className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
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
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow transition-all disabled:opacity-50"
                    >
                      <Zap className="w-4 h-4" />
                      {simulating ? "Evaluating..." : "Run Match Evaluation"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Subject</label>
                    <input
                      type="text"
                      value={customRequest.subject}
                      onChange={(e) => setCustomRequest({ ...customRequest, subject: e.target.value })}
                      placeholder="e.g. Mathematics, Physics..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Level</label>
                    <select
                      value={customRequest.level}
                      onChange={(e) => setCustomRequest({ ...customRequest, level: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium"
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
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Teaching Mode</label>
                    <select
                      value={customRequest.teachingMode}
                      onChange={(e) => setCustomRequest({ ...customRequest, teachingMode: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium"
                    >
                      <option value="online">Online Worldwide</option>
                      <option value="in-person">In-Person Home Tuition</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">City (for Home Mode)</label>
                    <input
                      type="text"
                      value={customRequest.city}
                      onChange={(e) => setCustomRequest({ ...customRequest, city: e.target.value })}
                      placeholder="e.g. Lahore, Karachi"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Student Budget</label>
                    <input
                      type="number"
                      value={customRequest.budget}
                      onChange={(e) => setCustomRequest({ ...customRequest, budget: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Pricing Unit</label>
                    <select
                      value={customRequest.pricingUnit}
                      onChange={(e) => setCustomRequest({ ...customRequest, pricingUnit: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium"
                    >
                      <option value="hour">Per Hour</option>
                      <option value="month">Per Month (12 sessions)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Currency</label>
                    <select
                      value={customRequest.currency}
                      onChange={(e) => setCustomRequest({ ...customRequest, currency: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium"
                    >
                      <option value="PKR">PKR (Rs.)</option>
                      <option value="USD">USD ($)</option>
                      <option value="AED">AED</option>
                      <option value="SAR">SAR</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleRunSimulation}
                      disabled={simulating}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow transition-all disabled:opacity-50"
                    >
                      <Zap className="w-4 h-4" />
                      {simulating ? "Evaluating..." : "Run Evaluation"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Simulation Output */}
          {simulationResult && (
            <div className="space-y-6">
              {/* Summary Stats Header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Eligible Pool</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    {simulationResult.totalEligible} tutors
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Ranked Matches</span>
                  <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                    {simulationResult.totalRanked} tutors
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">High Compatibility (&ge;80%)</span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {(simulationResult.tierSummary?.excellent || 0) + (simulationResult.tierSummary?.great || 0)} tutors
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Operations Action</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Dispatch Notification Wave</span>
                  </div>
                  {simMode === "live" && (
                    <button
                      type="button"
                      onClick={() => handleDispatchNotificationWave(selectedRequestId)}
                      disabled={dispatchingWave}
                      className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow active:scale-95 transition-all disabled:opacity-50"
                      title="Dispatch Match Notification Wave"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Match Cards List */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  Ranked Tutor Candidates ({simulationResult.matches?.length || 0})
                </h3>

                {simulationResult.matches?.length === 0 ? (
                  <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                    No tutors met the hard eligibility criteria (check subject, city for home mode, or police verification requirements).
                  </div>
                ) : (
                  simulationResult.matches.map((match: any, index: number) => {
                    const tutor = match.tutor;
                    const score = match.score ?? match.matchScore ?? 0;
                    const tier = match.tier === "strong" ? "great" : match.tier === "other" ? "fair" : match.tier;

                    return (
                      <div
                        key={tutor._id || index}
                        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:border-blue-300 dark:hover:border-blue-800 transition-all"
                      >
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          {/* Tutor Identity */}
                          <div className="flex items-start gap-3.5 flex-1">
                            <span className="font-black text-slate-300 dark:text-slate-700 text-lg w-6 shrink-0 mt-1">
                              #{index + 1}
                            </span>

                            <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-slate-600 dark:text-slate-300 shrink-0">
                              {tutor.avatar ? (
                                <img src={tutor.avatar} alt={tutor.name} className="w-full h-full object-cover" />
                              ) : (
                                tutor.name?.charAt(0).toUpperCase() || "T"
                              )}
                            </div>

                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Link
                                  href={tutorProfileHref(tutor)}
                                  target="_blank"
                                  className="font-bold text-slate-900 dark:text-white hover:text-blue-600 transition-colors flex items-center gap-1 text-sm"
                                >
                                  {tutor.name}
                                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                </Link>

                                {tutor.policeCertificateVerified && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                                    <ShieldCheck className="w-3 h-3" /> Police Verified
                                  </span>
                                )}

                                {match.isColdStartExploration && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold">
                                    🌟 Rising Explorer
                                  </span>
                                )}

                                <MatchScoreBadge
                                  score={score}
                                  tier={tier}
                                  reasons={match.reasons}
                                  breakdown={match.scoreBreakdown}
                                  showBreakdown={true}
                                />
                              </div>

                              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                                <span>📍 {tutor.city || "Pakistan"}</span>
                                <span>•</span>
                                <span>💼 {tutor.experience ? `${tutor.experience} yrs exp` : "1 yr exp"}</span>
                                <span>•</span>
                                <span>★ {tutor.averageRating ? tutor.averageRating.toFixed(1) : "New (4.85)"}</span>
                                <span>•</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {tutor.currency || "PKR"} {tutor.hourlyRate ? tutor.hourlyRate.toLocaleString() : "2,500"}/hr
                                </span>
                              </div>

                              {tutor.education && tutor.education.length > 0 && (
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                  🎓 {tutor.education[0].degree} {tutor.education[0].field ? `in ${tutor.education[0].field}` : ""} ({tutor.education[0].institution || "University"})
                                </p>
                              )}

                              {/* Explainability Reasons */}
                              {match.reasons && match.reasons.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1.5">
                                  {match.reasons.map((r: string, i: number) => (
                                    <span
                                      key={i}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300"
                                    >
                                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                      {r}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Score Breakdown Radar/Pills */}
                          {match.scoreBreakdown && (
                            <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5 shrink-0 text-[11px]">
                              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                Point Breakdown:
                              </span>
                              {Object.entries(match.scoreBreakdown).map(([k, v]) => (
                                <div key={k} className="flex justify-between items-center text-slate-500">
                                  <span className="capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                    {Number(v)} pts
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ALGORITHM WEIGHTS */}
      {activeTab === "weights" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                Live Weight Configuration
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tune scoring parameters for Online vs. Home Tuition modes. Total weights should sum to ~100 points.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Mode Toggle */}
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                <button
                  type="button"
                  onClick={() => setSelectedMode("online")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedMode === "online"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Online Mode
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMode("home")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedMode === "home"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Home Tuition Mode
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingConfig ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Weight Sliders */}
          {currentWeights ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(currentWeights).map(([key, val]) => {
                const numericVal = Number(val) || 0;
                const readableLabel = key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase());

                return (
                  <div
                    key={key}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{readableLabel}</span>
                      <span className="font-black px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono">
                        {numericVal} pts
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="40"
                      step="1"
                      value={numericVal}
                      onChange={(e) =>
                        handleWeightChange(selectedMode, key, Number(e.target.value))
                      }
                      className="w-full accent-blue-600 cursor-pointer"
                    />

                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>0 pts (Disabled)</span>
                      <span>40 pts (Dominant)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">Loading configuration...</div>
          )}

          {/* Footer information */}
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-start gap-3 text-xs text-blue-900 dark:text-blue-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
            <div>
              <strong>Instant Cache Invalidation:</strong> Updates immediately flush the memory cache and take effect on all new student requests, offer rankings, and progressive tutor notification waves without requiring server restarts.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
