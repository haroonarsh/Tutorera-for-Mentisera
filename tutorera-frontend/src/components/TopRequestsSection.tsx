"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/axios";
import { formatPKR, timeAgo } from "@/lib/site";
import s from "./TopRequestsSection.module.css";

interface RequestPreview {
  _id: string;
  subject: string;
  level: string;
  pricingUnit?: "hour" | "session" | "month" | "course";
  budget: number;
  teachingMode: string;
  city?: string;
  schedule: string;
  createdAt: string;
  student: { name: string; city?: string; avatar?: string };
}

const LIMIT = 12;

function initials(name: string): string {
  return name
    ?.split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2) || "S";
}

export default function TopRequestsSection() {
  const [requests, setRequests] = useState<RequestPreview[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / LIMIT)), [total]);

  useEffect(() => {
    setLoading(true);
    setErrored(false);
    api
      .get(`/requests/public/preview?limit=${LIMIT}&page=${page}`)
      .then((res) => {
        setRequests(res.data.requests || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => {
        setErrored(true);
        setRequests([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [page]);

  const loadingSkeletons = Array.from({ length: 6 });

  return (
    <section className={s.root} aria-labelledby="requests-title">
      <div className={s.container}>
        <header className={s.head}>
          <p className={s.eyebrow}>Live student demand</p>
          <h2 id="requests-title">Students Looking for Tutors Right Now</h2>
          <p className={s.subtitle}>
            Real students have posted tuition needs. Browse active requests to see how offers and
            matching work, or post your own requirement.
          </p>
        </header>

        {loading && (
          <div className={s.grid}>
            {loadingSkeletons.map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className={s.skeleton}
                style={{ animationDelay: `${i * 45}ms` }}
                aria-hidden="true"
              />
            ))}
          </div>
        )}

        {!loading && errored && (
          <p className={s.message}>Couldn&apos;t load requests right now. Please try again later.</p>
        )}

        {!loading && !errored && requests.length === 0 ? (
          <div className={s.empty}>
            <p>Be among the first students to post · Tell us what you need and let verified tutors respond.</p>
            <Link className={s.primaryCta} href="/post-tuition-request">
              Post My Tuition Request
            </Link>
          </div>
        ) : (
          !loading &&
          !errored && (
            <div className={s.grid}>
              {requests.map((r, i) => (
                <article
                  key={r._id}
                  className={s.card}
                  style={{ animationDelay: `${i * 75}ms` }}
                >
                  <header className={s.cardHead}>
                    <h3>{r.subject}</h3>
                    <span className={s.price}>
                      {(r as any).currency || "PKR"} {Number(r.budget || 0).toLocaleString()}/{(r.pricingUnit || "hour")}
                    </span>
                  </header>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span className={s.levelBadge}>{r.level}</span>
                    <span style={{ fontSize: "0.72rem", background: "#ecfdf5", color: "#059669", padding: "0.2rem 0.5rem", borderRadius: "999px", fontWeight: 700 }}>
                      ⚡ {(r as any).offersCount || 0} Offers
                    </span>
                  </div>
                  <ul className={s.metaRow}>
                    <li>
                      <BookOpen size={13} aria-hidden="true" /> {r.teachingMode}
                    </li>
                    {r.city && (
                      <li>
                        <MapPin size={13} aria-hidden="true" /> {r.city}
                      </li>
                    )}
                    <li>
                      <Clock size={13} aria-hidden="true" /> {r.schedule}
                    </li>
                  </ul>
                  <footer className={s.cardFooter}>
                    <span className={s.avatar} aria-hidden="true">
                      {initials(r.student?.name || "Verified Student")}
                    </span>
                    <span className={s.studentName}>
                      {r.student?.name ? (r.student.name.split(" ")[0] + " in " + (r.city || "Pakistan")) : "Verified Student"}
                    </span>
                    <span className={s.posted}>Posted {timeAgo(r.createdAt)}</span>
                  </footer>
                </article>
              ))}
            </div>
          )
        )}

        {!loading && !errored && total > 0 && totalPages > 1 && (
          <nav className={s.pagination} aria-label="Requests pages">
            <button
              type="button"
              className={s.pageBtn}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className={s.pageInfo}>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className={s.pageBtn}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </nav>
        )}

        {!loading && !errored && (
          <div className={s.browseAll}>
            <Link className={s.textLink} href="/browse-requests">
              Browse all tuition requests <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
