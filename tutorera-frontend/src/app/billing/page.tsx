"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import { CheckCircle } from "lucide-react";
import api from "@/lib/axios";
import { useAppGuard } from "@/hooks/useAppGuard";

const C = { primary: '#1a1a2e', accent: '#2563eb', gray500: '#6b7280', gray50: '#f9fafb' };
const PLATFORM_FEE = 23; // 20% + 3% GST

interface Usage {
  plan: string;
  bidsThisMonth: number;
  bidLimit: number;
  requestsThisMonth: number;
  requestLimit: number;
}

const PLAN_META = {
  free:     { label: "Free",     price: 0,    color: '#f0edec', borderColor: '#e5e7eb', textColor: '#414754', dark: false },
  standard: { label: "Standard", price: 500,  color: '#1a1a2e', borderColor: '#2563eb', textColor: 'white',   dark: true  },
  premium:  { label: "Premium",  price: 1000, color: '#1a1a2e', borderColor: '#2563eb', textColor: 'white',   dark: true  },
};

const plans = [
  {
    planKey: "free",
    name: "Free",
    price: "PKR 0",
    priceNum: 0,
    desc: "For tutors just getting started.",
    features: [
      "3 bids per month (tutors)",
      "2 tuition requests/month (students)",
      "Basic tutor profile",
      "Real-time chat",
      "Email support",
    ],
    locked: ["More than 3 bids", "Priority listing", "Featured badge"],
  },
  {
    planKey: "standard",
    name: "Standard",
    price: "PKR 500",
    priceNum: 500,
    desc: "For active tutors building their client base.",
    features: [
      "10 bids per month (tutors)",
      "10 tuition requests/month (students)",
      "Standard tutor profile",
      "Real-time chat",
      "Priority support",
    ],
    locked: ["Unlimited bids", "Featured badge"],
  },
  {
    planKey: "premium",
    name: "Premium",
    price: "PKR 1,000",
    priceNum: 1000,
    desc: "For serious tutors who want maximum reach.",
    popular: true,
    features: [
      "Unlimited bids (tutors)",
      "Unlimited requests (students)",
      "Featured tutor profile",
      "Priority in search results",
      "Verified Premium badge",
      "Priority support",
    ],
    locked: [],
  },
];

const PLAN_ORDER = ["free", "standard", "premium"];

