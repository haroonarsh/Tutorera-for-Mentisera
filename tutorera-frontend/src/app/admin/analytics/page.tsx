"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";

const C = {
  primary: '#1a1a2e',
  accent:  '#2563eb',
  gray500: '#6b7280',
  gray50:  '#f9fafb',
};

interface Overview {
  totalUsers: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  totalBookings: number;
  revenueThisMonth: number;
  platformFeeThisMonth: number;
  pendingPayouts: number;
}

interface PlanBreakdown {
  plan: string;
  count: number;
  percent: number;
}

interface SignupPoint {
  week: string;
  label: string;
  count: number;
}

interface BookingStatus {
  upcoming: number;
  ongoing: number;
  completed: number;
  cancelled: number;
}

interface TopTutor {
  name: string;
  count: number;
  revenue: number;
}

interface RecentPayment {
  _id: string;
  amount: number;
  status: string;
  createdAt: string;
  student: { name: string };
  tutor: { name: string };
}

interface AnalyticsData {
  overview: Overview;
  planBreakdown: PlanBreakdown[];
  signupTrend: SignupPoint[];
  bookingStatusBreakdown: BookingStatus;
  topTutors: TopTutor[];
  recentPayments: RecentPayment[];
}

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────
function BarChart({ data }: { data: SignupPoint[] }) {
  const W = 560, H = 180, PAD_L = 32, PAD_B = 36, PAD_T = 16, PAD_R = 12;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_B - PAD_T;
  const maxVal = Math.max(...data.map(d => d.count), 1);
  const barW   = chartW / data.length;
  const barGap = barW * 0.25;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* Y-axis gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map(frac => {
        const y = PAD_T + chartH * (1 - frac);
        return (
          <g key={frac}>
            <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="#e5e7eb" strokeWidth={1} />
            <text x={PAD_L - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#9ca3af">
              {Math.round(maxVal * frac)}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const barH  = d.count === 0 ? 2 : (d.count / maxVal) * chartH;
        const x     = PAD_L + i * barW + barGap / 2;
        const y     = PAD_T + chartH - barH;
        const bw    = barW - barGap;
        return (
          <g key={d.week}>
            <rect
              x={x} y={y} width={bw} height={barH}
              rx={3}
              fill={d.count === 0 ? '#e5e7eb' : '#2563eb'}
              opacity={d.count === 0 ? 0.5 : 0.85}
            />
            {/* Value label on top */}
            {d.count > 0 && (
              <text x={x + bw / 2} y={y - 4} textAnchor="middle" fontSize={9} fill="#2563eb" fontWeight="bold">
                {d.count}
              </text>
            )}
            {/* X-axis label */}
            <text x={x + bw / 2} y={H - 4} textAnchor="middle" fontSize={9} fill="#9ca3af">
              {d.label}
            </text>
          </g>
        );
      })}

      {/* X axis line */}
      <line x1={PAD_L} y1={PAD_T + chartH} x2={W - PAD_R} y2={PAD_T + chartH} stroke="#e5e7eb" strokeWidth={1} />
    </svg>
  );
}

// ── Plan colour map ───────────────────────────────────────────────────────────
const planColors: Record<string, { bar: string; bg: string; text: string }> = {
  free:     { bar: '#6b7280', bg: '#f3f4f6', text: '#6b7280' },
  standard: { bar: '#2563eb', bg: '#eff6ff', text: '#2563eb' },
  premium:  { bar: '#9333ea', bg: '#fdf4ff', text: '#9333ea' },
};

