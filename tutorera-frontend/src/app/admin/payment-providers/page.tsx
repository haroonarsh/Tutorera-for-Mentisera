"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, Activity, ArrowRight, Settings } from "lucide-react";
import api from "@/lib/axios";

interface MarketConfig {
  _id: string;
  countryCode: string;
  countryName: string;
  paymentProvider?: string;
  paymentsEnabled: boolean;
  payoutsEnabled: boolean;
  isActive: boolean;
  launchStatus: string;
}

export default function PaymentProvidersPage() {
  const [markets, setMarkets] = useState<MarketConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const res = await api.get("/admin/markets");
        setMarkets(res.data.markets || []);
      } catch (err) {
        console.error("Failed to load markets", err);
        setError("Failed to load payment provider configurations.");
      } finally {
        setLoading(false);
      }
    };
    fetchMarkets();
  }, []);

  // Group markets by payment provider
  const providersMap: Record<string, MarketConfig[]> = {};
  
  markets.forEach(market => {
    if (market.launchStatus !== "live" && market.launchStatus !== "beta") return;
    
    const provider = market.paymentProvider || "none";
    if (!providersMap[provider]) {
      providersMap[provider] = [];
    }
    providersMap[provider].push(market);
  });

  const getProviderDisplayName = (key: string) => {
    switch(key) {
      case "stripe": return "Stripe";
      case "rapid_gateway": return "Rapid Gateway (Safepay)";
      case "none": return "No Provider Attached";
      default: return key;
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "bold", color: "#021550", marginBottom: "0.5rem" }}>
            Payment Providers
          </h1>
          <p style={{ color: "#4b5563" }}>
            View live payment gateway configurations mapped across active global markets.
          </p>
        </div>
        <Link 
          href="/admin/markets" 
          style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.25rem", background: "#f1f5f9", color: "#0f172a", borderRadius: "0.5rem", textDecoration: "none", fontWeight: "600", fontSize: "0.9rem" }}
        >
          <Settings size={16} /> Manage in Markets
        </Link>
      </div>
      
      {loading ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>Loading provider configurations...</div>
      ) : error ? (
        <div style={{ padding: "1rem", background: "#fef2f2", color: "#dc2626", borderRadius: "0.5rem" }}>{error}</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
          {Object.entries(providersMap).map(([providerKey, groupedMarkets]) => (
            <div key={providerKey} style={{ padding: "1.5rem", border: "1px solid #e2e8f0", borderRadius: "0.75rem", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ padding: "0.75rem", background: providerKey === "none" ? "#f1f5f9" : "#eff6ff", borderRadius: "0.5rem", color: providerKey === "none" ? "#64748b" : "#3b82f6" }}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0f172a" }}>
                    {getProviderDisplayName(providerKey)}
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: providerKey === "none" ? "#94a3b8" : "#10b981", fontSize: "0.8rem", fontWeight: "600", marginTop: "0.25rem" }}>
                    <Activity size={12} /> {groupedMarkets.length} active market(s)
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "1.5rem" }}>
                <h3 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: "600", marginBottom: "0.75rem" }}>Coverage</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {groupedMarkets.map(m => (
                    <span key={m._id} style={{ display: "inline-flex", alignItems: "center", padding: "0.25rem 0.6rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "0.375rem", fontSize: "0.85rem", color: "#334155", fontWeight: "500" }}>
                      {m.countryCode} - {m.countryName}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid #f1f5f9" }}>
                <Link 
                  href="/admin/markets"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.9rem", color: "#3b82f6", fontWeight: "600", textDecoration: "none" }}
                >
                  Configure <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
          
          {Object.keys(providersMap).length === 0 && (
            <div style={{ gridColumn: "1 / -1", padding: "3rem", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "0.5rem" }}>
              No active payment providers found across any live markets.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
