import Link from "next/link";
import { Gift, ArrowRight, Users, Star, TrendingUp, CheckCircle, Shield } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refer & Earn | TUTORERA®",
  description: "Share TUTORERA® with friends and earn PKR 200–500 per successful referral. Rewards grow as you refer more — no cap on earnings.",
};

const milestones = [
  { range: "1st referral", reward: "PKR 200", color: "#0329b2" },
  { range: "2nd – 5th referral", reward: "PKR 250 each", color: "#0538d4" },
  { range: "6th – 10th referral", reward: "PKR 300 each", color: "#016ef8" },
  { range: "11th – 20th referral", reward: "PKR 400 each", color: "#0093ff" },
  { range: "21st+ referral", reward: "PKR 500 each", color: "#08bffc" },
];

const steps = [
  { icon: Gift, title: "Get your unique link", desc: "Log in and visit your Referral Dashboard to copy your personal invite link." },
  { icon: Users, title: "Share with friends", desc: "Send your link via WhatsApp, email, or any channel. Friends sign up through it." },
  { icon: TrendingUp, title: "Earn when they book", desc: "When your referred friend completes their first tuition booking, your credit lands instantly." },
];

const faqs = [
  { q: "Who can I refer?", a: "Anyone new to TUTORERA® — students, parents, or tutors. They just need to sign up using your link and complete a first booking." },
  { q: "When do I receive my credit?", a: "Credit is added to your TUTORERA® wallet immediately after your referred friend's first booking is marked complete." },
  { q: "Is there a limit to how much I can earn?", a: "No cap. Every successful referral earns you credit, and the more you refer the higher the reward per referral." },
  { q: "What can I spend my credit on?", a: "Credits are redeemed against tuition fees on TUTORERA® — simply apply them at checkout." },
  { q: "Does my friend get anything?", a: "Yes — friends who sign up through your link receive a PKR 200 discount off their first booking." },
  { q: "What if my referred friend cancels?", a: "If a booking is reversed before completion, the associated referral credit may also be reversed. Credits only vest on completed bookings." },
];

