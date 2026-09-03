"use client";
import { UI_COLORS } from "@/lib/brand";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { showSuccess, showError } from "@/lib/toast";

const C = UI_COLORS;

interface SubUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  bidsThisMonth?: number;
  requestsThisMonth?: number;
  createdAt: string;
}

interface SubscriptionsData {
  total: number;
  counts: { standard: number; premium: number };
  users: SubUser[];
}

const planMeta: Record<string, { bg: string; text: string }> = {
  standard: { bg: '#EEF5FF', text: '#0329B2' },
  premium:  { bg: '#fdf4ff', text: '#9333ea' },
};

export default function SubscriptionsPage() {
  const [data, setData] = useState<SubscriptionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "standard" | "premium">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    const query = filter === "all" ? "" : `?plan=${filter}`;
    api.get(`/admin/subscriptions${query}`)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handlePlanChange = async (userId: string, newPlan: string) => {
    setUpdatingId(userId);
    try {
      await api.patch(`/admin/users/${userId}/plan`, { plan: newPlan });
      fetchData();
      showSuccess("Plan updated");
    } catch (err) {
      console.error(err);
      showError("Failed to update plan. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: C.primary }}>Subscriptions Overview</h1>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div style={{ width: 36, height: 36, border: `3px solid ${C.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: C.primary }}>Subscriptions Overview</h1>
          <p style={{ color: C.gray500, fontSize: '0.875rem' }}>Manage all Standard and Premium subscribers.</p>
        </div>
        <Link href="/admin" style={{ padding: '0.6rem 1.25rem', backgroundColor: C.gray50, color: C.primary, border: '1px solid #e5e7eb', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: '600', fontSize: '0.8rem' }}>
          ← Dashboard
        </Link>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Standard Subscribers', value: data?.counts.standard ?? 0, color: '#0329B2', bg: '#EEF5FF' },
          { label: 'Premium Subscribers',  value: data?.counts.premium ?? 0,  color: '#9333ea', bg: '#fdf4ff' },
          { label: 'Total Paid Users',     value: data?.total ?? 0,           color: '#16a34a', bg: '#f0fdf4' },
        ].map(card => (
          <div key={card.label} style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.25rem', border: '1px solid #e5e7eb', borderTop: `3px solid ${card.color}` }}>
            <p style={{ fontSize: '0.72rem', fontWeight: '700', color: card.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{card.label}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '800', color: C.primary }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {(["all", "standard", "premium"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '0.5rem 1.1rem', borderRadius: '0.5rem', border: filter === f ? 'none' : '1px solid #e5e7eb', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: '600', textTransform: 'capitalize',
              backgroundColor: filter === f ? C.primary : 'white',
              color: filter === f ? 'white' : C.gray500,
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ backgroundColor: C.gray50, borderBottom: '1px solid #e5e7eb' }}>
                {['Name', 'Email', 'Role', 'Plan', 'Since', 'Change Plan'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: '700', color: C.gray500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.users ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: C.gray500, fontSize: '0.875rem' }}>
                    No subscribers found for this filter.
                  </td>
                </tr>
              ) : (
                data?.users.map(user => {
                  const meta = planMeta[user.plan] || planMeta.standard;
                  return (
                    <tr key={user._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.85rem', fontWeight: '600', color: C.primary }}>{user.name}</td>
                      <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.85rem', color: C.gray500 }}>{user.email}</td>
                      <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.85rem', color: C.gray500, textTransform: 'capitalize' }}>{user.role}</td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: meta.text, backgroundColor: meta.bg, padding: '0.2rem 0.65rem', borderRadius: '999px', textTransform: 'capitalize' }}>
                          {user.plan}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.8rem', color: C.gray500 }}>
                        {new Date(user.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <select
                          title="Change plan"
                          value={user.plan}
                          disabled={updatingId === user._id}
                          onChange={e => handlePlanChange(user._id, e.target.value)}
                          style={{ padding: '0.4rem 0.75rem', borderRadius: '0.4rem', border: '1px solid #e5e7eb', fontSize: '0.8rem', color: C.primary, backgroundColor: updatingId === user._id ? '#f3f4f6' : 'white', cursor: updatingId === user._id ? 'not-allowed' : 'pointer' }}>
                          <option value="free">Free</option>
                          <option value="standard">Standard</option>
                          <option value="premium">Premium</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}