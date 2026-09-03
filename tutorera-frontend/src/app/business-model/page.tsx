import type { Metadata } from "next";
import { BRAND_NAME, LEGAL_OPERATOR } from "@/lib/site";
import s from "../compliance-pages.module.css";

export const metadata: Metadata = {
  title: "TUTORERA Business Model | Student-Led Tutoring Marketplace",
  description: "How TUTORERA by MENTISERA operates as a student-led reverse tutoring marketplace.",
  alternates: { canonical: "/business-model" },
};

const explanation =
  "TUTORERA by MENTISERA is a student-led digital tutoring marketplace operated by MENTISERA (SMC-Private) Limited. Students or parents post tutoring requirements and may state their preferred budget in PKR. Eligible independent tutors can respond with offers based on the student's subject, academic level, schedule, learning mode, location where applicable, and proposed budget. The student compares available tutors and independently selects the tutor they prefer. Once the tutor's offer is accepted, the final tutoring rate is locked and a booking is created. Payment is then collected against that specific booking before the tutoring service is delivered.";

const flow = [
  "Student posts tutoring requirement",
  "Student may enter preferred budget in PKR",
  "Relevant tutors receive the opportunity",
  "Tutors submit offers or counter-offers where allowed",
  "Student compares tutor profiles and rates",
  "Student independently selects preferred tutor",
  "Final tutoring rate is agreed and locked",
  "Booking is generated",
  "Customer reviews final PKR amount",
  "Customer proceeds to secure payment",
  "Payment is verified",
  "Booking is confirmed",
  "Tutor delivers tutoring service independently",
  "Session is completed",
  "Student provides feedback or requests support if needed",
];

const studentItems = [
  "Create an account",
  "Browse tutors",
  "Search tutors",
  "Post tutoring requirements",
  "Enter preferred budget",
  "Receive tutor offers",
  "Compare tutor rates",
  "Compare qualifications",
  "Compare experience",
  "Compare availability",
  "Compare ratings/reviews",
  "Select tutor independently",
  "Accept offer",
  "Confirm booking",
  "Pay the displayed PKR total",
  "Attend tutoring",
  "Rate tutor",
  "Request support/refund",
];

const tutorItems = [
  "Create profile",
  "Add qualifications",
  "Add experience",
  "Add subjects",
  "Add levels",
  "Add teaching mode",
  "Set availability",
  "Receive relevant tutoring opportunities",
  "Review student budget",
  "Accept student budget",
  "Submit counter-offer where allowed",
  "Add proposal/message",
  "Receive booking",
  "Deliver tutoring service independently",
  "Receive eligible earnings after disclosed tutor-side deductions",
];

export default function BusinessModelPage() {
  return (
    <main className={s.page}>
      <section className={s.hero}>
        <h1>How TUTORERA Works – Our Business Model</h1>
        <p>{BRAND_NAME} is operated by {LEGAL_OPERATOR} as an education technology marketplace.</p>
      </section>
      <section className={s.narrow}>
        <div className={s.content}>
          <p>{explanation}</p>
        </div>
      </section>
      <section className={s.soft}>
        <div className={s.container}>
          <h2 className={s.sectionTitle}>Marketplace flow</h2>
          <ol className={s.timeline}>{flow.map((step) => <li key={step}>{step}</li>)}</ol>
        </div>
      </section>
      <section className={s.container}>
        <div className={s.grid}>
          <article className={s.card}>
            <h2>For Students and Parents</h2>
            <ul className={s.checklist}>{studentItems.map((x) => <li key={x}>{x}</li>)}</ul>
          </article>
          <article className={s.card}>
            <h2>For Tutors</h2>
            <ul className={s.checklist}>{tutorItems.map((x) => <li key={x}>{x}</li>)}</ul>
          </article>
        </div>
      </section>
      <section className={s.narrow}>
        <div className={s.infoBox}>
          <h2>TUTORERA&apos;s Role</h2>
          <p>TUTORERA provides marketplace technology, student request posting, tutor matching, tutor offer comparison, price confirmation, booking management, scheduling, communication, payment facilitation, transaction records, session management, tutor reviews, customer support, refund/dispute administration, and platform governance.</p>
          <p>Tutors provide the actual tutoring service as independent service providers.</p>
          <p>TUTORERA is not affiliated with, endorsed by, or certified by any ride-hailing or third-party marketplace brand. The model similarity is limited to the general reverse-marketplace idea where customers post demand and providers respond with offers.</p>
        </div>
      </section>
    </main>
  );
}
