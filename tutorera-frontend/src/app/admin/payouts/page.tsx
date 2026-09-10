"use client";
import { UI_COLORS } from "@/lib/brand";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { showSuccess, showError } from "@/lib/toast";
import PayoutReportDownload from "@/components/Finance/PayoutReportDownload";
import { useAuth } from "@/context/AuthContext";

const C = UI_COLORS;

interface Booking {
  _id: string;
  student: { name: string; email: string };
  tutor: { _id: string; name: string; email: string; phone?: string; city?: string };
  amount: number;
  currency?: string;
  platformFee: number;
  tutorPayout: number;
  status: string;
  paymentStatus: string;
  payoutStatus: string;
  payoutNote?: string;
  teachingMode?: string;
  createdAt: string;
}

interface Stats {
  pendingCount: number;
  paidCount: number;
  currencyTotals: { currency: string; pendingAmount: number; paidAmount: number }[];
}

type FilterStatus = "all" | "pending" | "approved" | "processing" | "paid";

const statusColors: Record<string, { bg: string; color: string }> = {
  pending:   { bg: '#fef3c7', color: '#d97706' },
  approved:  { bg: '#eff6ff', color: '#2563eb' },
  processing:{ bg: '#f5f3ff', color: '#7c3aed' },
  paid:      { bg: '#f0fdf4', color: '#16a34a' },
  upcoming:  { bg: '#EEF5FF', color: '#0329B2' },
  completed: { bg: '#f0fdf4', color: '#16a34a' },
  ongoing:   { bg: '#fdf4ff', color: '#9333ea' },
  cancelled: { bg: '#fef2f2', color: '#ef4444' },
};

