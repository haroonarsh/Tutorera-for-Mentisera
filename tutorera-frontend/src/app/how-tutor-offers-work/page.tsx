import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How Tutor Offers Work | Global Student-Led Tutoring Marketplace",
  description: "Post a tuition request with your preferred budget and currency, compare verified tutor offers, negotiate transparently, and hire your ideal tutor on TUTORERA.",
  alternates: { canonical: "/how-tutor-offers-work" },
};

const faq = [
  [
    "How do students receive tutor offers?",
    "A student or parent publishes a tuition request with subject, curriculum, learning mode (online worldwide or home tuition locally), schedule, and budget details. Verified, eligible educators receive the opportunity and submit tailored offers.",
  ],
  [
    "Can students set their own tutoring budget?",
    "Yes. Students propose a rate in their chosen local currency (e.g. AED, USD, GBP, SAR, PKR). An optional maximum budget remains confidential and is never shown to competing tutors.",
  ],
  [
    "Can tutors submit counter-offers?",
    "Yes. When counter-offers are allowed by the student, tutors can accept the student's proposed budget or submit an alternative competitive rate reflecting their specialized expertise.",
  ],
  [
    "Can students negotiate tutor rates?",
    "Yes. Both parties can exchange structured counter-offers within the platform. Every change is tracked on an immutable timeline so terms remain 100% transparent.",
  ],
  [
    "Does TUTORERA automatically assign a tutor?",
    "No. TUTORERA is strictly student-led. Learners and parents evaluate match scores, credentials, verified student ratings, availability, and rates before independently selecting their tutor.",
  ],
  [
    "What happens after accepting an offer?",
    "The agreed rate is locked, competing offers close, and a secure escrow booking order is created. Funds are safely held in escrow until the session is completed and verified by the student.",
  ],
];

export default function HowTutorOffersWorkPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <main style={{ color: "#021550" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <header
        style={{
          background: "#021550",
          color: "white",
          padding: "5rem 1.5rem",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.4rem)", fontWeight: 800 }}>
          How TUTORERA Tutor Offers Work
        </h1>
        <p
          style={{
            maxWidth: 760,
            margin: "1rem auto",
            lineHeight: 1.8,
            color: "#cbd5e1",
            fontSize: "1.1rem",
          }}
        >
          Define your requirements. Set your budget in your currency. Receive offers from verified educators worldwide or locally.
        </p>
        <Link
          href="/dashboard"
          style={{
            display: "inline-block",
            background: "#016ef8",
            color: "white",
            padding: "0.85rem 1.6rem",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 700,
            marginTop: "1rem",
          }}
        >
          Post a Tuition Request
        </Link>
      </header>

      <div style={{ maxWidth: 850, margin: "auto", padding: "3.5rem 1.5rem" }}>
        <section>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "1rem" }}>
            A Global Student-Led Reverse Tutoring Marketplace
          </h2>
          <p style={{ lineHeight: 1.8, color: "#475569", fontSize: "1rem" }}>
            TUTORERA is a global student-led tutoring marketplace where students and parents post tutoring requirements in their preferred local currency and learning mode (online worldwide or home tuition locally). Qualified, verified educators submit competitive offers or transparent counter-offers. Students evaluate tutor credentials, teaching background, and reviews before making an empowered choice.
          </p>
        </section>

        <section style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "1rem" }}>
            The Five-Step Marketplace Process
          </h2>
          <ol style={{ lineHeight: 2, color: "#475569", fontSize: "1rem", paddingLeft: "1.25rem" }}>
            <li>
              <strong>Specify what you need:</strong> Subject, curriculum (Cambridge, IB, GCSE, Matric/FSc, etc.), mode (online or home tuition), schedule, timezone, and your preferred budget.
            </li>
            <li>
              <strong>Receive verified tutor offers:</strong> Matching educators review your requirement and accept your budget or submit customized counter-offers.
            </li>
            <li>
              <strong>Compare & negotiate:</strong> Review verified degrees, ID verification, background checks, tutor match ratings, and terms in real-time.
            </li>
            <li>
              <strong>Choose your educator:</strong> Accept the tutor whose expertise and price best meet your criteria. The final rate is locked.
            </li>
            <li>
              <strong>Secure escrow booking:</strong> Review transparent checkout details with escrow protection. Your payment is held safely until the session is successfully delivered.
            </li>
          </ol>
        </section>

        <section
          style={{
            marginTop: 40,
            background: "#f8fafc",
            padding: 28,
            borderRadius: 14,
            border: "1px solid #e2e8f0",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1rem" }}>
            TUTORERA Marketplace Principles
          </h2>
          <ul style={{ lineHeight: 1.9, color: "#475569", paddingLeft: "1.25rem" }}>
            <li>Students retain full autonomy over which tutor they hire.</li>
            <li>Tutors define their own rates and are never compelled to accept below-market prices.</li>
            <li>Multi-currency transparency: budgets and offers are denominated clearly with base escrow settlement.</li>
            <li>Rankings prioritize qualification authenticity, teaching efficacy, and student reviews.</li>
            <li>Zero hidden charges: all fees and tutor earnings are disclosed upfront.</li>
            <li>Police verification is mandatory for in-person home tutors to ensure parent peace of mind.</li>
          </ul>
        </section>

        <section style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "1.5rem" }}>
            Frequently Asked Questions
          </h2>
          {faq.map(([q, a]) => (
            <details
              key={q}
              style={{
                borderBottom: "1px solid #e2e8f0",
                padding: "1.25rem 0",
              }}
            >
              <summary style={{ fontWeight: 700, cursor: "pointer", fontSize: "1.05rem" }}>
                {q}
              </summary>
              <p style={{ color: "#475569", lineHeight: 1.7, marginTop: "0.5rem" }}>{a}</p>
            </details>
          ))}
        </section>
      </div>
    </main>
  );
}
