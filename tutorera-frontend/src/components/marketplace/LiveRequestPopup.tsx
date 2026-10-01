"use client";

import api from "@/lib/axios";
import { ChevronRight, MapPin, ShieldCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface LiveRequestItem {
  id: string;
  location: string;
  country: string;
  subject: string;
  level: string;
  mode: string;
  budget: number;
  currency: string;
  pricingUnit: string;
  timeAgo: string;
  offersCount: number;
}

/** Privacy-safe previews of genuine marketplace demand only. */
export default function LiveRequestPopup() {
  const router = useRouter();
  const [requests, setRequests] = useState<LiveRequestItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.get("/requests/public/preview?limit=5")
      .then((res) => {
        const previews = (Array.isArray(res.data?.requests) ? res.data.requests : [])
          .filter((item: any) => item?._id && item?.subject)
          .map((item: any): LiveRequestItem => ({
            id: item._id,
            location: item.city || "Online",
            country: item.countryName || item.countryCode || "Global",
            subject: item.subject,
            level: item.level || "All levels",
            mode: item.teachingMode === "both" ? "Online & in person" : item.teachingMode || "Online",
            budget: Number(item.budget) || 0,
            currency: item.currency || "",
            pricingUnit: item.pricingUnit || "session",
            timeAgo: "Recently posted",
            offersCount: Number(item.offersCount) || 0,
          }));
        if (!cancelled && previews.length) { setRequests(previews); setVisible(true); }
      })
      .catch(() => { if (!cancelled) setRequests([]); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!visible || dismissed || requests.length < 2) return;
    const timer = window.setInterval(() => setCurrentIndex((index) => (index + 1) % requests.length), 18_000);
    return () => window.clearInterval(timer);
  }, [visible, dismissed, requests.length]);

  const request = requests[currentIndex];
  if (!visible || dismissed || !request) return null;
  const rate = request.budget > 0 && request.currency ? `${request.currency} ${request.budget.toLocaleString()}/${request.pricingUnit}` : "Budget shared after sign-in";

  return (
    <aside aria-label="Recent tuition request" style={{ position: "fixed", bottom: "1.5rem", left: "1.5rem", zIndex: 90, width: "min(23.5rem, calc(100vw - 3rem))", background: "#fff", border: "1px solid #bfdbfe", borderRadius: "1rem", boxShadow: "0 16px 40px -8px rgba(3,41,178,.22)", padding: "1rem 1.1rem", color: "#021550" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: ".75rem" }}>
        <span style={{ color: "#0329b2", fontSize: ".72rem", fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase" }}>Recent tuition request</span>
        <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss recent request" style={{ border: 0, background: "transparent", color: "#475569", minWidth: 44, minHeight: 44, cursor: "pointer", display: "grid", placeItems: "center" }}><X size={17} /></button>
      </div>
      <p style={{ margin: ".25rem 0 .35rem", fontSize: ".98rem", fontWeight: 800 }}>{request.subject}</p>
      <p style={{ margin: 0, color: "#475569", fontSize: ".8rem", display: "flex", gap: ".25rem", alignItems: "center" }}><MapPin size={13} color="#016ef8" /> {request.location}, {request.country}</p>
      <div style={{ display: "flex", justifyContent: "space-between", gap: ".75rem", margin: ".8rem 0", padding: ".65rem .75rem", background: "#f8faff", borderRadius: ".65rem", fontSize: ".78rem" }}><span>{request.level} · {request.mode}</span><strong style={{ color: "#047857", textAlign: "right" }}>{rate}</strong></div>
      <button type="button" onClick={() => router.push(`/browse-requests?request=${encodeURIComponent(request.id)}`)} style={{ width: "100%", minHeight: 44, border: 0, borderRadius: ".6rem", background: "#0329b2", color: "#fff", fontWeight: 800, cursor: "pointer", display: "inline-flex", justifyContent: "center", alignItems: "center", gap: ".35rem" }}>View request securely <ChevronRight size={16} /></button>
      <p style={{ margin: ".65rem 0 0", fontSize: ".69rem", color: "#64748b", display: "flex", alignItems: "center", gap: ".25rem" }}><ShieldCheck size={12} color="#047857" /> {request.offersCount} recorded offer{request.offersCount === 1 ? "" : "s"} · no contact details shown</p>
    </aside>
  );
}
