"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { 
  MapPin, 
  BookOpen, 
  Clock, 
  Send, 
  PlusCircle, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  Filter
} from "lucide-react";
import api from "@/lib/axios";
import { formatMoney, timeAgo } from "@/lib/site";
import { COUNTRIES, getCitiesForCountry } from "@/lib/countries";
import PlaceBidModal from "@/components/Dashboard/PlaceBidModal";
import { useAuth } from "@/context/AuthContext";
import { useCurrentTime } from "@/hooks/useCurrentTime";

interface RequestItem {
  _id: string;
  subject: string;
  level: string;
  description: string;
  budget: number;
  currency?: string;
  countryCode?: string;
  countryName?: string;
  pricingUnit?: "hour" | "session" | "month" | "course";
  allowCounterOffers: boolean;
  teachingMode: string;
  city?: string;
  schedule: string;
  createdAt: string;
  expiresAt?: string;
  offersCount?: number;
  student: { 
    name?: string; 
    displayTitle?: string;
    city?: string; 
    countryCode?: string; 
    countryName?: string;
  };
  bid?: { 
    _id: string; 
    amount: number; 
    currency?: string; 
    status: string; 
    expiresAt: string; 
    pricingUnit?: "hour" | "session" | "month" | "course"; 
    createdAt: string 
  } | null;
}

const LEVELS = ["Primary", "Middle", "Matric", "Intermediate", "O-Level", "A-Level", "University", "Other"];

