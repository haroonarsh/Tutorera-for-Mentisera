import type { Metadata } from "next";
import Link from "next/link";
import { BRAND_NAME, SUPPORT_EMAIL, formatPKR } from "@/lib/site";
import s from "../compliance-pages.module.css";

export const metadata: Metadata = { title: "How Payments Work", description: "Customer payment process and checkout flow for TUTORERA tutoring bookings.", alternates: { canonical: "/payment-process" } };

const steps = ["Select Service or Tutor", "Review Booking", "Proceed to Checkout", "Payment Gateway", "Payment Processing", "Payment Verification", "Booking Confirmation", "Service Delivery", "Completion", "Post-Service Support"];

export default function PaymentProcessPage() {
  return <main className={s.page}>
    <section className={s.hero}><h1>How Payments Work on TUTORERA</h1><p>{BRAND_NAME} uses payments only for genuine tutoring and education-related services booked through the marketplace.</p></section>
    <section className={s.narrow}><p className={s.lead}>The payment gateway is used only after the student or parent has selected a tutor or tutoring service, confirmed service details, agreed to the tutor/service price, reviewed the final payable amount in PKR, and proceeded to secure checkout.</p></section>
    <section className={s.soft}><div className={s.container}><h2 className={s.sectionTitle}>Customer payment process</h2><ol className={s.timeline}>{steps.map((step, i)=><li key={step}><strong>Step {i+1} – {step}</strong></li>)}</ol></div></section>
    <section className={s.container}><div className={s.grid}>
      <article className={s.card}><h2>Booking review shows</h2><ul className={s.checklist}>{["Tutor name","Subject","Academic level","Learning mode","Session duration","Number of sessions","Date/time","Price per session","Platform fee","Tax where applicable","Discount where applicable","Total payable amount","Currency: PKR"].map(x=><li key={x}>{x}</li>)}</ul></article>
      <article className={s.card}><h2>Example checkout display</h2><p>Tutor Session: <strong>{formatPKR(2000)}</strong></p><p>Student Marketplace Fee: <strong>{formatPKR(0)}</strong></p><p>Tax: <strong>{formatPKR(0)}</strong></p><p>Discount: <strong>{formatPKR(0)}</strong></p><p><strong>Total Payable: {formatPKR(2000)}</strong></p><p>Final settlement currency: <strong>PKR — Pakistani Rupees</strong>.</p></article>
    </div></section>
    <section className={s.narrow}><div className={s.infoBox}><h2>Gateway activation note</h2><p>Secure online payment will be processed through TUTORERA&apos;s authorized payment gateway upon merchant activation. TUTORERA verifies payment server-side before treating a booking as paid.</p><p>For support, contact <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p><Link className={s.cta} href="/payment-gateway-information">Merchant gateway information</Link></div></section>
  </main>;
}
