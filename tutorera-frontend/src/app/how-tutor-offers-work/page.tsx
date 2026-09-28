import type { Metadata } from "next";
import Link from "next/link";
import AdBanner from "@/components/AdBanner";

export const metadata: Metadata = {
  title: "How Tutor Offers Work | Student-First Marketplace | TUTORERA",
  description: "Post a tuition requirement with a preferred budget, compare eligible tutor offers, negotiate where permitted, and choose a tutor on TUTORERA.",
  alternates: { canonical: "/how-tutor-offers-work" },
};

const faq = [
  [
    "How do students receive tutor offers?",
    "A student or parent publishes a tuition request with subject, curriculum, learning mode, schedule, and preferred budget. Eligible tutors can receive the opportunity and submit tailored offers.",
  ],
  [
    "Can students set their own tutoring budget?",
    "Yes. Students and parents set the initial preferred budget in the request currency. Any private maximum budget is not shown to tutors.",
  ],
  [
    "Can tutors submit counter-offers?",
    "Yes. When counter-offers are allowed by the student, tutors can accept the student's proposed budget or submit an alternative competitive rate reflecting their specialized expertise.",
  ],
  [
    "Can students negotiate tutor rates?",
    "When a request permits counter-offers, both parties can exchange structured counter-offers in the platform. The request and offer history records the negotiation steps.",
  ],
  [
    "Does TUTORERA automatically assign a tutor?",
    "No. TUTORERA is student-first: the learner or parent compares the available information and chooses a tutor. A match score is guidance, not a recommendation or guarantee.",
  ],
  [
    "What happens after accepting an offer?",
    "The agreed rate is locked, competing offers close, and a booking is created. In a checkout-enabled market, payment options and the applicable cancellation terms are shown before payment is requested.",
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
          Define your requirements. Set a preferred budget. Eligible tutors can submit offers for online or locally available home tuition.
        </p>
        <Link
          href="/post-tuition-request"
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
            A Student-First Tutoring Marketplace
          </h2>
          <p style={{ lineHeight: 1.8, color: "#475569", fontSize: "1rem" }}>
            TUTORERA is a student-first tutoring marketplace where students and parents post tutoring requirements, select an available learning mode, and set a preferred budget. Eligible tutors may submit offers or, where permitted, counter-offers. Students evaluate the available profile information and choose the tutor that fits their needs.
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
              <strong>Receive tutor offers:</strong> Eligible tutors review your requirement and can accept your budget or submit a counter-offer when the request permits it.
            </li>
            <li>
              <strong>Compare & negotiate:</strong> Review the profile details, completed verification indicators, availability, offer terms, and any permitted counter-offers.
            </li>
            <li>
              <strong>Choose your educator:</strong> Accept the tutor whose expertise and price best meet your criteria. The final rate is locked.
            </li>
            <li>
              <strong>Review booking and payment:</strong> Review the final rate and booking terms. Where market checkout is enabled, payment options and applicable cancellation terms are shown before payment.
            </li>
          </ol>
        </section>

        {/* Ad placement */}
        <section style={{ padding: "2rem 0", textAlign: "center" }}>
          <AdBanner slot="7346189519" format="auto" label="Advertisement" />
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
            <li>Budgets and offers use the request currency; the agreed rate is displayed before booking.</li>
            <li>Matching considers profile and request information, but the student or parent makes the final choice.</li>
            <li>Any applicable fee or payment information is shown in the booking flow.</li>
            <li>Home-tuition eligibility follows the active market's safety and verification policy.</li>
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