export default function ReferAndEarnPage() {
  return (
    <main style={{ background: "#f8fafc", minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg, #021550 0%, #0329b2 55%, #016ef8 100%)", padding: "5rem 1.5rem 4rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(8,191,252,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(8,191,252,0.08) 0%, transparent 40%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(8,191,252,0.15)", border: "1px solid rgba(8,191,252,0.3)", borderRadius: "2rem", padding: "0.4rem 1rem", marginBottom: "1.5rem" }}>
            <Gift size={16} color="#08bffc" />
            <span style={{ color: "#08bffc", fontSize: "0.82rem", fontWeight: 700 }}>Refer &amp; Earn Programme</span>
          </div>
          <h1 style={{ color: "white", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, lineHeight: 1.1, margin: "0 0 1rem", letterSpacing: "-0.02em" }}>
            Share TUTORERA®.<br />Earn up to <span style={{ color: "#08bffc" }}>PKR 500</span> per referral.
          </h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "1.1rem", lineHeight: 1.6, margin: "0 0 2rem", maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
            Invite friends to TUTORERA®. They get PKR 200 off their first booking — you earn growing credit every time one of them completes a tuition session.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/referral" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.9rem 2rem", background: "#08bffc", color: "#021550", borderRadius: "0.75rem", fontWeight: 900, fontSize: "1rem", textDecoration: "none", boxShadow: "0 8px 24px rgba(8,191,252,0.4)" }}>
              Get your referral link <ArrowRight size={18} />
            </Link>
            <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.9rem 2rem", background: "rgba(255,255,255,0.1)", color: "white", borderRadius: "0.75rem", fontWeight: 700, fontSize: "1rem", textDecoration: "none", border: "1px solid rgba(255,255,255,0.25)" }}>
              Create an account
            </Link>
          </div>
          {/* Social proof strip */}
          <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: "2.5rem", flexWrap: "wrap" }}>
            {[["10,000+", "Active tutors"], ["Verified", "Identity checks"], ["Instant", "Credit delivery"]].map(([stat, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <p style={{ color: "white", fontWeight: 900, fontSize: "1.2rem", margin: 0 }}>{stat}</p>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.78rem", margin: "0.15rem 0 0" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "4rem 1.5rem 2rem" }}>
        <h2 style={{ textAlign: "center", fontSize: "1.75rem", fontWeight: 900, color: "#0f172a", margin: "0 0 0.5rem", letterSpacing: "-0.01em" }}>How it works</h2>
        <p style={{ textAlign: "center", color: "#64748b", fontSize: "1rem", margin: "0 0 3rem" }}>Three easy steps — no complicated forms.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} style={{ background: "white", borderRadius: "1rem", padding: "2rem 1.5rem", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ width: 48, height: 48, borderRadius: "0.75rem", background: "linear-gradient(135deg, #021550, #016ef8)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                  <Icon size={22} color="white" />
                </div>
                <div style={{ display: "inline-block", background: "#f0f4ff", color: "#0329b2", fontSize: "0.72rem", fontWeight: 900, padding: "0.2rem 0.6rem", borderRadius: "1rem", marginBottom: "0.5rem" }}>Step {i + 1}</div>
                <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", margin: "0.25rem 0 0.5rem" }}>{step.title}</h3>
                <p style={{ color: "#64748b", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Milestone rewards table */}
      <section style={{ maxWidth: 700, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
        <h2 style={{ textAlign: "center", fontSize: "1.75rem", fontWeight: 900, color: "#0f172a", margin: "0 0 0.5rem", letterSpacing: "-0.01em" }}>Rewards that grow with you</h2>
        <p style={{ textAlign: "center", color: "#64748b", fontSize: "1rem", margin: "0 0 2rem" }}>The more friends you refer, the more you earn per referral.</p>
        <div style={{ background: "white", borderRadius: "1.25rem", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", padding: "0.75rem 1.5rem", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Milestone</span>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>You earn</span>
          </div>
          {milestones.map((m, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", padding: "1rem 1.5rem", borderBottom: i < milestones.length - 1 ? "1px solid #f1f5f9" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
                <span style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.95rem" }}>{m.range}</span>
              </div>
              <span style={{ fontWeight: 900, color: m.color, fontSize: "1rem", whiteSpace: "nowrap" }}>{m.reward}</span>
            </div>
          ))}
          <div style={{ padding: "1rem 1.5rem", background: "linear-gradient(90deg, #f0f4ff, #e8f4ff)", borderTop: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Star size={14} color="#0329b2" fill="#0329b2" />
            <span style={{ fontSize: "0.82rem", color: "#0329b2", fontWeight: 700 }}>Your referred friend also gets PKR 200 off their first booking.</span>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <Link href="/referral" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.9rem 2.5rem", background: "linear-gradient(135deg, #021550, #016ef8)", color: "white", borderRadius: "0.75rem", fontWeight: 900, fontSize: "1rem", textDecoration: "none", boxShadow: "0 4px 16px rgba(3,41,178,0.3)" }}>
            Start referring now <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Trust badges */}
      <section style={{ background: "white", padding: "3rem 1.5rem" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
          {[
            { icon: Shield, title: "Fraud-protected", desc: "Every referral is verified before credit is issued." },
            { icon: CheckCircle, title: "No expiry", desc: "Your referral credit never expires." },
            { icon: TrendingUp, title: "Unlimited earning", desc: "No cap — refer as many friends as you like." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <div style={{ width: 40, height: 40, borderRadius: "0.5rem", background: "#f0f4ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={18} color="#0329b2" />
              </div>
              <div>
                <p style={{ fontWeight: 800, color: "#0f172a", margin: "0 0 0.25rem", fontSize: "0.95rem" }}>{title}</p>
                <p style={{ color: "#64748b", fontSize: "0.82rem", margin: 0, lineHeight: 1.5 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 700, margin: "0 auto", padding: "4rem 1.5rem" }}>
        <h2 style={{ textAlign: "center", fontSize: "1.75rem", fontWeight: 900, color: "#0f172a", margin: "0 0 2.5rem", letterSpacing: "-0.01em" }}>Frequently asked questions</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {faqs.map(({ q, a }) => (
            <div key={q} style={{ background: "white", borderRadius: "0.875rem", padding: "1.25rem 1.5rem", border: "1px solid #e2e8f0" }}>
              <p style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.95rem", margin: "0 0 0.5rem" }}>{q}</p>
              <p style={{ color: "#64748b", fontSize: "0.88rem", lineHeight: 1.65, margin: 0 }}>{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section style={{ background: "linear-gradient(135deg, #021550 0%, #0329b2 55%, #016ef8 100%)", padding: "4rem 1.5rem", textAlign: "center" }}>
        <Gift size={40} color="#08bffc" style={{ marginBottom: "1rem" }} />
        <h2 style={{ color: "white", fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 900, margin: "0 0 1rem", letterSpacing: "-0.01em" }}>Ready to start earning?</h2>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1rem", margin: "0 0 2rem", maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>Log in to get your referral link and share it with the people who need a great tutor.</p>
        <Link href="/referral" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.9rem 2.5rem", background: "#08bffc", color: "#021550", borderRadius: "0.75rem", fontWeight: 900, fontSize: "1rem", textDecoration: "none", boxShadow: "0 8px 24px rgba(8,191,252,0.4)" }}>
          Go to my Referral Dashboard <ArrowRight size={18} />
        </Link>
      </section>
    </main>
  );
}
