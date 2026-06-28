"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import { CheckCircle, Zap, Star } from "lucide-react";
import Link from "next/link";
import { useTutorGuard } from "@/hooks/useTutorGuard";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

const C = { primary: '#1a1a2e', accent: '#2563eb', gray500: '#6b7280', gray50: '#f9fafb' };

const PLATFORM_FEE = 34.5; // 30% + 4.5% GST

const plans = [
  {
    name: "Free",
    price: "PKR 0",
    priceNum: 0,
    period: "/mo",
    desc: "For tutors just getting started.",
    color: "#f0edec",
    borderColor: "#e5e7eb",
    textColor: '#414754',
    featureColor: '#16a34a',
    buttonStyle: { backgroundColor: '#f3f4f6', color: '#1a1a2e', border: '1.5px solid #e5e7eb' },
    buttonText: "Current Plan",
    planKey: "free",
    features: [
      "3 bids per month",
      "2 tuition requests/month (students)",
      "Basic tutor profile",
      "Real-time chat",
      "Email support",
    ],
    locked: [
      "More than 3 bids",
      "Priority listing",
      "Featured badge",
    ],
  },
  {
    name: "Standard",
    price: "PKR 500",
    priceNum: 500,
    period: "/mo",
    desc: "For active tutors building their client base.",
    color: '#1a1a2e',
    borderColor: '#2563eb',
    textColor: 'white',
    featureColor: '#d1fae5',
    buttonStyle: { backgroundColor: '#2563eb', color: 'white', border: 'none' },
    buttonText: "Upgrade to Standard",
    planKey: "standard",
    popular: false,
    features: [
      "10 bids per month",
      "10 tuition requests/month (students)",
      "Standard tutor profile",
      "Real-time chat",
      "Priority support",
    ],
    locked: [
      "Unlimited bids",
      "Featured badge",
    ],
  },
  {
    name: "Premium",
    price: "PKR 1,000",
    priceNum: 1000,
    period: "/mo",
    desc: "For serious tutors who want maximum reach.",
    color: '#1a1a2e',
    borderColor: '#2563eb',
    textColor: 'white',
    featureColor: '#d1fae5',
    buttonStyle: { backgroundColor: '#2563eb', color: 'white', border: 'none' },
    buttonText: "Upgrade to Premium",
    planKey: "premium",
    popular: true,
    features: [
      "Unlimited bids",
      "Unlimited requests (students)",
      "Featured tutor profile",
      "Priority in search results",
      "Verified Premium badge",
      "Advanced analytics",
      "Priority support",
    ],
    locked: [],
  },
];

