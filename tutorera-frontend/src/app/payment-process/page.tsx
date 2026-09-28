import { BRAND_NAME,SUPPORT_EMAIL } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";
import s from "../compliance-pages.module.css";

export const metadata: Metadata = {
  title: "How Payments Work",
  description: "Customer payment process for TUTORERA's student-led tutoring marketplace.",
  alternates: { canonical: "/payment-process" },
};

const steps = [
  ["Post Requirement", "The student or parent enters subject, level, location where applicable, online or in-person mode, schedule, learning requirements, and a preferred budget in the request currency."],
  ["Tutor Offers", "Eligible tutors can submit offers in the request currency."],
  ["Compare", "The student compares rate, qualifications, experience, ratings, availability, teaching mode, and tutor profile."],
  ["Select Tutor", "The student accepts one tutor's offer."],
  ["Final Price Locked", "The accepted offer becomes the final booking price."],
  ["Booking Summary", "The booking shows tutor, subject, agreed rate, sessions, subtotal, applicable fees or taxes, and the total in the booking currency."],
  ["Checkout When Available", "In a checkout-enabled market, the customer can review the payment options before proceeding."],
  ["Payment Verification", "When a configured provider is used, TUTORERA verifies the transaction result server-side."],
  ["Booking Confirmation", "A paid booking is confirmed after successful payment verification. Discovery-beta markets do not offer checkout."],
  ["Tutor Service Delivery", "Tutor conducts the agreed lesson as an independent service provider."],
  ["Completion", "Booking/session becomes completed after service delivery."],
  ["Customer Feedback", "Student may rate tutor, leave review, contact support, or request an eligible refund."],
];

export default function PaymentProcessPage() {
  return (
    <div className={s.page}>
      <section className={s.hero}>
        <h1>How Payments Work on TUTORERA</h1>
        <p>{BRAND_NAME} uses payments only for genuine tutoring bookings created after student selection and final price acceptance.</p>
      </section>

      <section className={s.narrow}>
        <p className={s.lead}>No payment is collected simply because a student posts a tutoring requirement. The sequence is: post requirement → receive offers → select tutor → accept final price → create booking → proceed to payment only where checkout is enabled. The final payable amount is shown in the booking currency before payment.</p>
      </section>

      <section className={s.soft}>
        <div className={s.container}>
          <h2 className={s.sectionTitle}>Complete payment customer journey</h2>
          <ol className={s.journey}>{steps.map(([title, body], index) => <li key={title}><div><strong>Step {index + 1} – {title}</strong><p>{body}</p></div></li>)}</ol>
        </div>
      </section>

      <section className={s.container}>
        <div className={s.grid}>
          <article className={s.card}>
            <h2>Example booking summary</h2>
            <p><strong>Tutor:</strong> Selected tutor name</p>
            <p><strong>Subject:</strong> Selected subject or curriculum</p>
            <p><strong>Rate:</strong> Final agreed rate in the request currency</p>
            <p><strong>Sessions:</strong> Selected booking sessions</p>
            <p><strong>Subtotal:</strong> Rate multiplied by the booking sessions</p>
            <p><strong>Fees and tax:</strong> Displayed when applicable</p>
            <p><strong>Total Payable:</strong> Displayed before payment</p>
            <p>Student fees, tutor deductions, taxes, and payment availability can vary by market and are shown in the relevant booking flow.</p>
          </article>
          <article className={s.card}>
            <h2>Gateway activation note</h2>
            <p>Secure online payment is available only through a provider configured for the selected market.</p>
            <p>The request currency remains authoritative for the offer, booking, payment record, and settlement snapshot.</p>
            <p>For support, contact <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
            <Link className={s.cta} href="/student-journey">View student journey</Link>
          </article>
        </div>
      </section>
    </div>
  );
}
