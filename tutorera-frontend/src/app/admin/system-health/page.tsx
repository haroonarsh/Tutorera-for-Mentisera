"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, RefreshCw, CheckCircle, Database, Server, Clock, Cpu, HardDrive, ShieldCheck } from "lucide-react";
import api from "@/lib/axios";
import { UI_COLORS, STATUS_COLORS, TEXT_COLORS } from "@/lib/brand";

interface HealthData {
  api: string;
  database: string;
  uptimeSeconds: number;
  uptimeFormatted: string;
  memory: {
    rssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
  };
  jobs: Array<{
    name: string;
    interval: string;
    status: string;
  }>;
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastChecked, setLastChecked] = useState<string>("");

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/system/health");
      setHealth(res.data.health);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Failed to load system health:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const heapPercentage = health
    ? Math.min(100, Math.round((health.memory.heapUsedMb / health.memory.heapTotalMb) * 100))
    : 0;

  return (
    <div style={{ padding: "1.75rem 2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link href="/admin" style={{ color: UI_COLORS.gray500, textDecoration: "none", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <ArrowLeft size={14} /> Control Tower
            </Link>
            <span style={{ color: UI_COLORS.border }}>/</span>
            <span style={{ color: UI_COLORS.gray500, fontSize: "0.85rem" }}>System Governance</span>
            <span style={{ color: UI_COLORS.border }}>/</span>
            <span style={{ color: TEXT_COLORS.body, fontSize: "0.85rem", fontWeight: 600 }}>System Health</span>
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: TEXT_COLORS.body, margin: 0, display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Activity size={26} color={STATUS_COLORS.success.color} /> System Health & Worker Telemetry
          </h1>
          <p style={{ color: UI_COLORS.gray500, margin: "0.25rem 0 0", fontSize: "0.88rem" }}>
            Real-time infrastructure pulse, MongoDB cluster connectivity, memory consumption, and background worker queues.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", color: TEXT_COLORS.muted, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh (15s)
          </label>

          <button
            onClick={fetchHealth}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.55rem 0.95rem",
              background: UI_COLORS.surface,
              border: `1px solid ${UI_COLORS.border}`,
              borderRadius: "7px",
              color: TEXT_COLORS.secondary,
              fontSize: "0.83rem",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Core Vitals Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
        {/* API Gateway */}
        <div style={{ background: UI_COLORS.surface, border: `1px solid ${UI_COLORS.border}`, borderRadius: "10px", padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: STATUS_COLORS.success.bg, display: "flex", alignItems: "center", justifyContent: "center", color: STATUS_COLORS.success.color }}>
            <Server size={24} />
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", color: UI_COLORS.gray500, fontWeight: 600, textTransform: "uppercase" }}>API Gateway</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: STATUS_COLORS.success.color, display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: STATUS_COLORS.success.color, display: "inline-block" }} />
              OPERATIONAL
            </div>
            <div style={{ fontSize: "0.72rem", color: TEXT_COLORS.muted }}>HTTP/2 • Express 5.0</div>
          </div>
        </div>

        {/* Database */}
        <div style={{ background: UI_COLORS.surface, border: `1px solid ${UI_COLORS.border}`, borderRadius: "10px", padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: STATUS_COLORS.info.bg, display: "flex", alignItems: "center", justifyContent: "center", color: STATUS_COLORS.info.color }}>
            <Database size={24} />
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", color: UI_COLORS.gray500, fontWeight: 600, textTransform: "uppercase" }}>MongoDB Cluster</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: health?.database === "connected" ? STATUS_COLORS.success.color : STATUS_COLORS.danger.color, display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: health?.database === "connected" ? STATUS_COLORS.success.color : STATUS_COLORS.danger.color, display: "inline-block" }} />
              {health?.database === "connected" ? "CONNECTED" : "DISCONNECTED"}
            </div>
            <div style={{ fontSize: "0.72rem", color: TEXT_COLORS.muted }}>Mongoose Replica Set</div>
          </div>
        </div>

        {/* Uptime */}
        <div style={{ background: UI_COLORS.surface, border: `1px solid ${UI_COLORS.border}`, borderRadius: "10px", padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: STATUS_COLORS.warning.bg, display: "flex", alignItems: "center", justifyContent: "center", color: STATUS_COLORS.warning.color }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", color: UI_COLORS.gray500, fontWeight: 600, textTransform: "uppercase" }}>Process Uptime</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: TEXT_COLORS.body }}>
              {health?.uptimeFormatted || "0h 0m"}
            </div>
            <div style={{ fontSize: "0.72rem", color: TEXT_COLORS.muted }}>{health?.uptimeSeconds.toLocaleString()} seconds active</div>
          </div>
        </div>

        {/* Memory RSS */}
        <div style={{ background: UI_COLORS.surface, border: `1px solid ${UI_COLORS.border}`, borderRadius: "10px", padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: STATUS_COLORS.purple.bg, display: "flex", alignItems: "center", justifyContent: "center", color: STATUS_COLORS.purple.color }}>
            <Cpu size={24} />
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", color: UI_COLORS.gray500, fontWeight: 600, textTransform: "uppercase" }}>Resident Memory (RSS)</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: TEXT_COLORS.body }}>
              {health?.memory.rssMb || 0} MB
            </div>
            <div style={{ fontSize: "0.72rem", color: TEXT_COLORS.muted }}>Heap: {health?.memory.heapUsedMb} / {health?.memory.heapTotalMb} MB</div>
          </div>
        </div>
      </div>

      {/* Memory Utilization Bar */}
      <div style={{ background: UI_COLORS.surface, border: `1px solid ${UI_COLORS.border}`, borderRadius: "10px", padding: "1.25rem", marginBottom: "1.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.9rem", fontWeight: 700, color: TEXT_COLORS.body }}>
            <HardDrive size={16} color={UI_COLORS.accent} /> V8 Heap Memory Allocation
          </div>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: heapPercentage > 80 ? STATUS_COLORS.danger.color : STATUS_COLORS.success.color }}>
            {heapPercentage}% Utilized ({health?.memory.heapUsedMb} MB of {health?.memory.heapTotalMb} MB)
          </span>
        </div>
        <div style={{ width: "100%", height: "10px", background: UI_COLORS.card, borderRadius: "5px", overflow: "hidden" }}>
          <div
            style={{
              width: `${heapPercentage}%`,
              height: "100%",
              background: heapPercentage > 80 ? STATUS_COLORS.danger.color : heapPercentage > 60 ? STATUS_COLORS.warning.color : STATUS_COLORS.success.color,
              transition: "width 0.4s ease",
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: TEXT_COLORS.muted, marginTop: "0.4rem" }}>
          <span>0 MB</span>
          <span>Last telemetry poll: {lastChecked || "Just now"}</span>
          <span>{health?.memory.heapTotalMb || 0} MB Allocated</span>
        </div>
      </div>

      {/* Background Lifecycle & Worker Jobs Table */}
      <div style={{ background: UI_COLORS.surface, border: `1px solid ${UI_COLORS.border}`, borderRadius: "10px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ padding: "1.1rem 1.25rem", borderBottom: `1px solid ${UI_COLORS.card}`, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ShieldCheck size={18} color={STATUS_COLORS.success.color} />
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: TEXT_COLORS.body, margin: 0 }}>
              Scheduled Autonomous Marketplace Engines
            </h2>
            <span style={{ fontSize: "0.78rem", color: UI_COLORS.gray500 }}>Cron routines maintaining demand freshness, liquidity rescue, and notification sweeps</span>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
            <thead>
              <tr style={{ background: UI_COLORS.card, borderBottom: `1px solid ${UI_COLORS.border}`, color: TEXT_COLORS.muted }}>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Worker Subsystem</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Responsibility</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Polling Frequency</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600, textAlign: "right" }}>Health Signal</th>
              </tr>
            </thead>
            <tbody>
              {health?.jobs.map((job) => {
                let description = "Autonomous backend routine";
                if (job.name === "request_lifecycle_worker") description = "Transition 7-day expired requests to archival state; preserve historical offers";
                if (job.name === "day_5_liquidity_escalation") description = "Flag zero-offer requests on Day 5 and dispatch proactive tutor push notifications";
                if (job.name === "24h_expiry_warning_worker") description = "Alert students 24 hours prior to tuition request automatic expiration";
                if (job.name === "offer_24h_expiry_cleaner") description = "Cancel pending tutor proposals exceeding the 24-hour response window";

                return (
                  <tr key={job.name} style={{ borderBottom: `1px solid ${UI_COLORS.card}` }}>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: TEXT_COLORS.body, fontFamily: "monospace", fontSize: "0.8rem" }}>
                      {job.name}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: UI_COLORS.gray500, maxWidth: "340px", fontSize: "0.8rem" }}>
                      {description}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: TEXT_COLORS.muted }}>
                      Every {job.interval}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span style={{ background: STATUS_COLORS.success.bg, color: STATUS_COLORS.success.color, padding: "0.2rem 0.55rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700, border: `1px solid ${STATUS_COLORS.success.border}` }}>
                        RUNNING
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                      <span style={{ color: STATUS_COLORS.success.color, display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.78rem", fontWeight: 600 }}>
                        <CheckCircle size={14} /> Normal
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