const bookingStatusConfig: { key: keyof BookingStatus; label: string; color: string; bg: string }[] = [
  { key: 'upcoming',  label: 'Upcoming',  color: '#2563eb', bg: '#eff6ff' },
  { key: 'ongoing',   label: 'Ongoing',   color: '#9333ea', bg: '#fdf4ff' },
  { key: 'completed', label: 'Completed', color: '#16a34a', bg: '#f0fdf4' },
  { key: 'cancelled', label: 'Cancelled', color: '#ef4444', bg: '#fef2f2' },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/analytics")
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const ov = data?.overview;

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: C.primary }}>Analytics</h1>
          <p style={{ color: C.gray500, fontSize: '0.875rem' }}>Platform-wide metrics and growth.</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div style={{ width: 36, height: 36, border: `3px solid ${C.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: C.primary }}>Analytics</h1>
          <p style={{ color: C.gray500, fontSize: '0.875rem' }}>Platform-wide metrics and growth.</p>
        </div>
        <Link href="/admin" style={{ padding: '0.6rem 1.25rem', backgroundColor: C.gray50, color: C.primary, border: '1px solid #e5e7eb', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: '600', fontSize: '0.8rem' }}>
          ← Dashboard
        </Link>
      </div>

      {/* ── Overview Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Users',         value: ov?.totalUsers,           sub: `+${ov?.newUsersThisMonth ?? 0} this month`,  color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
          { label: 'New This Week',        value: ov?.newUsersThisWeek,     sub: 'registered users',                           color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
          { label: 'Total Bookings',       value: ov?.totalBookings,        sub: 'all time',                                   color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
          { label: 'Revenue This Month',   value: `Rs. ${(ov?.revenueThisMonth ?? 0).toLocaleString()}`,  sub: 'confirmed payments', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
          { label: 'Platform Fee MTD',     value: `Rs. ${(ov?.platformFeeThisMonth ?? 0).toLocaleString()}`, sub: '20% + 3% GST',  color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
          { label: 'Pending Payouts',      value: `Rs. ${(ov?.pendingPayouts ?? 0).toLocaleString()}`,    sub: 'owed to tutors',      color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
        ].map(card => (
          <div key={card.label} style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.25rem', border: `1px solid #e5e7eb`, borderTop: `3px solid ${card.color}` }}>
            <p style={{ fontSize: '0.72rem', fontWeight: '700', color: card.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              {card.label}
            </p>
            <p style={{ fontSize: '1.35rem', fontWeight: '800', color: C.primary, marginBottom: '0.2rem' }}>
              {card.value ?? 0}
            </p>
            <p style={{ fontSize: '0.72rem', color: C.gray500 }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }} className="analytics-chart-row">

        {/* Signup Trend */}
        <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontWeight: '700', color: C.primary, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
            User Signup Trend
          </h3>
          <p style={{ color: C.gray500, fontSize: '0.8rem', marginBottom: '1.25rem' }}>
            Weekly registrations — last 8 weeks
          </p>
          {data?.signupTrend && <BarChart data={data.signupTrend} />}
        </div>

        {/* Plan Breakdown */}
        <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontWeight: '700', color: C.primary, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
            Active Subscriptions
          </h3>
          <p style={{ color: C.gray500, fontSize: '0.8rem', marginBottom: '1.5rem' }}>
            Users by plan
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {(data?.planBreakdown ?? []).map(item => {
              const meta = planColors[item.plan] || planColors.free;
              return (
                <div key={item.plan}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: meta.text, textTransform: 'capitalize', padding: '0.15rem 0.5rem', backgroundColor: meta.bg, borderRadius: '999px' }}>
                      {item.plan}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: C.primary }}>
                      {item.count} <span style={{ color: C.gray500, fontWeight: '500' }}>({item.percent}%)</span>
                    </span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${item.percent}%`,
                      backgroundColor: meta.bar,
                      borderRadius: '999px',
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              );
            })}

            {/* No paid subscriptions note */}
            {(data?.planBreakdown.filter(p => p.plan !== "free").every(p => p.count === 0)) && (
              <p style={{ fontSize: '0.78rem', color: C.gray500, fontStyle: 'italic', marginTop: '0.5rem' }}>
                No paid subscriptions currently active.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Booking Status Breakdown ── */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.5rem', border: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: '700', color: C.primary, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
          Booking Status Breakdown
        </h3>
        <p style={{ color: C.gray500, fontSize: '0.8rem', marginBottom: '1.25rem' }}>All-time booking counts by status</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
          {bookingStatusConfig.map(s => {
            const count = data?.bookingStatusBreakdown[s.key] ?? 0;
            const total = Object.values(data?.bookingStatusBreakdown ?? {}).reduce((a, b) => a + b, 0) || 1;
            const pct   = Math.round((count / total) * 100);
            return (
              <div key={s.key} style={{ backgroundColor: s.bg, borderRadius: '0.75rem', padding: '1.1rem', textAlign: 'center', border: `1px solid ${s.color}22` }}>
                <p style={{ fontSize: '1.6rem', fontWeight: '800', color: s.color, marginBottom: '0.2rem' }}>{count}</p>
                <p style={{ fontSize: '0.78rem', fontWeight: '600', color: s.color, textTransform: 'capitalize', marginBottom: '0.25rem' }}>{s.label}</p>
                <p style={{ fontSize: '0.7rem', color: C.gray500 }}>{pct}% of total</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom Row: Top Tutors + Recent Payments ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="analytics-bottom-row">

        {/* Top Tutors */}
        <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontWeight: '700', color: C.primary, fontSize: '0.95rem', marginBottom: '0.1rem' }}>Top Tutors</h3>
              <p style={{ color: C.gray500, fontSize: '0.78rem' }}>By number of bookings</p>
            </div>
            <Link href="/admin/bookings" style={{ fontSize: '0.75rem', color: C.accent, fontWeight: '600', textDecoration: 'none' }}>
              View all →
            </Link>
          </div>

          {(data?.topTutors ?? []).length === 0 ? (
            <p style={{ color: C.gray500, fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>No bookings yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {(data?.topTutors ?? []).map((tutor, i) => (
                <div key={`${tutor.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : i === 2 ? '#d97706' : C.gray50, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800', color: i < 3 ? 'white' : C.gray500, flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: '600', color: C.primary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tutor.name}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: C.gray500, margin: 0 }}>
                      Rs. {tutor.revenue.toLocaleString()} earned
                    </p>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: C.accent, backgroundColor: '#eff6ff', padding: '0.2rem 0.6rem', borderRadius: '999px', flexShrink: 0 }}>
                    {tutor.count} {tutor.count === 1 ? 'booking' : 'bookings'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontWeight: '700', color: C.primary, fontSize: '0.95rem', marginBottom: '0.1rem' }}>Recent Payments</h3>
              <p style={{ color: C.gray500, fontSize: '0.78rem' }}>Latest confirmed bookings</p>
            </div>
            <Link href="/admin/payments" style={{ fontSize: '0.75rem', color: C.accent, fontWeight: '600', textDecoration: 'none' }}>
              View all →
            </Link>
          </div>

          {(data?.recentPayments ?? []).length === 0 ? (
            <p style={{ color: C.gray500, fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>No confirmed payments yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {(data?.recentPayments ?? []).map((payment, idx) => (
                <div key={payment._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: idx < (data?.recentPayments.length ?? 0) - 1 ? '1px solid #f3f4f6' : 'none', gap: '0.5rem' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: '600', color: C.primary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {payment.student?.name} → {payment.tutor?.name}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: C.gray500, margin: 0 }}>
                      {new Date(payment.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: '800', color: '#16a34a', flexShrink: 0 }}>
                    Rs. {(payment.amount || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .analytics-chart-row  { grid-template-columns: 1fr !important; }
          .analytics-bottom-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}