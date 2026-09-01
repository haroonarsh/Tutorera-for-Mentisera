import type { Metadata } from "next";
import { BRAND_NAME, LEGAL_OPERATOR } from "@/lib/site";
import s from "../compliance-pages.module.css";

export const metadata: Metadata = {
  title: "TUTORERA Business Model | Student-Led Tutoring Marketplace",
  description: "How TUTORERA by MENTISERA operates as a student-led reverse tutoring marketplace.",
  alternates: { canonical: "/business-model" },
};

const explanation = "TUTORERA by MENTISERA is a student-led digital tutoring marketplace operated by MENTISERA (SMC-Private) Limited. Students or parents post tutoring requirements and may state their preferred budget in PKR. Eligible tutors can respond with offers based on the student's subject, academic level, schedule, learning mode, location where applicable, and proposed budget. The student compares available tutors and independently selects the tutor they prefer. Once the tutor's offer is accepted, the final tutoring rate is locked and a booking is created. Payment is then collected against that specific booking before the tutoring service is delivered.";
const flow = ["Student Posts Tutoring Requirement","Student May Enter Preferred Budget in PKR","Relevant Tutors Receive the Opportunity","Tutors Submit Offers / Counter Offers","Student Compares Tutor Profiles and Rates","Student Selects Preferred Tutor","Final Tutoring Rate is Agreed","Booking is Generated","Customer Reviews Final PKR Amount","Customer Proceeds to Secure Payment","Payment is Verified","Booking is Confirmed","Tutor Delivers Tutoring Service","Session is Completed","Student Provides Feedback / Requests Support if Needed"];

export default function BusinessModelPage() {
  return (
    <main className={s.page}>
      <section className={s.hero}>
        <h1>How TUTORERA Works – Our Business Model</h1>
        <p>{BRAND_NAME} is operated by {LEGAL_OPERATOR} as an education technology marketplace.</p>
      </section>
      <section className={s.narrow}><div className={s.content}><p>{explanation}</p></div></section>
      <section className={s.soft}><div className={s.container}><h2 className={s.sectionTitle}>Marketplace flow</h2><ol className={s.timeline}>{flow.map((step) => <li key={step}>{step}</li>)}</ol></div></section>
      <section className={s.container}><div className={s.grid}>
        <article className={s.card}><h2>For Students and Parents</h2><ul className={s.checklist}>{["Create an account","Browse tutors","Search tutors","Post tutoring requirements","Enter preferred budget","Receive tutor offers","Compare tutor rates","Compare qualifications","Compare experience","Compare availability","Compare ratings/reviews","Select tutor","Accept offer","Confirm booking","Pay securely","Attend tutoring","Rate tutor","Request support/refund"].map((x) => <li key={x}>{x}</li>)}</ul></article>
        <article className={s.card}><h2>For Tutors</h2><ul className={s.checklist}>{["Create profile","Add qualifications","Add experience","Add subjects","Add levels","Add teaching mode","Set availability","Receive relevant tutoring opportunities","Review student budget","Accept student budget","Submit counter offer","Add proposal/message","Receive booking","Deliver tutoring service","Receive eligible earnings"].map((x) => <li key={x}>{x}</li>)}</ul></article>
      </div></section>
      <section className={s.narrow}><div className={s.infoBox}><h2>TUTORERA&apos;s Role</h2><p>TUTORERA provides marketplace technology, student request posting, tutor matching, tutor offer/bidding, price confirmation, booking management, scheduling, communication, payment facilitation, transaction records, session management, tutor reviews, customer support, refund/dispute administration, and platform governance.</p><p>Tutors provide the actual tutoring service.</p></div></section>
    </main>
  );
}
