"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import { CheckCircle, Zap, Star } from "lucide-react";
import Link from "next/link";

const C = { primary: '#1a1a2e', accent: '#2563eb', gray500: '#6b7280', gray50: '#f9fafb' };

const plans = [
  {
    name: "Free",
    price: "PKR 0",
    period: "/mo",
    desc: "For students and tutors just getting started.",
    color: "white",
    borderColor: "#e5e7eb",
    buttonStyle: { backgroundColor: C.gray50, color: C.primary, border: '1.5px solid #e5e7eb' },
    buttonText: "Current Plan",
    features: [
      "Browse all verified tutors",
      "Post 2 tuition requests/month",
      "Place 3 bids/month (tutors)",
      "Real-time chat",
      "Basic profile",
      "Email support",
    ],
    locked: ["Priority listing", "Unlimited requests", "Featured badge"],
  },
  {
    name: "Premium",
    price: "PKR 1,999",
    period: "/mo",
    desc: "For serious students and active tutors.",
    color: C.primary,
    borderColor: C.accent,
    buttonStyle: { backgroundColor: C.accent, color: 'white', border: 'none' },
    buttonText: "Upgrade to Premium",
    popular: true,
    features: [
      "Everything in Free",
      "Unlimited tuition requests",
      "Unlimited bids (tutors)",
      "Priority in search results",
      "Verified badge on profile",
      "Advanced analytics",
      "Priority support",
      "Featured tutor listing",
    ],
    locked: [],
  },
];

export default function BillingPage() {
  const { user } = useAuth();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

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
              <h3 style={{ fontWeight: '800', color: plan.color === 'white' ? C.primary : 'white', fontSize: '1.2rem', marginBottom: '0.3rem' }}>{plan.name}</h3>
              <p style={{ color: plan.color === 'white' ? C.gray500 : '#9ca3af', fontSize: '0.8rem', marginBottom: '1rem' }}>{plan.desc}</p>
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: '800', color: plan.color === 'white' ? C.primary : 'white' }}>
                  {billing === "yearly" && plan.price !== "PKR 0" ? `PKR ${parseInt(plan.price.replace("PKR ", "").replace(",", "")) * 10}` : plan.price}
                </span>
                <span style={{ color: plan.color === 'white' ? C.gray500 : '#9ca3af', fontSize: '0.875rem' }}>{plan.period}</span>
                {billing === "yearly" && plan.price !== "PKR 0" && (
                  <p style={{ color: '#16a34a', fontSize: '0.75rem', marginTop: '0.2rem' }}>Billed yearly — save 20%</p>
                )}
              </div>

              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: plan.color === 'white' ? C.primary : '#d1fae5' }}>
                    <CheckCircle size={15} color={plan.color === 'white' ? '#16a34a' : '#86efac'} style={{ flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
                {plan.locked.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                    <CheckCircle size={15} color="#d1d5db" style={{ flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>

              <button style={{ ...plan.buttonStyle, width: '100%', padding: '0.875rem', borderRadius: '0.5rem', fontWeight: '700', fontSize: '0.875rem', cursor: plan.name === "Free" ? 'default' : 'pointer' }}
                disabled={plan.name === "Free"}>
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* Payment Info */}
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.875rem', padding: '1.5rem' }}>
          <p style={{ fontWeight: '700', color: '#92400e', marginBottom: '0.75rem' }}>🏦 How to Upgrade</p>
          <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#a16207', fontSize: '0.875rem' }}>
            <li>Click "Upgrade to Premium" and note down the plan price</li>
            <li>Transfer the amount to TUTORERA®'s bank account</li>
            <li>Send payment proof to <strong>billing@tutorera.pk</strong></li>
            <li>Your plan will be activated within 24 hours</li>
          </ol>
          <p style={{ color: '#a16207', fontSize: '0.8rem', marginTop: '0.75rem' }}>
            For payment details, contact us at <strong>support@tutorera.pk</strong> or WhatsApp: <strong>+92 334 888 0859</strong>
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}