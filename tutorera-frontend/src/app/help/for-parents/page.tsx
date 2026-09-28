import { UI_COLORS } from "@/lib/brand";
import Link from "next/link";

const C = UI_COLORS;

const steps = [
  { title: "Step 1 — Create an Account", desc: "Create a student or parent account and complete the relevant onboarding details." },
  { title: "Step 2 — Post a Requirement", desc: "Describe the subject, level or curriculum, schedule, teaching mode, and your preferred budget." },
  { title: "Step 3 — Receive Offers", desc: "Eligible tutors can respond with offers. You can also browse profiles as a secondary way to learn about tutors." },
  { title: "Step 4 — Compare & Choose", desc: "Compare availability, profile information, completed verification indicators, offer terms, and any permitted counter-offers before choosing." },
  { title: "Step 5 — Review Booking & Start Learning", desc: "The final agreed rate is shown in the booking. Where checkout is available in your market, review the payment and cancellation terms before payment." },
];

export default function ForParentsPage() {
  return (
    <div style={{ backgroundColor: "white" }}>
      <section style={{ backgroundColor: C.primary, padding: "4rem 1.5rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "800", color: "white" }}>Guide for Parents & Students</h1>
        <p style={{ color: "#dbeafe", lineHeight: 1.6, maxWidth: 680, margin: "1rem auto 0" }}>Post what you need, set a preferred budget, compare eligible tutor offers, and choose the tutor that fits your family.</p>
      </section>
      <section style={{ padding: "4rem 1.5rem" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {steps.map((item) => (
            <div key={item.title} style={{ backgroundColor: C.gray50, borderRadius: "0.875rem", padding: "1.5rem", border: "1px solid #e5e7eb" }}>
              <h2 style={{ fontWeight: "700", color: C.primary, marginBottom: "0.4rem", fontSize: "1rem" }}>{item.title}</h2>
              <p style={{ color: C.gray500, fontSize: "0.9rem", lineHeight: "1.65" }}>{item.desc}</p>
            </div>
          ))}
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <Link href="/post-tuition-request" style={{ backgroundColor: C.accent, color: "white", padding: "0.875rem 2rem", borderRadius: "0.5rem", fontWeight: "700", textDecoration: "none", display: "inline-block" }}>
              Post a Tuition Requirement
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
