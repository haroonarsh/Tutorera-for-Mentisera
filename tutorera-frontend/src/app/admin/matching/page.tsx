"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Sliders,
  TrendingUp,
  Award,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Clock,
  Layers,
  Zap,
} from "lucide-react";
import axiosInstance from "@/lib/axios";
import { showSuccess, showError } from "@/lib/toast";

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
  const [activeTab, setActiveTab] = useState<"analytics" | "weights">("analytics");
  const [analytics, setAnalytics] = useState<MatchAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"online" | "home">("online");

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

  useEffect(() => {
    fetchAnalytics();
    fetchConfig();
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
      showSuccess("Matching weights successfully saved and activated!");
      fetchConfig();
    } catch {
      showError("Failed to update matching configuration.");
    } finally {
      setSavingConfig(false);
    }
  };

  const currentWeights = config ? (selectedMode === "online" ? config.onlineWeights : config.homeWeights) : null;

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
                {config?.activeVersion || "RULE_V1"}
              </span>
            </div>
            <p className="text-xs text-blue-200/80 mt-1">
              8-layer two-sided marketplace intelligence: compatibility, Bayesian ratings, reliability, and explainable scoring.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "analytics"
                ? "bg-white text-blue-900 shadow-md"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            Analytics & Conversion
          </button>
          <button
            onClick={() => setActiveTab("weights")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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
                {analytics?.totalMatches ?? "—"}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Across student requests & offers</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Average Match Score</span>
                <Award className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {analytics ? `${analytics.avgMatchScore}%` : "—"}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Target compatibility threshold: &ge; 70%</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Offer Conversion</span>
                <TrendingUp className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {analytics ? `${analytics.offerConversionRate}%` : "—"}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Matches converting to formal tutor offers</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Booking Conversion</span>
                <CheckCircle2 className="w-4 h-4 text-cyan-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {analytics ? `${analytics.bookingConversionRate}%` : "—"}
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
                <span className="text-xs text-slate-400">Past 30 Days</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-emerald-600 dark:text-emerald-400">Excellent Match (&ge; 90%)</span>
                    <span>{analytics?.tierDistribution.excellent || 0}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${
                          analytics && analytics.totalMatches > 0
                            ? Math.round((analytics.tierDistribution.excellent / analytics.totalMatches) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-blue-600 dark:text-blue-400">Great Match (80 - 89%)</span>
                    <span>{analytics?.tierDistribution.great || 0}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${
                          analytics && analytics.totalMatches > 0
                            ? Math.round((analytics.tierDistribution.great / analytics.totalMatches) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-purple-600 dark:text-purple-400">Good Match (70 - 79%)</span>
                    <span>{analytics?.tierDistribution.good || 0}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{
                        width: `${
                          analytics && analytics.totalMatches > 0
                            ? Math.round((analytics.tierDistribution.good / analytics.totalMatches) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-amber-600 dark:text-amber-400">Fair Match (60 - 69%)</span>
                    <span>{analytics?.tierDistribution.fair || 0}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{
                        width: `${
                          analytics && analytics.totalMatches > 0
                            ? Math.round((analytics.tierDistribution.fair / analytics.totalMatches) * 100)
                            : 0
                        }%`,
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

      {/* TAB 2: ALGORITHM WEIGHTS */}
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
              <strong>Instant Activation:</strong> Changes take effect immediately on all new student requests, offer rankings, and progressive tutor notification waves without requiring server restarts.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
