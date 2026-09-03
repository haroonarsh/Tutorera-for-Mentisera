"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";

type Metrics = Record<string, number | null>;
type RequestRow = { _id: string; subject: string; city?: string; level?: string; teachingMode?: string; budget?: number; status: string; flaggedForModeration?: boolean; moderationReasons?: string[]; createdAt: string; student?: { name: string } };
type OfferRow = { _id: string; amount: number; initialStudentRate?: number; pricingUnit?: string; status: string; flaggedForModeration?: boolean; moderationReasons?: string[]; createdAt: string; tutor?: { name: string }; request?: { subject: string; city?: string; level?: string; teachingMode?: string; budget?: number; status?: string } };
type HistoryRow = { _id: string; senderRole: string; amount: number; message?: string; status: string; flaggedForModeration?: boolean; createdAt: string };

const labels: Record<string, string> = {
  totalRequests: "Total requests",
  activeRequests: "Active requests",
  totalOffers: "Tutor offers",
  averageOffersPerRequest: "Average offers / request",
  averageMinutesToFirstOffer: "Minutes to first offer",
  offerAcceptanceRate: "Offer acceptance",
  bookingsGenerated: "Bookings generated",
  conversionRate: "Request conversion",
  marketplaceGMV: "Marketplace GMV",
  platformRevenue: "Platform revenue",
  completionRate: "Completion rate",
  cancellationRate: "Cancellation rate",
  disputeRate: "Dispute rate",
  negotiationEvents: "Negotiation events",
  averageNegotiatedDiscount: "Negotiated discount",
  averageAgreedHourlyRate: "Agreed hourly rate",
  averageTutorResponseMinutes: "Tutor response minutes",
};

function formatMetric(key: string, value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  if (key.toLowerCase().includes("rate") || key.toLowerCase().includes("discount") || ["conversionRate", "completionRate", "cancellationRate", "disputeRate"].includes(key)) return `${value.toFixed(1)}%`;
  if (key.includes("GMV") || key.includes("Revenue") || key.includes("HourlyRate")) return `PKR ${value.toLocaleString()}`;
  return value.toFixed(key.toLowerCase().includes("average") ? 1 : 0);
}

export default function Page() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [selected, setSelected] = useState<{ offer: OfferRow; history: HistoryRow[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadMarketplace() {
      setLoading(true);
      setLoadError("");
      const [metricsResult, requestsResult, offersResult] = await Promise.allSettled([
        api.get("/admin/marketplace-analytics"),
        api.get("/admin/marketplace/requests"),
        api.get("/admin/marketplace/offers", { params: { flagged: true } }),
      ]);

      if (cancelled) return;

      if (metricsResult.status === "fulfilled") setMetrics(metricsResult.value.data.metrics);
      if (requestsResult.status === "fulfilled") setRequests(requestsResult.value.data.requests ?? []);
      if (offersResult.status === "fulfilled") setOffers(offersResult.value.data.offers ?? []);

      if ([metricsResult, requestsResult, offersResult].some((result) => result.status === "rejected")) {
        setLoadError("Some marketplace admin data could not be loaded. Please refresh or try again.");
      }
      setLoading(false);
    }

    loadMarketplace();
    return () => { cancelled = true; };
  }, []);

  async function inspectOffer(id: string) {
    try {
      const res = await api.get(`/admin/marketplace/offers/${id}`);
      setSelected({ offer: res.data.offer, history: res.data.history ?? [] });
    } catch {
      setLoadError("Could not load this negotiation. Please try again.");
    }
  }

  return (
    <main style={{ padding: "2rem", maxWidth: 1180, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.8rem" }}>Marketplace Analytics</h1>
      <p style={{ color: "#64748b", margin: ".5rem 0 2rem" }}>Operational request, offer, negotiation, conversion, pricing and trust signals.</p>
      {loadError && <p role="alert" style={{ color: "#b45309", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: 12 }}>{loadError}</p>}
      {loading && !metrics ? <p>Loading...</p> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 16 }}>{Object.entries(metrics ?? {}).map(([key, value]) => <article key={key} style={panel}><p style={muted}>{labels[key] || key}</p><strong style={{ fontSize: 24 }}>{formatMetric(key, value)}</strong></article>)}</div>}

      <section style={{ marginTop: 28 }}>
        <h2 style={sectionTitle}>Moderation Queue</h2>
        <div style={{ display: "grid", gap: 12 }}>
          {offers.length === 0 ? <p style={muted}>No flagged offers currently need review.</p> : offers.map(offer => <article key={offer._id} style={panel}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div><strong>{offer.request?.subject || "Offer"}</strong><p style={muted}>{offer.tutor?.name || "Tutor"} · {offer.request?.city || "Online"} · {offer.status}</p></div>
              <div style={{ textAlign: "right" }}><strong>PKR {offer.amount.toLocaleString()}/{offer.pricingUnit || "hour"}</strong><p style={muted}>Student rate PKR {(offer.initialStudentRate || offer.request?.budget || 0).toLocaleString()}</p></div>
            </div>
            <p style={{ ...muted, marginTop: 8 }}>Flags: {(offer.moderationReasons || []).join(", ") || "manual review"}</p>
            <button onClick={() => inspectOffer(offer._id)} style={button}>Inspect negotiation</button>
          </article>)}
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 style={sectionTitle}>Recent Requests</h2>
        <div style={{ display: "grid", gap: 10 }}>
          {requests.slice(0, 20).map(request => <article key={request._id} style={panel}><strong>{request.subject}</strong><p style={muted}>{request.student?.name || "Student"} · {request.city || "Online"} · {request.level || "Any level"} · {request.teachingMode || "mode open"} · PKR {(request.budget || 0).toLocaleString()} · {request.status}</p>{request.flaggedForModeration && <p style={{ color: "#b45309", fontSize: 13 }}>Flags: {(request.moderationReasons || []).join(", ")}</p>}</article>)}
        </div>
      </section>

      {selected && <div role="dialog" aria-modal="true" aria-label="Offer detail" style={overlay}><div style={modal}><button onClick={() => setSelected(null)} style={{ ...button, marginLeft: "auto" }}>Close</button><h2 style={sectionTitle}>Negotiation Inspection</h2><p style={muted}>{selected.offer.tutor?.name || "Tutor"} · {selected.offer.status} · PKR {selected.offer.amount.toLocaleString()}/{selected.offer.pricingUnit || "hour"}</p><ol style={{ borderLeft: "2px solid #bfdbfe", paddingLeft: 20 }}>{selected.history.map(row => <li key={row._id} style={{ marginBottom: 12 }}><strong>{row.senderRole} proposed PKR {row.amount.toLocaleString()}</strong><br /><small>{new Date(row.createdAt).toLocaleString("en-PK")} · {row.status}{row.flaggedForModeration ? " · flagged" : ""}</small>{row.message && <p>{row.message}</p>}</li>)}</ol></div></div>}
    </main>
  );
}

const panel = { background: "white", padding: 18, border: "1px solid #e2e8f0", borderRadius: 8 } as const;
const muted = { fontSize: 13, color: "#64748b", margin: "4px 0" } as const;
const sectionTitle = { fontSize: 20, margin: "0 0 12px" } as const;
const button = { marginTop: 10, border: "1px solid #cbd5e1", borderRadius: 8, background: "white", padding: "8px 12px", fontWeight: 700, cursor: "pointer" } as const;
const overlay = { position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", display: "grid", placeItems: "center", padding: 20, zIndex: 1000 } as const;
const modal = { background: "white", borderRadius: 8, padding: 24, maxWidth: 640, width: "100%", maxHeight: "85vh", overflow: "auto" } as const;