export default function PayoutsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const canProcessPayouts = user?.adminRole === "super_admin" || user?.adminPermissions?.includes("*") || user?.adminPermissions?.includes("payout.process");

  const fetchPayouts = async (status: FilterStatus) => {
    setLoading(true);
    try {
      const params = status === "all" ? "" : `?status=${status}`;
      const res = await api.get(`/admin/payouts${params}`);
      setBookings(res.data.bookings);
      setStats(res.data.stats);
    } catch {
      console.error("Failed to load payouts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts(filter);
  }, [filter]);

  const payoutAction = (status: string) => status === "pending" ? { next: "approved", label: "Approve" } : status === "approved" ? { next: "processing", label: "Start processing" } : status === "processing" ? { next: "paid", label: "Mark as paid" } : null;

  const handlePayoutAction = async (booking: Booking) => {
    const action = payoutAction(booking.payoutStatus);
    if (!action) return;
    setActionLoading(booking._id);
    try {
      await api.patch(`/admin/bookings/${booking._id}/payment`, {
        payoutStatus: action.next,
        payoutNote: `Manual payout ${action.next} by an administrator.`,
      });
      setBookings(prev =>
        prev.map(b => b._id === booking._id ? { ...b, payoutStatus: action.next, payoutNote: `Manual payout ${action.next} by an administrator.` } : b)
      );
      void fetchPayouts(filter);
      showSuccess(`Payout ${action.next}.`);
    } catch {
      showError("Failed to update payout status.");
    } finally {
      setActionLoading(null);
    }
  };

  const filterTabs: { key: FilterStatus; label: string }[] = [
    { key: "pending", label: `Pending (${stats?.pendingCount ?? 0})` },
    { key: "approved", label: "Approved" },
    { key: "processing", label: "Processing" },
    { key: "paid",    label: `Paid (${stats?.paidCount ?? 0})` },
    { key: "all",     label: "All" },
  ];

  return (
    <div style={{ padding: '2rem' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: C.primary }}>Payouts</h1>
        <p style={{ color: C.gray500, fontSize: '0.875rem' }}>
          Review confirmed-booking payouts through approval, processing, and completed settlement. No external payout provider is implied.
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>

        {/* Pending Amount */}
        <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.25rem 1.5rem', border: '1px solid #e5e7eb', borderLeft: '4px solid #f59e0b' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Pending Payouts
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: '800', color: C.primary }}>
            {stats?.currencyTotals?.map(item => `${item.currency} ${item.pendingAmount.toLocaleString()}`).join(" · ") || "No pending payouts"}
          </p>
          <p style={{ fontSize: '0.8rem', color: C.gray500, marginTop: '0.25rem' }}>
            {stats?.pendingCount ?? 0} tutors awaiting payment
          </p>
        </div>

        {/* Paid Amount */}
        <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.25rem 1.5rem', border: '1px solid #e5e7eb', borderLeft: '4px solid #16a34a' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Total Paid Out
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: '800', color: C.primary }}>
            {stats?.currencyTotals?.map(item => `${item.currency} ${item.paidAmount.toLocaleString()}`).join(" · ") || "No paid payouts"}
          </p>
          <p style={{ fontSize: '0.8rem', color: C.gray500, marginTop: '0.25rem' }}>
            {stats?.paidCount ?? 0} payouts completed
          </p>
        </div>

        {/* Manual settlement disclosure */}
        <div style={{ backgroundColor: '#fffbeb', borderRadius: '0.875rem', padding: '1.25rem 1.5rem', border: '1px solid #fde68a' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Settlement controls
          </p>
          <p style={{ fontSize: '0.875rem', fontWeight: '700', color: C.primary, fontFamily: 'monospace' }}>
            Manual review
          </p>
          <p style={{ fontSize: '0.75rem', color: '#a16207', marginTop: '0.25rem' }}>
            Record each approved, processing, and completed state with an audit note.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {filterTabs.map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '999px',
              fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer',
              backgroundColor: filter === tab.key ? C.primary : 'white',
              color: filter === tab.key ? 'white' : C.gray500,
              border: filter === tab.key ? 'none' : '1px solid #e5e7eb',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>

        {/* Desktop Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr 1.2fr', padding: '0.75rem 1.5rem', backgroundColor: C.gray50, borderBottom: '1px solid #e5e7eb' }}
          className="payouts-desktop-header">
          {["Tutor", "Student", "Amount", "Payout", "Session", "Payout Status", "Action"].map(h => (
            <p key={h} style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              {h}
            </p>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ width: '32px', height: '32px', border: `3px solid ${C.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : bookings.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: C.gray500 }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💸</p>
            <p style={{ fontWeight: '600', color: C.primary }}>No payouts found</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {filter === "pending"
                ? "All tutor payouts have been processed."
                : "No payout records match this filter."}
            </p>
          </div>
        ) : (
          bookings.map((booking, idx) => (
            <div key={booking._id} style={{ borderBottom: idx < bookings.length - 1 ? '1px solid #f3f4f6' : 'none' }}>

              {/* Desktop Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr 1.2fr', padding: '1rem 1.5rem', alignItems: 'center' }}
                className="payouts-desktop-row">

                {/* Tutor */}
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', color: C.primary, margin: 0 }}>{booking.tutor?.name}</p>
                  <p style={{ fontSize: '0.75rem', color: C.gray500, margin: 0 }}>{booking.tutor?.email}</p>
                  {booking.tutor?.phone && (
                    <p style={{ fontSize: '0.75rem', color: C.gray500, margin: 0 }}>{booking.tutor.phone}</p>
                  )}
                </div>

                {/* Student */}
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', color: C.primary, margin: 0 }}>{booking.student?.name}</p>
                  <p style={{ fontSize: '0.75rem', color: C.gray500, margin: 0 }}>{booking.student?.email}</p>
                </div>

                {/* Amount */}
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '700', color: C.primary, margin: 0 }}>
                    {booking.currency || "PKR"} {(booking.amount || 0).toLocaleString()}
                  </p>
                  <p style={{ fontSize: '0.7rem', color: C.gray500, margin: 0 }}>
                    Fee: {booking.currency || "PKR"} {(booking.platformFee || 0).toLocaleString()}
                  </p>
                </div>

                {/* Tutor Payout */}
                <p style={{ fontSize: '0.95rem', fontWeight: '800', color: '#16a34a', margin: 0 }}>
                  {booking.currency || "PKR"} {(booking.tutorPayout || 0).toLocaleString()}
                </p>

                {/* Session Status */}
                <span style={{
                  fontSize: '0.75rem', fontWeight: '600', padding: '0.2rem 0.6rem',
                  borderRadius: '999px', width: 'fit-content',
                  backgroundColor: statusColors[booking.status]?.bg || '#f3f4f6',
                  color: statusColors[booking.status]?.color || C.gray500,
                  textTransform: 'capitalize',
                }}>
                  {booking.status}
                </span>

                {/* Payout Status */}
                <span style={{
                  fontSize: '0.75rem', fontWeight: '600', padding: '0.2rem 0.6rem',
                  borderRadius: '999px', width: 'fit-content',
                  backgroundColor: statusColors[booking.payoutStatus]?.bg || '#f3f4f6',
                  color: statusColors[booking.payoutStatus]?.color || C.gray500,
                  textTransform: 'capitalize',
                }}>
                  {booking.payoutStatus || 'pending'}
                </span>

                {/* Action */}
                {booking.payoutStatus === "paid" ? (
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600', margin: 0 }}>✓ Paid</p>
                    {booking.payoutNote && (
                      <p style={{ fontSize: '0.7rem', color: C.gray500, margin: 0 }}>{booking.payoutNote}</p>
                    )}
                    {booking.tutor?._id && (
                      <PayoutReportDownload endpoint={`/admin/tutors/${booking.tutor._id}/payout-report/pdf`} label="Statement PDF" compact />
                    )}
                  </div>
                ) : payoutAction(booking.payoutStatus) && canProcessPayouts ? (
                  <button
                    onClick={() => handlePayoutAction(booking)}
                    disabled={actionLoading === booking._id}
                    style={{
                      padding: '0.45rem 0.875rem', borderRadius: '0.4rem',
                      backgroundColor: actionLoading === booking._id ? '#e5e7eb' : '#f0fdf4',
                      color: actionLoading === booking._id ? C.gray500 : '#16a34a',
                      fontWeight: '700', fontSize: '0.75rem',
                      cursor: actionLoading === booking._id ? 'not-allowed' : 'pointer',
                      border: '1px solid #bbf7d0',
                      whiteSpace: 'nowrap',
                    }}>
                    {actionLoading === booking._id ? 'Saving...' : payoutAction(booking.payoutStatus)?.label}
                  </button>
                ) : null}
              </div>

              {/* Mobile Card */}
              <div style={{ padding: '1rem 1.25rem' }} className="payouts-mobile-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <p style={{ fontWeight: '700', color: C.primary, fontSize: '0.9rem', margin: 0 }}>
                      {booking.tutor?.name}
                    </p>
                    <p style={{ color: C.gray500, fontSize: '0.75rem', margin: '0.1rem 0 0' }}>
                      Tutor · {booking.tutor?.email}
                    </p>
                  </div>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: '600', padding: '0.2rem 0.5rem',
                    borderRadius: '999px', flexShrink: 0,
                    backgroundColor: statusColors[booking.payoutStatus]?.bg || '#fef3c7',
                    color: statusColors[booking.payoutStatus]?.color || '#d97706',
                    textTransform: 'capitalize',
                  }}>
                    {booking.payoutStatus || 'pending'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: C.gray500, margin: 0 }}>Student: {booking.student?.name}</p>
                    <p style={{ fontSize: '0.875rem', fontWeight: '700', color: '#16a34a', margin: '0.25rem 0 0' }}>
                      Payout: {booking.currency || "PKR"} {(booking.tutorPayout || 0).toLocaleString()}
                      <span style={{ fontSize: '0.7rem', color: C.gray500, fontWeight: '500' }}>
                        {" "}/ {booking.currency || "PKR"} {(booking.amount || 0).toLocaleString()} total
                      </span>
                    </p>
                  </div>
                  {payoutAction(booking.payoutStatus) && canProcessPayouts && (
                    <button
                      onClick={() => handlePayoutAction(booking)}
                      disabled={actionLoading === booking._id}
                      style={{
                        padding: '0.45rem 0.875rem', border: '1px solid #bbf7d0', borderRadius: '0.4rem',
                        backgroundColor: '#f0fdf4', color: '#16a34a',
                        fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer',
                      }}>
                      {actionLoading === booking._id ? 'Saving...' : payoutAction(booking.payoutStatus)?.label}
                    </button>
                  )}
                  {booking.payoutStatus === "paid" && booking.tutor?._id && (
                    <PayoutReportDownload endpoint={`/admin/tutors/${booking.tutor._id}/payout-report/pdf`} label="Statement PDF" compact />
                  )}
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      <style>{`
        @media (min-width: 769px) { .payouts-mobile-card { display: none !important; } }
        @media (max-width: 768px) {
          .payouts-desktop-header { display: none !important; }
          .payouts-desktop-row { display: none !important; }
          .payouts-mobile-card { display: block !important; }
        }
      `}</style>
    </div>
  );
}