export default function BillingPage() {
  const { user } = useAuth();
  const tutorStatus = useTutorGuard();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const router = useRouter();
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [upgradeSuccess, setUpgradeSuccess] = useState("");

  // ← ADD: block pending/rejected tutors + show spinner while checking
  if (!user || tutorStatus === "loading") return null;

  const handleUpgrade = async (planKey: string) => {
  if (planKey === "free") return;
  setUpgrading(planKey);
  try {
    await api.patch("/auth/upgrade-plan", { plan: planKey });
    setUpgradeSuccess(`Successfully upgraded to ${planKey} plan!`);
    setTimeout(() => setUpgradeSuccess(""), 4000);
    // Refresh page to show new plan
    router.refresh();
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } };
    alert(e.response?.data?.message || "Upgrade failed. Please try again.");
  } finally {
    setUpgrading(null);
  }
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '900px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: C.primary, marginBottom: '0.5rem' }}>Plans & Billing</h1>
        <p style={{ color: C.gray500, fontSize: '0.875rem', marginBottom: '2rem' }}>
          Choose a plan. Payments are processed by bank transfer. Access activates after verification.
        </p>

        {/* Current Plan Banner */}
        <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.875rem', padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: '#1d4ed8', fontWeight: '600', marginBottom: '0.2rem' }}>CURRENT PLAN</p>
            <p style={{ fontSize: '1.2rem', fontWeight: '800', color: C.primary }}>Free Plan</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.8rem', color: C.gray500 }}>Usage this month</p>
            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: C.primary }}>2 / 2 requests used</p>
          </div>
        </div>

        {/* Success Message */}
        {upgradeSuccess && (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', padding: '0.875rem 1rem', marginBottom: '1.5rem', color: '#16a34a', fontWeight: '600', fontSize: '0.875rem' }}>
            ✅ {upgradeSuccess}
          </div>
        )}

        {/* Billing Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', backgroundColor: C.gray50, borderRadius: '0.625rem', padding: '0.25rem', border: '1px solid #e5e7eb' }}>
            {(["monthly", "yearly"] as const).map(period => (
              <button key={period} onClick={() => setBilling(period)}
                style={{ padding: '0.5rem 1.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', textTransform: 'capitalize', backgroundColor: billing === period ? 'white' : 'transparent', color: billing === period ? C.primary : C.gray500, boxShadow: billing === period ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                {period} {period === "yearly" && <span style={{ color: '#16a34a', fontSize: '0.75rem' }}>SAVE 20%</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Plan Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {plans.map(plan => (
            <div key={plan.name} style={{ backgroundColor: plan.color, borderRadius: '1rem', padding: '2rem', border: `2px solid ${plan.borderColor}`, position: 'relative' }}>
              {plan.popular && (
                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: C.accent, color: 'white', fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 1rem', borderRadius: '999px' }}>
                  Most Popular
                </div>
              )}
              <h3 style={{ fontWeight: '800', color: plan.color === 'white' ? C.primary : plan.textColor, fontSize: '1.2rem', marginBottom: '0.3rem' }}>{plan.name}</h3>
              <p style={{ color: plan.color === plan.borderColor ? '#6b7280' : '#6b7280', fontSize: '0.8rem', marginBottom: '1rem' }}>{plan.desc}</p>
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ color: plan.price === "PKR 0" ? plan.textColor : (plan.color === 'white' ? C.primary : 'white'), fontSize: '2rem', fontWeight: '800' }}>
                  {billing === "yearly" && plan.priceNum > 0
                    ? `PKR ${Math.round(plan.priceNum * 12 * 0.8).toLocaleString()}`
                    : plan.price}
                </span>
                <span style={{ color: plan.color === 'white' ? C.gray500 : '#6b7280', fontSize: '0.875rem' }}>
                  {billing === "yearly" && plan.priceNum > 0 ? "/yr" : "/mo"}
                </span>
                {billing === "yearly" && plan.priceNum > 0 && (
                  <p style={{ color: '#16a34a', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                    Billed yearly — save 20% (Rs. {Math.round(plan.priceNum * 12 * 0.2).toLocaleString()} saved)
                  </p>
                )}
              </div>

              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: plan.color === 'white' ? C.primary : plan.featureColor }}>
                    <CheckCircle size={15} color={plan.color === 'white' ? '#16a34a' : '#16a34a'} style={{ flexShrink: 0 }} />
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
                onClick={() => handleUpgrade(plan.planKey)}
                disabled={plan.planKey === "free" || upgrading === plan.planKey}
                style={{
                  ...plan.buttonStyle,
                   width: '100%',
                   padding: '0.875rem',
                  borderRadius: '0.5rem',
                  fontWeight: '700',
                  fontSize: '0.875rem',
                  cursor: plan.planKey === "free" || upgrading ? 'not-allowed' : 'pointer',
                  opacity: upgrading && upgrading !== plan.planKey ? 0.6 : 1,
                  transition: 'opacity 0.2s',
                }}>
                {upgrading === plan.planKey
                  ? "Processing..."
                  : plan.planKey === "free"
                    ? "Current Plan"
                    : `Upgrade to ${plan.name}`}
                </button>
              </div>
            ))}
          </div>

        {/* Fee Breakdown Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '2rem', border: '1px solid #e5e7eb', marginBottom: '2rem' }}>
          <h3 style={{ fontWeight: '800', color: C.primary, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
            📊 Platform Fee Breakdown
          </h3>
          <p style={{ color: C.gray500, fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            This fee applies to all bookings on TUTORERA® regardless of your plan.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* From Student */}
            <div style={{ backgroundColor: '#eff6ff', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #bfdbfe' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                Charged to Student
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { label: "Platform Fee", value: "30%" },
                  { label: "GST (15% of 30%)", value: "4.5%" },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: '#1d4ed8' }}>{item.label}</span>
                    <span style={{ fontWeight: '700', color: C.primary }}>{item.value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: '800', paddingTop: '0.5rem', borderTop: '1px solid #bfdbfe' }}>
                  <span style={{ color: C.primary }}>Total Added</span>
                  <span style={{ color: '#1d4ed8' }}>{PLATFORM_FEE}%</span>
                </div>
              </div>
            </div>

            {/* From Tutor */}
            <div style={{ backgroundColor: '#f0fdf4', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #bbf7d0' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                Deducted from Tutor
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { label: "Platform Fee", value: "30%" },
                  { label: "GST (15% of 30%)", value: "4.5%" },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: '#16a34a' }}>{item.label}</span>
                    <span style={{ fontWeight: '700', color: C.primary }}>{item.value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: '800', paddingTop: '0.5rem', borderTop: '1px solid #bbf7d0' }}>
                  <span style={{ color: C.primary }}>Total Deducted</span>
                  <span style={{ color: '#16a34a' }}>{PLATFORM_FEE}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Example Calculation */}
          <div style={{ backgroundColor: '#fffbeb', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #fde68a' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#92400e', marginBottom: '0.75rem' }}>
              💡 Example — Tutor charges Rs. 1,000/hr
            </p>
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

                {/* How to Upgrade */}
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.875rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <p style={{ fontWeight: '700', color: '#92400e', marginBottom: '0.75rem' }}>🏦 How to Upgrade</p>
          <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#a16207', fontSize: '0.875rem' }}>
            <li>Click "Upgrade to Premium" / "Upgrade to Standard" and note down the plan price</li>
            <li>Transfer the amount to TUTORERA®'s NayaPay account below</li>
            <li>Send payment proof to <strong>billing@tutorera.pk</strong></li>
            <li>Your plan will be activated within 24 hours</li>
          </ol>
        </div>

        {/* ── NayaPay Payment Details ── */}
        <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.875rem', padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 44, height: 44, backgroundColor: '#f0fdf4', borderRadius: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
              💳
            </div>
            <div>
              <p style={{ fontWeight: '800', color: C.primary, fontSize: '1rem', margin: 0 }}>Payment Account Details</p>
              <p style={{ color: C.gray500, fontSize: '0.8rem', margin: 0 }}>Send your payment to this NayaPay account</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {[
              { label: "Bank Name",       value: "NayaPay" },
              { label: "Account Title",   value: "MENTISERA (SMC-PRIVATE) LIMITED" },
              { label: "NayaPay ID",      value: "mentisera@nayapay" },
              { label: "Account Number",  value: "7556428306882526" },
              { label: "IBAN",            value: "PK27NAYA7556428306882526" },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: C.gray50, borderRadius: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: C.gray500, fontWeight: 600 }}>{item.label}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: '700', color: C.primary, fontFamily: 'monospace', letterSpacing: '0.02em' }}>{item.value}</span>
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.875rem 1rem' }}>
            <p style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: 600, margin: '0 0 0.25rem' }}>⚠ Important</p>
            <p style={{ fontSize: '0.8rem', color: '#ef4444', margin: 0, lineHeight: 1.6 }}>
              After sending payment, email your proof to <strong>billing@tutorera.pk</strong> with your registered email and booking/plan details. Payments are verified within 24 hours.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}