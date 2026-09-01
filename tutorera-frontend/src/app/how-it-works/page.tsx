import Link from "next/link";
import type { Metadata } from "next";
import { GST_EFFECTIVE_PERCENT, PLATFORM_FEE_PERCENT, SUPPORT_EMAIL, formatPKR } from "@/lib/site";
import s from "../compliance-pages.module.css";

export const metadata: Metadata = { title: "How TUTORERA Works", description: "Complete customer journey from tutor/service browsing to checkout, payment verification, booking confirmation, delivery, and support.", alternates: { canonical: "/how-it-works" } };

const customerJourney = ["Browse", "Compare", "Select", "Book", "Review PKR Price", "Checkout", "Pay Securely", "Payment Confirmed", "Booking Confirmed", "Tutor Delivers Service"];
const stages = [
  ["Browse / Search", "Customer can browse tutors, subjects, tutoring services, search tutors, filter tutors, or post a tutoring requirement."],
  ["Select", "Customer opens a tutor or service and reviews tutor profile, qualification, experience, verification, subject, academic level, learning mode, rate in PKR, availability, and genuine ratings/reviews where available."],
  ["Booking", "Customer selects subject, session mode, duration, number of sessions, date, and time. The system generates a booking or offer-based booking record."],
  ["Review Price", `Pricing is itemized before checkout. Example: Tutor Session ${formatPKR(2000)}, Student Marketplace Fee ${formatPKR(0)}, Tax ${formatPKR(0)}, Discount ${formatPKR(0)}, Total Payable ${formatPKR(2000)}.`],
  ["Accept Policies", "Before payment, the customer must agree to TUTORERA's Terms & Conditions, Refund Policy, and Cancellation Policy."],
  ["Checkout", "Customer clicks Pay Securely and proceeds to the available authorized payment-gateway interface."],
  ["Payment Gateway", "Customer completes payment using an available payment method. The gateway securely processes the transaction."],
  ["Verification", "TUTORERA verifies payment server-side before treating the booking as paid."],
  ["Confirmation", "Customer sees payment status, booking reference, transaction reference, tutor, service, amount paid in PKR, and booking status."],
  ["Confirmation Delivery", "Customer receives on-screen confirmation, dashboard booking, email confirmation, and tutor notification."],
  ["Service Delivery", "Online tutoring takes place through the agreed online session. In-person tutoring takes place according to confirmed booking terms."],
  ["After-Service Support", `Customer can view booking history, rate/review tutor, contact support at ${SUPPORT_EMAIL}, request eligible refund, or raise a dispute.`],
];

export default function HowItWorksPage() {
  return <main className={s.page}>
    <section className={s.hero}><h1>How TUTORERA Works</h1><p>A complete public walkthrough of how customers browse, select, book, review PKR pricing, pay, receive confirmation, and complete tutoring services.</p></section>
    <section className={s.container}><h2 className={s.sectionTitle}>Customer journey diagram</h2><div className={s.flow}>{customerJourney.map(step => <span key={step}>{step}</span>)}</div></section>
    <section className={s.soft}><div className={s.container}><h2 className={s.sectionTitle}>Complete journey demonstration</h2><ol className={s.journey}>{stages.map(([title, body]) => <li key={title}><div><strong>{title}</strong><p>{body}</p></div></li>)}</ol></div></section>
    <section className={s.container}><div className={s.grid}>
      <article className={s.card}><h2>For students and parents</h2><p>Browse tutors or post a tutoring requirement. Compare offers by pricing, verification, qualifications, reviews, availability, and match quality. Accept a final agreed PKR price before checkout.</p><Link className={s.cta} href="/services">View services</Link></article>
      <article className={s.card}><h2>For tutors</h2><p>Create a tutor profile, submit verification where required, browse relevant requests, send tutor offers, deliver confirmed tutoring services, and receive eligible earnings. Tutor earnings are subject to {PLATFORM_FEE_PERCENT}% marketplace fee plus {GST_EFFECTIVE_PERCENT}% effective tax on that fee.</p><Link className={s.cta} href="/become-a-tutor">Become a tutor</Link></article>
    </div></section>
  </main>;
}