export default function TuitionRequestsPage() {
  const { user } = useAuth();
  const now = useCurrentTime();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [mode, setMode] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [bidModalRequest, setBidModalRequest] = useState<RequestItem | null>(null);

  const availableCities = country ? getCitiesForCountry(country) : [];

  const fetchRequests = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(pageNum), limit: "12" };
      if (subject) params.subject = subject;
      if (level) params.level = level;
      if (country) params.country = country;
      if (city) params.city = city;
      if (mode) params.teachingMode = mode;

      const res = await api.get(`/requests/public/preview?${new URLSearchParams(params).toString()}`);
      const reqList: RequestItem[] = res.data.requests || [];

      setRequests(reqList);
      setTotalCount(res.data.total ?? reqList.length);
      setTotalPages(Math.max(1, Math.ceil((res.data.total ?? reqList.length) / 12)));
    } catch (err) {
      console.error("Failed to fetch public requests:", err);
      setRequests([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [subject, level, country, city, mode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchRequests(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [subject, level, country, city, mode, fetchRequests]);

  useEffect(() => {
    fetchRequests(page);
  }, [page, fetchRequests]);

  return (
    <div style={{ backgroundColor: "#f8faff", minHeight: "100vh" }}>
      {/* Hero Header */}
      <section style={{ background: "linear-gradient(135deg, #021550 0%, #0329b2 100%)", color: "white", padding: "4rem 1.5rem 3rem" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", background: "rgba(255, 255, 255, 0.15)", padding: "0.3rem 0.85rem", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 700, marginBottom: "1rem" }}>
            <Sparkles size={14} color="#60a5fa" /> Live Student Demand Feed
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", fontWeight: 900, marginBottom: "0.75rem", letterSpacing: "-0.02em" }}>
            Active Tuition Requests
          </h1>
          <p style={{ color: "#bfdbfe", fontSize: "1.05rem", maxWidth: 650, margin: "0 auto 2rem", lineHeight: 1.6 }}>
            Real students and parents post their exact learning requirements and preferred budget. Verified tutors can approach students directly with transparent offers.
          </p>

          {/* Student Banner Action */}
          <div style={{ display: "inline-flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
            <Link
              href="/post-tuition-request"
              id="tuition-requests-post-btn"
              style={{
                background: "#ffffff",
                color: "#0329b2",
                padding: "0.85rem 1.75rem",
                borderRadius: "0.75rem",
                fontWeight: 800,
                fontSize: "0.95rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
              }}
            >
              <PlusCircle size={18} />
              <span>Post My Tuition Request</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        {/* Filters Box */}
        <div 
          style={{ 
            background: "white", 
            borderRadius: "1rem", 
            padding: "1.5rem", 
            border: "1px solid #e2e8f0", 
            boxShadow: "0 4px 16px rgba(2, 21, 80, 0.04)", 
            marginBottom: "2rem" 
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", color: "#021550", fontWeight: 700, fontSize: "0.9rem" }}>
            <Filter size={16} color="#0329b2" />
            <span>Filter Active Requests</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
            {/* Subject input */}
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Search subject (e.g. Mathematics)..."
                style={{
                  width: "100%",
                  padding: "0.65rem 0.85rem 0.65rem 2.2rem",
                  borderRadius: "0.5rem",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "0.85rem",
                  outline: "none",
                  boxSizing: "border-box",
                  color: "#021550",
                }}
              />
              <Search size={15} color="#94a3b8" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)" }} />
            </div>

            {/* Level select */}
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              style={{
                width: "100%",
                padding: "0.65rem 0.85rem",
                borderRadius: "0.5rem",
                border: "1.5px solid #cbd5e1",
                fontSize: "0.85rem",
                outline: "none",
                background: "white",
                color: level ? "#021550" : "#64748b",
              }}
            >
              <option value="">All Academic Levels</option>
              {LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>

            {/* Teaching Mode */}
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              style={{
                width: "100%",
                padding: "0.65rem 0.85rem",
                borderRadius: "0.5rem",
                border: "1.5px solid #cbd5e1",
                fontSize: "0.85rem",
                outline: "none",
                background: "white",
                color: mode ? "#021550" : "#64748b",
              }}
            >
              <option value="">All Modes (Online & Home)</option>
              <option value="online">Online Tuition</option>
              <option value="in-person">Home Tuition (In-Person)</option>
            </select>

            {/* Country */}
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setCity("");
              }}
              style={{
                width: "100%",
                padding: "0.65rem 0.85rem",
                borderRadius: "0.5rem",
                border: "1.5px solid #cbd5e1",
                fontSize: "0.85rem",
                outline: "none",
                background: "white",
                color: country ? "#021550" : "#64748b",
              }}
            >
              <option value="">All Countries</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>

            {/* City (if country selected) */}
            {availableCities.length > 0 && (
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "0.5rem",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "0.85rem",
                  outline: "none",
                  background: "white",
                  color: city ? "#021550" : "#64748b",
                }}
              >
                <option value="">All Cities</option>
                {availableCities.map((ct) => (
                  <option key={ct.id} value={ct.name}>{ct.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Requests Count Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", color: "#64748b", fontSize: "0.85rem" }}>
          <span>Showing <strong>{requests.length}</strong> active student requirements</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
            <ShieldCheck size={14} color="#10b981" /> 100% Privacy Protected & Anonymous Cards
          </span>
        </div>

        {/* Requests Grid */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))", gap: "1.25rem" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: "white", borderRadius: "1rem", padding: "1.5rem", border: "1px solid #e2e8f0", minHeight: "220px", animation: "pulse 1.5s infinite" }}>
                <div style={{ width: "60%", height: "18px", background: "#e2e8f0", borderRadius: "4px", marginBottom: "1rem" }} />
                <div style={{ width: "100%", height: "12px", background: "#f1f5f9", borderRadius: "4px", marginBottom: "0.5rem" }} />
                <div style={{ width: "80%", height: "12px", background: "#f1f5f9", borderRadius: "4px" }} />
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div style={{ background: "white", borderRadius: "1rem", padding: "4rem 2rem", textAlign: "center", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#021550", marginBottom: "0.5rem" }}>
              {subject || level || country || city || mode ? "No Open Requests Match These Filters" : "No Active Tuition Requests Right Now"}
            </h3>
            <p style={{ color: "#64748b", fontSize: "0.9rem", maxWidth: 460, margin: "0 auto 1.5rem" }}>
              {subject || level || country || city || mode
                ? "Reset your filters to browse all student requirements, or post your requirement to receive tutor offers."
                : "Post your requirement to receive customized offers from qualified tutors, or check back soon."}
            </p>
            <Link
              href="/post-tuition-request"
              style={{
                background: "#0329b2",
                color: "white",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.6rem",
                fontWeight: 700,
                fontSize: "0.88rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <PlusCircle size={16} /> Post Tuition Request
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))", gap: "1.25rem" }}>
            {requests.map((r) => {
              const studentDisplay = r.student?.displayTitle || 
                (r.student?.name ? `${r.student.name} in ${r.city || "Online"}` : `Student in ${r.city || r.countryName || "Worldwide"}`);

              return (
                <article
                  key={r._id}
                  style={{
                    background: "white",
                    borderRadius: "1rem",
                    border: "1.5px solid #e2e8f0",
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 4px 16px rgba(2, 21, 80, 0.04)",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  }}
                >
                  <div>
                    {/* Top Row: Subject & Budget */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <div>
                        <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#021550", margin: "0 0 0.25rem" }}>
                          {r.subject}
                        </h3>
                        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
                          <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#0329b2", background: "#eef5ff", padding: "0.15rem 0.55rem", borderRadius: "999px" }}>
                            {r.level}
                          </span>
                          <span style={{ fontSize: "0.72rem", background: "#ecfdf5", color: "#059669", padding: "0.15rem 0.55rem", borderRadius: "999px", fontWeight: 700 }}>
                            ⚡ {r.offersCount || 0} Offers
                          </span>
                          {r.expiresAt && now > 0 && (
                            <span style={{ fontSize: "0.72rem", background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", padding: "0.15rem 0.55rem", borderRadius: "999px", fontWeight: 700 }}>
                              ⏱️ {Math.max(1, Math.floor((new Date(r.expiresAt).getTime() - now) / (86400000)))}d left
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "#021550", display: "block" }}>
                          {r.currency || "PKR"} {Number(r.budget || 0).toLocaleString()}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                          per {r.pricingUnit || "hour"}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p style={{ color: "#475569", fontSize: "0.85rem", lineHeight: 1.5, margin: "0.75rem 0", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {r.description || "Student requirement for exam prep and syllabus mastery."}
                    </p>

                    {/* Metadata tags */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", fontSize: "0.76rem", color: "#64748b", marginBottom: "1rem" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                        <MapPin size={12} color="#016ef8" />
                        {r.city ? `${r.city}, ${r.countryName || ""}` : (r.countryName || "Worldwide Online")}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                        <BookOpen size={12} />
                        {r.teachingMode === "both" ? "Online / In-Person" : r.teachingMode}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                        <Clock size={12} />
                        {r.schedule}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer: Privacy Student Name & Actions */}
                  <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "0.85rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", fontSize: "0.78rem" }}>
                      <span style={{ color: "#475569", fontWeight: 600 }}>
                        {studentDisplay}
                      </span>
                      <span style={{ color: "#94a3b8", fontSize: "0.72rem" }}>
                        {timeAgo(r.createdAt)}
                      </span>
                    </div>

                    {/* Dual Action Buttons */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                      <button
                        type="button"
                        onClick={() => setBidModalRequest(r)}
                        id={`send-offer-btn-${r._id}`}
                        style={{
                          background: "#0329b2",
                          color: "white",
                          border: "none",
                          padding: "0.6rem",
                          borderRadius: "0.5rem",
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.35rem",
                          cursor: "pointer",
                          boxShadow: "0 2px 8px rgba(3, 41, 178, 0.25)",
                        }}
                      >
                        <Send size={13} />
                        <span>Send Offer</span>
                      </button>

                      <Link
                        href="/post-tuition-request"
                        style={{
                          background: "#f8fafc",
                          color: "#021550",
                          border: "1px solid #cbd5e1",
                          padding: "0.6rem",
                          borderRadius: "0.5rem",
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          textAlign: "center",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        Post Similar
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem", marginTop: "2.5rem" }}>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                background: "white",
                border: "1px solid #cbd5e1",
                padding: "0.5rem 0.85rem",
                borderRadius: "0.5rem",
                cursor: page <= 1 ? "not-allowed" : "pointer",
                opacity: page <= 1 ? 0.5 : 1,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{
                background: "white",
                border: "1px solid #cbd5e1",
                padding: "0.5rem 0.85rem",
                borderRadius: "0.5rem",
                cursor: page >= totalPages ? "not-allowed" : "pointer",
                opacity: page >= totalPages ? 0.5 : 1,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Place Bid Modal if open */}
      {bidModalRequest && (
        <PlaceBidModal
          request={bidModalRequest as any}
          onClose={() => setBidModalRequest(null)}
          onSuccess={() => {
            setBidModalRequest(null);
            fetchRequests(page);
          }}
        />
      )}
    </div>
  );
}
