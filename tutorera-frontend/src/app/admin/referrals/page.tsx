"use client";
import { UI_COLORS, STATUS_COLORS, TEXT_COLORS } from "@/lib/brand";
import { useEffect, useState } from "react";
import { Gift, Save } from "lucide-react";
import api from "@/lib/axios";
import { showSuccess, showError } from "@/lib/toast";

const C = UI_COLORS;

interface Referral {
  _id: string;
  referrer: { name: string; email: string };
  referred: { name: string; email: string; createdAt: string };
  status: "pending" | "credited";
  creditAmount: number;
  createdAt: string;
}

interface ReferralConfig {
  referrerRewardAmount: number;
  referredDiscountAmount: number;
  isActive: boolean;
}

function ReferralConfigPanel() {
  const [config, setConfig] = useState<ReferralConfig | null>(null);
  const [form, setForm] = useState({ referrerRewardAmount: "200", referredDiscountAmount: "200", isActive: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/admin/referral-config")
      .then(res => {
        const c: ReferralConfig = res.data.config;
        setConfig(c);
        setForm({ referrerRewardAmount: String(c.referrerRewardAmount), referredDiscountAmount: String(c.referredDiscountAmount), isActive: c.isActive });
      })
      .catch(err => showError(err, "Failed to load referral configuration"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put("/admin/referral-config", {
        referrerRewardAmount: Number(form.referrerRewardAmount),
        referredDiscountAmount: Number(form.referredDiscountAmount),
        isActive: form.isActive,
      });
      setConfig(res.data.config);
      showSuccess("Referral reward settings updated");
    } catch (err) {
      showError(err, "Failed to update referral configuration");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div style={{ backgroundColor: C.surface, borderRadius: '0.875rem', border: `1px solid ${C.border}`, padding: '1.5rem', marginBottom: '1.5rem' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: C.primary, margin: '0 0 0.25rem' }}>Reward Configuration</h2>
      <p style={{ color: C.gray500, fontSize: '0.82rem', margin: '0 0 1.1rem' }}>Adjust the referral rewards without a code deploy. Existing credited referrals keep their original amount.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.82rem', color: TEXT_COLORS.secondary }}>Referrer Reward (Rs.)</label>
          <input
            type="number"
            value={form.referrerRewardAmount}
            onChange={e => setForm({ ...form, referrerRewardAmount: e.target.value })}
            style={{ width: '100%', padding: '0.55rem 0.7rem', border: `1px solid ${C.border}`, borderRadius: '0.4rem', fontSize: '0.9rem', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.82rem', color: TEXT_COLORS.secondary }}>New Signup Discount (Rs.)</label>
          <input
            type="number"
            value={form.referredDiscountAmount}
            onChange={e => setForm({ ...form, referredDiscountAmount: e.target.value })}
            style={{ width: '100%', padding: '0.55rem 0.7rem', border: `1px solid ${C.border}`, borderRadius: '0.4rem', fontSize: '0.9rem', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: TEXT_COLORS.secondary, cursor: 'pointer', paddingBottom: '0.6rem' }}>
            <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
            Program active
          </label>
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.1rem', background: STATUS_COLORS.success.color, color: C.surface, border: 'none', borderRadius: '0.5rem', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: saving ? 0.7 : 1 }}
      >
        <Save size={16} /> {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCredit, setTotalCredit] = useState(0);
  const [filter, setFilter] = useState<"all" | "pending" | "credited">("all");

  useEffect(() => {
    api.get("/admin/referrals")
      .then(res => {
        setReferrals(res.data.referrals);
        setTotalCredit(res.data.totalCreditIssued);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = referrals.filter(r => filter === "all" || r.status === filter);

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: C.primary }}>Referral Program</h1>
        <p style={{ color: C.gray500, fontSize: '0.875rem' }}>
          Total credit issued: <strong style={{ color: C.primary }}>Rs. {totalCredit.toLocaleString()}</strong>
        </p>
      </div>

      <ReferralConfigPanel />

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { key: "all", label: "All", count: referrals.length },
          { key: "pending", label: "⏳ Pending", count: referrals.filter(r => r.status === "pending").length },
          { key: "credited", label: "✅ Credited", count: referrals.filter(r => r.status === "credited").length },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key as typeof filter)}
            style={{ padding: '0.5rem 1.25rem', borderRadius: '999px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', border: filter === tab.key ? 'none' : `1px solid ${C.border}`, backgroundColor: filter === tab.key ? C.primary : 'white', color: filter === tab.key ? 'white' : C.gray500 }}>
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ width: '36px', height: '36px', border: `3px solid ${C.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '4rem', textAlign: 'center', border: `1px solid ${C.border}` }}>
          <Gift size={40} color={C.gray500} style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: C.gray500 }}>No referrals in this category.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: C.gray50, borderBottom: `1px solid ${C.border}` }}>
                {["Referrer", "Referred User", "Joined", "Credit", "Status"].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: C.gray500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r._id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <p style={{ fontWeight: 600, color: C.primary, fontSize: '0.875rem', margin: '0 0 2px' }}>{r.referrer.name}</p>
                    <p style={{ color: C.gray500, fontSize: '0.75rem', margin: 0 }}>{r.referrer.email}</p>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <p style={{ fontWeight: 600, color: C.primary, fontSize: '0.875rem', margin: '0 0 2px' }}>{r.referred.name}</p>
                    <p style={{ color: C.gray500, fontSize: '0.75rem', margin: 0 }}>{r.referred.email}</p>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: C.gray500, fontSize: '0.875rem' }}>
                    {new Date(r.referred.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: C.primary, fontSize: '0.875rem' }}>
                    Rs. {r.creditAmount}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: r.status === "credited" ? STATUS_COLORS.success.bg : STATUS_COLORS.warning.bg, color: r.status === "credited" ? STATUS_COLORS.success.color : STATUS_COLORS.warning.color }}>
                      {r.status === "credited" ? "Credited" : "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}