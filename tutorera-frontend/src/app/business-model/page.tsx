import Link from "next/link";
import type { Metadata } from "next";
import { BRAND_NAME, BUSINESS_ADDRESS, LEGAL_OPERATOR, SITE_URL, SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/site";
import s from "../compliance-pages.module.css";

export const metadata: Metadata = {
  title: "Business Model",
  description: "TUTORERA by MENTISERA student-led reverse marketplace model, payment timing, and customer journey.",
  alternates: { canonical: "/business-model" },
};

const rapidPayStatement = "TUTORERA operates a student-led reverse marketplace for tutoring. Students or parents post tutoring requirements and may state their preferred budget in PKR. Eligible tutors can submit offers based on the requirement. The student compares available tutor profiles and offers and independently selects a tutor. Once a tutor's offer is accepted, the agreed tutoring rate is locked and a booking is generated. Payment is then collected through the authorized payment gateway against that specific confirmed booking. The tutor subsequently delivers the tutoring service.";

const operationFlow = [
  "Student Posts Requirement",
  "Student Enters Proposed Budget",
  "Relevant Tutors Receive Opportunity",
  "Tutors Submit Offers",
  "Student Compares Tutors and Prices",
  "Student Selects Preferred Tutor",
  "Final Price is Agreed",
  "Booking is Created",
  "Customer Reviews Final PKR Amount",
  "Customer Makes Payment",
  "Booking is Confirmed",
  "Tutor Delivers Tutoring Service",
  "Session is Completed",
  "Student Reviews Tutor / Raises Support Request",
];

export default function BusinessModelPage() {
  return (
    <main className={s.page}>
      <section className={s.hero}>
        <h1>{BRAND_NAME} – Student-Led Tutoring Marketplace</h1>
        <p>TUTORERA is the product/platform. {LEGAL_OPERATOR} is the operating and merchant entity.</p>
      </section>

      <section className={s.narrow}>
        <div className={s.content}>
          <p><strong>{BRAND_NAME}</strong> is a digital tutoring marketplace operated by <strong>{LEGAL_OPERATOR}</strong>.</p>
          <p><strong>Unlike a traditional tutoring platform where the platform sets a fixed price, TUTORERA follows a student-led offer and selection model.</strong></p>
          <p>{rapidPayStatement}</p>
          <p>The student or parent first posts a tutoring requirement and may specify the budget they are willing to pay. Relevant tutors can review the requirement and submit offers based on subject, academic level, location, online or in-person mode, schedule, tutor experience, tutor qualifications, the student&apos;s proposed budget, and the tutor&apos;s own preferred rate.</p>
        </div>
      </section>

      <section className={s.soft}>
        <div className={s.container}>
          <h2 className={s.sectionTitle}>Core business operation flow</h2>
          <ol className={s.timeline}>{operationFlow.map((step) => <li key={step}>{step}</li>)}</ol>
        </div>
      </section>

      <section className={s.container}>
        <div className={s.grid}>
          <article className={s.card}>
            <h2>Student-led pricing example</h2>
            <p><strong>Student Requirement:</strong> Mathematics, O-Level, online, 3 sessions per week, evening timing.</p>
            <p><strong>Student Proposed Budget:</strong> PKR 1,500 per hour.</p>
            <p><strong>Tutor A:</strong> PKR 1,500/hour</p>
            <p><strong>Tutor B:</strong> PKR 1,800/hour</p>
            <p><strong>Tutor C:</strong> PKR 1,400/hour</p>
            <p>The student chooses based on price, qualifications, experience, ratings, availability, teaching method, and other relevant factors. TUTORERA does not automatically award the tutoring job to the cheapest tutor.</p>
          </article>
          <article className={s.card}>
            <h2>TUTORERA&apos;s role in the transaction</h2>
            <p>TUTORERA acts as a technology-enabled marketplace facilitator. Tutors provide the actual tutoring service.</p>
            <ul className={s.checklist}>{["Marketplace technology","User accounts","Student request posting","Tutor matching","Tutor offer functionality","Booking management","Price confirmation","Payment facilitation","Transaction records","Customer support","Refund/dispute administration","Ratings/reviews","Platform governance"].map((x) => <li key={x}>{x}</li>)}</ul>
          </article>
        </div>
      </section>

      <section className={s.narrow}>
        <div className={s.infoBox}>
          <h2>Merchant details</h2>
          <p><strong>Legal Operator:</strong> {LEGAL_OPERATOR}</p>
          <p><strong>Website:</strong> {SITE_URL}</p>
          <p><strong>Email:</strong> <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
          <p><strong>Phone / WhatsApp:</strong> {SUPPORT_PHONE}</p>
          <p><strong>Address:</strong> <span className={s.address}>{BUSINESS_ADDRESS}</span></p>
          <p><Link className={s.cta} href="/payment-gateway-information">View payment gateway information</Link></p>
        </div>
      </section>
    </main>
  );
}
