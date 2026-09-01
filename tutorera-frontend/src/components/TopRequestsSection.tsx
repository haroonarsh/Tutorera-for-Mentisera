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
          <h2 id="requests-title">Active Tuition Requests</h2>
          <p className={s.subtitle}>
            Real students across Pakistan have posted tuition needs. Browse a request to see how offers and
            booking work, or post your own requirement.
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
          <p className={s.message}>Couldn't load requests right now. Please try again later.</p>
        )}

        {!loading && !errored && requests.length === 0 ? (
          <div className={s.empty}>
            <p>No open tuition requests at the moment. Be the first to post one.</p>
            <Link className={s.primaryCta} href="/dashboard?tab=requests">
              Post a tuition request
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
                    <span className={s.price}>{formatPKR(r.budget || 0, r.pricingUnit || "hour")}</span>
                  </header>
                  <span className={s.levelBadge}>{r.level}</span>
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
                      {initials(r.student?.name)}
                    </span>
                    <span className={s.studentName}>{r.student?.name}</span>
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
