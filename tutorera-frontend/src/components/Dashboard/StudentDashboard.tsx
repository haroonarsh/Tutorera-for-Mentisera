// components/dashboard/StudentDashboard.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import axiosInstance from "@/lib/axios";
import { DashRequest, DashBid, DashBooking } from "@/types/dashboard";
import PostRequestModal from "./PostRequestModal";
import s from "@/app/dashboard/dashboard.module.css";
import { useRouter } from "next/navigation";

const C = {
  primary: '#1a1a2e',
  accent: '#2563eb',
  highlight: '#e94560',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    open: s.badgeOpen, closed: s.badgeClosed, cancelled: s.badgeCancelled,
    upcoming: s.badgeUpcoming, ongoing: s.badgeOngoing, completed: s.badgeCompleted,
  };
  return `${s.badge} ${map[status] ?? s.badgeOpen}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString("en-PK", { day: "numeric", month: "short" });
}

function Avatar({ name, avatar, size = 40 }: { name: string; avatar?: string; size?: number }) {
  return (
    <div className={size === 40 ? s.personAvatar : s.bidAvatar}>
      {avatar
        ? <img src={avatar} alt={name} />
        : name.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Booking Card ─────────────────────────────────────────────────────────────

function BookingCard({ booking }: { booking: DashBooking }) {
  const [creatingChat, setCreatingChat] = useState(false);
  const router = useRouter();

  const handleChatClick = async () => {
    setCreatingChat(true);
    try {
      const res = await axiosInstance.post("/chat/conversation", {
        bookingId: booking._id,
      });
      const conversationId = res.data.conversation._id;
      router.push(`/chat/${conversationId}`);
    } catch (err) {
      console.error("Failed to create conversation:", err);
    } finally {
      setCreatingChat(false);
    }
  };

  return (
    <div className={s.card}>
      <div className={s.personRow}>
        <Avatar name={booking.tutor.name} avatar={booking.tutor.avatar} />
        <div>
          <p className={s.personName}>{booking.tutor.name}</p>
          <p className={s.personSub}>Your Tutor</p>
        </div>
        <span className={statusBadgeClass(booking.status)} style={{ marginLeft: "auto" }}>
          {booking.status}
        </span>
      </div>
      <button
        onClick={handleChatClick}
        disabled={creatingChat}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.5rem 1rem', backgroundColor: creatingChat ? '#e5e7eb' : '#eff6ff',
          color: creatingChat ? '#9ca3af' : '#2563eb', borderRadius: '0.5rem',
          border: '1px solid #bfdbfe', fontSize: '0.8rem', fontWeight: '600',
          cursor: creatingChat ? 'not-allowed' : 'pointer', marginBottom: '0.5rem'
        }}>
        {creatingChat ? "Opening..." : "💬 Chat"}
      </button>

      <div className={s.infoRow}>
        <span className={s.infoChip}>
          <svg width={12} height={12} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
          </svg>
          PKR {booking.amount.toLocaleString()}/hr
        </span>
        <span className={s.infoChip}>
          <svg width={12} height={12} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          {booking.schedule}
        </span>
        <span className={s.infoChip}>{booking.teachingMode}</span>
      </div>
      <p className={s.cardMeta} style={{ marginTop: 8 }}>Booked {timeAgo(booking.createdAt)}</p>
    </div>
  );
}

// ─── Request Card (with expandable bids) ─────────────────────────────────────

function RequestCard({
  request,
  onBidAccepted,
}: {
  request: DashRequest;
  onBidAccepted: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [bids, setBids] = useState<DashBid[]>([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);

  async function loadBids() {
    if (bids.length > 0) { setExpanded(!expanded); return; }
    setExpanded(true);
    setBidsLoading(true);
    try {
      const res = await axiosInstance.get(`/requests/${request._id}/bids`);
      setBids(res.data.bids ?? []);
    } catch {
      setBids([]);
    } finally {
      setBidsLoading(false);
    }
  }

  async function acceptBid(bidId: string) {
    setAccepting(bidId);
    try {
      await axiosInstance.patch(`/requests/${request._id}/bids/${bidId}/accept`);
      onBidAccepted();
    } catch (err) {
      console.error("Failed to accept bid:", err);
    } finally {
      setAccepting(null);
    }
  }

  return (
    <div className={s.card}>
      <div className={s.cardHeader}>
        <div style={{ flex: 1 }}>
          <h3 className={s.cardTitle}>{request.subject}</h3>
          <div className={s.cardMeta}>
            <span>{request.level}</span>
            <span>·</span>
            <span>{request.city}</span>
            <span>·</span>
            <span>{timeAgo(request.createdAt)}</span>
          </div>
        </div>
        <span className={statusBadgeClass(request.status)}>{request.status}</span>
      </div>

      <p className={s.cardDesc}>{request.description}</p>

      <div className={s.infoRow}>
        <span className={s.infoChip}>
          <svg width={12} height={12} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
          </svg>
          Budget: PKR {request.budget.toLocaleString()}/hr
        </span>
        <span className={s.infoChip}>{request.teachingMode}</span>
        <span className={s.infoChip}>{request.schedule}</span>
      </div>

      {/* Expand bids — only for open requests */}
      {request.status === "open" && (
        <>
          <button
          onClick={loadBids}
            className={s.expandBtn}
            >
          <svg
            width={12} height={12} viewBox="0 0 20 20" fill="currentColor"
            style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
            aria-hidden="true"
           >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
            {expanded ? "Hide Bids" : "View Bids"}
          </button>

          {expanded && (
            <div className={s.bidsSection}>
              <p className={s.bidsSectionTitle}>Tutor Bids</p>
              {bidsLoading ? (
                <div className={s.spinner} />
              ) : bids.length === 0 ? (
                <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                  No bids yet. Tutors will bid on your request soon.
                </p>
              ) : (
                bids.map((bid) => (
                  <div key={bid._id} className={s.bidCard}>
                    <div className={s.bidAvatar}>
                      {bid.tutor.avatar
                        ? <img src={bid.tutor.avatar} alt={bid.tutor.name} />
                        : bid.tutor.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={s.bidBody}>
                      <p className={s.bidTutorName}>{bid.tutor.name}</p>
                      <p className={s.bidAmount}>PKR {bid.amount.toLocaleString()}/hr</p>
                      <p className={s.bidMessage}>{bid.message}</p>
                      <div className={s.bidActions}>
                        <Link href={`/tutors/${bid.tutor._id}`} className={s.btnOutline}
                          style={{ fontSize: 12, padding: "6px 12px", textDecoration: "none",
                            display: "inline-flex", border: "1.5px solid #e5e7eb",
                            borderRadius: 8, color: "#374151", fontWeight: 500 }}>
                          View Profile
                        </Link>
                        {bid.status === "pending" && (
                          <button
                            onClick={() => acceptBid(bid._id)}
                            disabled={accepting === bid._id}
                            className={s.btnSuccess}
                          >
                            {accepting === bid._id ? "Accepting…" : "✓ Accept Bid"}
                          </button>
                        )}
                        {bid.status !== "pending" && (
                          <span className={`${s.badge} ${bid.status === "accepted" ? s.badgeAccepted : s.badgeCancelled}`}>
                            {bid.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Student Dashboard ────────────────────────────────────────────────────────

type Tab = "requests" | "bookings";

interface Props {
  userName: string;
  userAvatar?: string;
}

export default function StudentDashboard({ userName, userAvatar }: Props) {
  const [tab, setTab]                   = useState<Tab>("requests");
  const [requests, setRequests]         = useState<DashRequest[]>([]);
  const [bookings, setBookings]         = useState<DashBooking[]>([]);
  const [loadingR, setLoadingR]         = useState(true);
  const [loadingB, setLoadingB]         = useState(true);
  const [showModal, setShowModal]       = useState(false);

const fetchRequests = useCallback(async () => {
  setLoadingR(true);
  try {
    const res = await axiosInstance.get("/requests/my"); // ← was /api/requests
    setRequests(res.data.requests ?? []);                    // ← same, works fine
  } catch { setRequests([]); }
  finally { setLoadingR(false); }
}, []);

  const fetchBookings = useCallback(async () => {
    setLoadingB(true);
    try {
      const res = await axiosInstance.get("/bookings");
      setBookings(res.data.bookings ?? []);
    } catch { setBookings([]); }
    finally { setLoadingB(false); }
  }, []);

  useEffect(() => { fetchRequests(); fetchBookings(); }, [fetchRequests, fetchBookings]);

  const openCount     = requests.filter((r) => r.status === "open").length;
  const upcomingCount = bookings.filter((b) => b.status === "upcoming").length;
  const completedCount = bookings.filter((b) => b.status === "completed").length;

  const isTab = (t: Tab): boolean => tab === t;
  return (
    <>
      {/* Header */}
      <div className={s.header}>
        <div className={s.headerInner}>
          <div className={s.headerLeft}>
            <div className={s.avatar}>
              {userAvatar ? <img src={userAvatar} alt={userName} /> : userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className={s.greeting}>Welcome back, {userName}! 👋</h1>
              <span className={s.roleBadge}>
                <svg width={10} height={10} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
                Student Account
              </span>
            </div>
          </div>
          <button onClick={() => setShowModal(true)} className={s.btnPrimary}>
            <svg width={14} height={14} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Post a Request
          </button>
        </div>
      </div>

      <div className={s.content}>
        {/* Stats */}
        <div className={s.stats}>
          <div className={s.statCard}>
            <div className={s.statIcon} style={{ background: "rgba(37,99,235,0.1)" }}>
              <svg width={22} height={22} viewBox="0 0 20 20" fill="#2563eb" aria-hidden="true">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <div className={s.statValue}>{requests.length}</div>
              <div className={s.statLabel}>Total Requests</div>
            </div>
          </div>

          <div className={s.statCard}>
            <div className={s.statIcon} style={{ background: "rgba(16,185,129,0.1)" }}>
              <svg width={22} height={22} viewBox="0 0 20 20" fill="#10b981" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <div className={s.statValue}>{openCount}</div>
              <div className={s.statLabel}>Open Requests</div>
            </div>
          </div>

          <div className={s.statCard}>
            <div className={s.statIcon} style={{ background: "rgba(245,158,11,0.1)" }}>
              <svg width={22} height={22} viewBox="0 0 20 20" fill="#d97706" aria-hidden="true">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            </div>
            <div>
              <div className={s.statValue}>{upcomingCount}</div>
              <div className={s.statLabel}>Upcoming Sessions</div>
            </div>
          </div>

          <div className={s.statCard}>
            <div className={s.statIcon} style={{ background: "rgba(107,114,128,0.1)" }}>
              <svg width={22} height={22} viewBox="0 0 20 20" fill="#6b7280" aria-hidden="true">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div>
              <div className={s.statValue}>{completedCount}</div>
              <div className={s.statLabel}>Completed Sessions</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <nav aria-label="Dashboard sections" className={s.tabs}>
        <button
        onClick={() => setTab("requests")}
        aria-current={tab === "requests" ? "true" : undefined}
          className={`${s.tab} ${tab === "requests" ? s.tabActive : ""}`}
          >
          ...My Requests
          </button>

        <button
          onClick={() => setTab("bookings")}
          aria-current={tab === "bookings" ? "true" : undefined}
          className={`${s.tab} ${tab === "bookings" ? s.tabActive : ""}`}
        >
          ...My Bookings
        </button>
        </nav>

        {/* Tab: My Requests */}
        {tab === "requests" && (
          <section aria-label="My tuition requests">
            <div className={s.sectionHeader}>
              <h2 className={s.sectionTitle}>My Requests</h2>
              <button onClick={() => setShowModal(true)} className={s.btnPrimary}>
                + New Request
              </button>
            </div>

            {loadingR ? (
              <div className={s.spinner} />
            ) : requests.length === 0 ? (
              <div className={s.empty}>
                <div className={s.emptyIcon}>📋</div>
                <p className={s.emptyTitle}>No requests yet</p>
                <p className={s.emptyDesc}>Post your first tuition request and receive bids from tutors.</p>
                <button onClick={() => setShowModal(true)} className={s.btnPrimary}>
                  Post a Request
                </button>
              </div>
            ) : (
              requests.map((r) => (
                <RequestCard key={r._id} request={r} onBidAccepted={() => {
                  fetchRequests();
                  fetchBookings();
                }} />
              ))
            )}
          </section>
        )}

        {/* Tab: My Bookings */}
        {tab === "bookings" && (
          <section aria-label="My bookings">
            <div className={s.sectionHeader}>
              <h2 className={s.sectionTitle}>My Bookings</h2>
            </div>

            {loadingB ? (
              <div className={s.spinner} />
            ) : bookings.length === 0 ? (
              <div className={s.empty}>
                <div className={s.emptyIcon}>📅</div>
                <p className={s.emptyTitle}>No bookings yet</p>
                <p className={s.emptyDesc}>Accept a tutor bid from your requests to create a booking.</p>
              </div>
            ) : (
              bookings.map((b) => <BookingCard key={b._id} booking={b} />)
            )}
          </section>
        )}
      </div>

      {showModal && (
        <PostRequestModal
          onClose={() => setShowModal(false)}
          onSuccess={fetchRequests}
        />
      )}
    </>
  );
}