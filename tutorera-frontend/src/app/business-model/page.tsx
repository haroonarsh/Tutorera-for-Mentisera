import Link from "next/link";
import type { Metadata } from "next";
import { BRAND_NAME, BUSINESS_ADDRESS, LEGAL_OPERATOR, SITE_URL, SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/site";
import s from "../compliance-pages.module.css";

export const metadata: Metadata = { title: "Business Model", description: "TUTORERA by MENTISERA business operations, marketplace role, and customer journey.", alternates: { canonical: "/business-model" } };

const operationFlow = ["Learning Requirement", "Tutor Discovery / Request Posting", "Tutor Offers", "Tutor Comparison", "Tutor Selection", "Booking Creation", "PKR Price Review", "Checkout", "Secure Payment", "Payment Verification", "Booking Confirmation", "Tutor Delivers Service", "Session Completion", "Rating / Support / Refund if Eligible"];

export default function BusinessModelPage() {
  return <main className={s.page}>
    <section className={s.hero}><h1>{BRAND_NAME} – Our Business Model</h1><p>TUTORERA is the product/platform. {LEGAL_OPERATOR} is the operating and merchant entity.</p></section>
    <section className={s.narrow}>
      <div className={s.content}>
        <p><strong>{BRAND_NAME}</strong> is a technology-enabled digital tutoring marketplace operated by <strong>{LEGAL_OPERATOR}</strong>.</p>
        <p>TUTORERA connects students and parents seeking educational support with qualified independent tutors who offer online and, where available, in-person tutoring services.</p>
        <p>TUTORERA is not primarily a physical-product store and is not a conventional tuition centre. It provides the digital marketplace and technology infrastructure used to discover tutors, submit tutoring requirements, receive tutor offers, compare available tutors, create bookings, process payments, manage sessions, and support service completion.</p>
      </div>
    </section>
    <section className={s.soft}><div className={s.container}><h2 className={s.sectionTitle}>Complete business operation flow</h2><ol className={s.timeline}>{operationFlow.map(step => <li key={step}>{step}</li>)}</ol></div></section>
    <section className={s.container}><div className={s.grid}>
      <article className={s.card}><h2>Student / Parent Side</h2><ul className={s.checklist}>{["Create an account","Browse available tutors","Search by subject, level, location, teaching mode, availability and rate","Post a tutoring requirement","Receive tutor offers","Compare tutors","Review qualifications and experience","Review pricing in PKR","Select a tutor","Confirm the booking","Review the final payable amount","Make payment","Receive booking confirmation","Attend the tutoring session","Rate or review the tutor","Contact support or request an eligible refund"].map(x=><li key={x}>{x}</li>)}</ul></article>
      <article className={s.card}><h2>Tutor Side</h2><ul className={s.checklist}>{["Create a tutor profile","Submit identity/qualification information where required","Add subjects and teaching levels","Set availability","Set or propose tutoring rates","Receive relevant tutoring opportunities","Submit an offer","Receive a confirmed booking","Deliver the tutoring service","Receive eligible earnings subject to the applicable TUTORERA marketplace fee structure"].map(x=><li key={x}>{x}</li>)}</ul></article>
    </div></section>
    <section className={s.soft}><div className={s.container}><h2 className={s.sectionTitle}>TUTORERA&apos;s role</h2><div className={s.threeGrid}>{["Tutor discovery","Tutor matching","Tuition-request posting","Tutor bidding/offers","Booking management","Scheduling","Customer communication","Payment facilitation","Session tracking","Refund/dispute support","Tutor ratings and reviews","Customer support","Platform governance"].map(item=><div className={s.card} key={item}><h3>{item}</h3></div>)}</div></div></section>
    <section className={s.narrow}><div className={s.infoBox}><h2>Merchant details</h2><p><strong>Legal Operator:</strong> {LEGAL_OPERATOR}</p><p><strong>Website:</strong> {SITE_URL}</p><p><strong>Email:</strong> <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p><p><strong>Phone / WhatsApp:</strong> {SUPPORT_PHONE}</p><p><strong>Address:</strong> <span className={s.address}>{BUSINESS_ADDRESS}</span></p><p><Link className={s.cta} href="/payment-gateway-information">View payment gateway information</Link></p></div></section>
  </main>;
}