export default function BillingPage() {
  const { user } = useAuth();
  const guardStatus = useAppGuard();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [showPaymentInfo, setShowPaymentInfo] = useState<string | null>(null); // planKey being upgraded
  const paymentRef = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    api.get("/auth/me/usage")
      .then(res => setUsage(res.data.usage))
      .catch(console.error)
      .finally(() => setLoadingUsage(false));
  }, []);

  if (guardStatus !== "ok" || !user) return null;
  
  const currentPlan = usage?.plan || user?.plan || "free";
  const currentPlanIndex = PLAN_ORDER.indexOf(currentPlan);

  // When user clicks upgrade — scroll to payment section and highlight it
  const handleUpgradeClick = (planKey: string) => {
    setShowPaymentInfo(planKey);
    setTimeout(() => {
      paymentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // Usage display helpers
  const usedBids = usage?.bidsThisMonth ?? 0;
  const bidLimit = usage?.bidLimit ?? 3;
  const usedRequests = usage?.requestsThisMonth ?? 0;
  const requestLimit = usage?.requestLimit ?? 2;

  const usageLabel = user.role === "tutor"
    ? `${usedBids} / ${bidLimit === -1 ? "∞" : bidLimit} bids used this month`
    : `${usedRequests} / ${requestLimit === -1 ? "∞" : requestLimit} requests used this month`;

  const usagePercent = user.role === "tutor"
    ? (bidLimit === -1 ? 0 : Math.min(100, (usedBids / bidLimit) * 100))
    : (requestLimit === -1 ? 0 : Math.min(100, (usedRequests / requestLimit) * 100));

  const planMeta = PLAN_META[currentPlan as keyof typeof PLAN_META] || PLAN_META.free;

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '900px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: C.primary, marginBottom: '0.5rem' }}>Plans & Billing</h1>
        <p style={{ color: C.gray500, fontSize: '0.875rem', marginBottom: '2rem' }}>
          Choose a plan. Payments are processed manually via NayaPay and activated within 24 hours.
        </p>

        {/* ── Current Plan Banner ── */}
        <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.875rem', padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.875rem' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: '#1d4ed8', fontWeight: '600', marginBottom: '0.2rem' }}>CURRENT PLAN</p>
              <p style={{ fontSize: '1.2rem', fontWeight: '800', color: C.primary }}>
                {planMeta.label} Plan
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.8rem', color: C.gray500 }}>Usage this month</p>
              {loadingUsage ? (
                <p style={{ fontSize: '0.875rem', color: C.gray500 }}>Loading...</p>
              ) : (
                <p style={{ fontSize: '0.875rem', fontWeight: '600', color: usagePercent >= 100 ? '#ef4444' : C.primary }}>
                  {usageLabel}
                </p>
              )}
            </div>
          </div>

          {/* Usage progress bar */}
          {!loadingUsage && (bidLimit !== -1 || requestLimit !== -1) && (
            <div style={{ height: '6px', backgroundColor: '#bfdbfe', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${usagePercent}%`,
                backgroundColor: usagePercent >= 100 ? '#ef4444' : usagePercent >= 75 ? '#f59e0b' : '#2563eb',
                borderRadius: '999px',
                transition: 'width 0.5s ease',
              }} />
            </div>
          )}

          {usagePercent >= 100 && (
            <p style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: '600', marginTop: '0.5rem' }}>
              ⚠ You&apos;ve reached your monthly limit. Upgrade your plan to continue.
            </p>
          )}
        </div>

        {/* ── Upgrade payment confirmation banner ── */}
        {showPaymentInfo && (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.875rem', padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
            <p style={{ fontWeight: '700', color: '#15803d', marginBottom: '0.4rem' }}>
              ✅ Great choice! Here&apos;s how to upgrade to {plans.find(p => p.planKey === showPaymentInfo)?.name}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#166534', lineHeight: 1.6 }}>
              Transfer{" "}
              <strong>
                PKR {billing === "yearly"
                  ? Math.round((plans.find(p => p.planKey === showPaymentInfo)?.priceNum || 0) * 12 * 0.8).toLocaleString()
                  : (plans.find(p => p.planKey === showPaymentInfo)?.priceNum || 0).toLocaleString()}
                {billing === "yearly" ? "/year" : "/month"}
              </strong>{" "}
              to the NayaPay account below, then email your payment proof to{" "}
              <strong>billing@tutorera.pk</strong> with your registered email. Your plan will be activated within 24 hours.
            </p>
            <button onClick={() => setShowPaymentInfo(null)}
              style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#166534', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Dismiss
            </button>
          </div>
        )}

        {/* ── Billing Toggle ── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', backgroundColor: C.gray50, borderRadius: '0.625rem', padding: '0.25rem', border: '1px solid #e5e7eb' }}>
            {(["monthly", "yearly"] as const).map(period => (
              <button key={period} onClick={() => setBilling(period)}
                style={{ padding: '0.5rem 1.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', textTransform: 'capitalize', backgroundColor: billing === period ? 'white' : 'transparent', color: billing === period ? C.primary : C.gray500, boxShadow: billing === period ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                {period}{period === "yearly" && <span style={{ color: '#16a34a', fontSize: '0.75rem', marginLeft: '0.3rem' }}>SAVE 20%</span>}
              </button>
            ))}
          </div>
        </div>

        {/* ── Plan Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {plans.map(plan => {
            const isCurrentPlan = plan.planKey === currentPlan;
            const isUpgrade = PLAN_ORDER.indexOf(plan.planKey) > currentPlanIndex;
            const isDark = plan.planKey !== "free";
            const featureColor = isDark ? '#d1fae5' : '#16a34a';
            const textColor = isDark ? 'white' : '#414754';
            const cardBg = isDark ? '#1a1a2e' : '#f0edec';
            const cardBorder = isDark ? '#2563eb' : '#e5e7eb';

            const displayPrice = billing === "yearly" && plan.priceNum > 0
              ? `PKR ${Math.round(plan.priceNum * 12 * 0.8).toLocaleString()}`
              : plan.price;
            const displayPeriod = billing === "yearly" && plan.priceNum > 0 ? "/yr" : "/mo";

            return (
              <div key={plan.planKey} style={{ backgroundColor: cardBg, borderRadius: '1rem', padding: '2rem', border: `2px solid ${isCurrentPlan ? '#2563eb' : cardBorder}`, position: 'relative', boxShadow: isCurrentPlan ? '0 0 0 3px rgba(37,99,235,0.15)' : 'none' }}>
                {plan.popular && !isCurrentPlan && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: C.accent, color: 'white', fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 1rem', borderRadius: '999px' }}>
                    Most Popular
                  </div>
                )}
                {isCurrentPlan && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#16a34a', color: 'white', fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 1rem', borderRadius: '999px' }}>
                    ✓ Current Plan
                  </div>
                )}

                <h3 style={{ fontWeight: '800', color: textColor, fontSize: '1.2rem', marginBottom: '0.3rem' }}>{plan.name}</h3>
                <p style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: '0.8rem', marginBottom: '1rem' }}>{plan.desc}</p>

                <div style={{ marginBottom: '1.5rem' }}>
                  <span style={{ color: textColor, fontSize: '2rem', fontWeight: '800' }}>{displayPrice}</span>
                  <span style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: '0.875rem' }}>{displayPeriod}</span>
                  {billing === "yearly" && plan.priceNum > 0 && (
                    <p style={{ color: '#16a34a', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                      Save Rs. {Math.round(plan.priceNum * 12 * 0.2).toLocaleString()} vs monthly
                    </p>
                  )}
                </div>

                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: featureColor }}>
                      <CheckCircle size={15} color="#16a34a" style={{ flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                  {plan.locked.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280', textDecoration: 'line-through' }}>
                      <CheckCircle size={15} color="#6b7280" style={{ flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => isUpgrade && handleUpgradeClick(plan.planKey)}
                  disabled={!isUpgrade}
                  style={{
                    width: '100%', padding: '0.875rem', borderRadius: '0.5rem',
                    fontWeight: '700', fontSize: '0.875rem', border: 'none',
                    cursor: isUpgrade ? 'pointer' : 'not-allowed',
                    backgroundColor: isCurrentPlan ? '#e5e7eb' : isUpgrade ? '#2563eb' : '#d1d5db',
                    color: isCurrentPlan ? '#6b7280' : isUpgrade ? 'white' : '#9ca3af',
                    transition: 'opacity 0.2s',
                  }}>
                  {isCurrentPlan
                    ? "Current Plan"
                    : isUpgrade
                      ? `Upgrade to ${plan.name} →`
                      : "Lower Plan"}
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Platform Fee Breakdown ── */}
        <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '2rem', border: '1px solid #e5e7eb', marginBottom: '2rem' }}>
          <h3 style={{ fontWeight: '800', color: C.primary, fontSize: '1.1rem', marginBottom: '0.25rem' }}>📊 Platform Fee Breakdown</h3>
          <p style={{ color: C.gray500, fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            This fee applies to all bookings on TUTORERA® regardless of your plan.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { title: "Charged to Student", bg: '#eff6ff', border: '#bfdbfe', titleColor: '#1d4ed8', divider: '#bfdbfe' },
              { title: "Deducted from Tutor", bg: '#f0fdf4', border: '#bbf7d0', titleColor: '#16a34a', divider: '#bbf7d0' },
            ].map(box => (
              <div key={box.title} style={{ backgroundColor: box.bg, borderRadius: '0.75rem', padding: '1.25rem', border: `1px solid ${box.border}` }}>
                <p style={{ fontSize: '0.75rem', fontWeight: '700', color: box.titleColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>{box.title}</p>
                {[{ label: "Platform Fee", value: "20%" }, { label: "GST (15% of 20%)", value: "3%" }].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.4rem' }}>
                    <span style={{ color: box.titleColor }}>{item.label}</span>
                    <span style={{ fontWeight: '700', color: C.primary }}>{item.value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: '800', paddingTop: '0.5rem', borderTop: `1px solid ${box.divider}` }}>
                  <span style={{ color: C.primary }}>Total</span>
                  <span style={{ color: box.titleColor }}>{PLATFORM_FEE}%</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: '#fffbeb', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #fde68a' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#92400e', marginBottom: '0.75rem' }}>💡 Example — Tutor charges Rs. 1,000/hr</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
              {[
                { label: "Student Pays", value: "Rs. 1,345", color: '#1d4ed8', bg: '#eff6ff' },
                { label: "Platform Earns", value: "Rs. 345", color: '#d97706', bg: '#fffbeb' },
                { label: "Tutor Receives", value: "Rs. 655", color: '#16a34a', bg: '#f0fdf4' },
              ].map(item => (
                <div key={item.label} style={{ backgroundColor: item.bg, borderRadius: '0.5rem', padding: '0.875rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '1.1rem', fontWeight: '800', color: item.color }}>{item.value}</p>
                  <p style={{ fontSize: '0.75rem', color: C.gray500, marginTop: '0.2rem' }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── How to Upgrade ── */}
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.875rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <p style={{ fontWeight: '700', color: '#92400e', marginBottom: '0.75rem' }}>🏦 How to Upgrade</p>
          <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#a16207', fontSize: '0.875rem' }}>
            <li>Click "Upgrade to Standard" or "Upgrade to Premium" above</li>
            <li>Transfer the plan amount to the NayaPay account below</li>
            <li>Email your payment proof to <strong>billing@tutorera.pk</strong> with your registered email</li>
            <li>Your plan will be activated within 24 hours</li>
          </ol>
        </div>

        {/* ── NayaPay Payment Details ── */}
        <div ref={paymentRef} style={{ backgroundColor: 'white', border: `2px solid ${showPaymentInfo ? '#86efac' : '#e5e7eb'}`, borderRadius: '0.875rem', padding: '1.75rem', transition: 'border-color 0.3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 44, height: 44, backgroundColor: '#f0fdf4', borderRadius: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>💳</div>
            <div>
              <p style={{ fontWeight: '800', color: C.primary, fontSize: '1rem', margin: 0 }}>Payment Account Details</p>
              <p style={{ color: C.gray500, fontSize: '0.8rem', margin: 0 }}>Send your plan payment to this NayaPay account</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {[
              { label: "Bank Name",      value: "NayaPay" },
              { label: "Account Title",  value: "MENTISERA (SMC-PRIVATE) LIMITED" },
              { label: "NayaPay ID",     value: "mentisera@nayapay" },
              { label: "Account Number", value: "7556428306882526" },
              { label: "IBAN",           value: "PK27NAYA7556428306882526" },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: C.gray50, borderRadius: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: C.gray500, fontWeight: 600 }}>{item.label}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: '700', color: C.primary, fontFamily: 'monospace' }}>{item.value}</span>
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.875rem 1rem' }}>
            <p style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: 600, margin: '0 0 0.25rem' }}>⚠ Important</p>
            <p style={{ fontSize: '0.8rem', color: '#ef4444', margin: 0, lineHeight: 1.6 }}>
              After sending payment, email your proof to <strong>billing@tutorera.pk</strong> with your registered email and the plan name. Payments are verified within 24 hours.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}