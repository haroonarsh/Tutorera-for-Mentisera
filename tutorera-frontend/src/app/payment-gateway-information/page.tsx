import type { Metadata } from "next";
import { BRAND_NAME, BUSINESS_ADDRESS, LEGAL_OPERATOR, SITE_URL, SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/site";
import s from "../compliance-pages.module.css";

export const metadata: Metadata = {
  title: "Payment Gateway & Merchant Information",
  description: "Payment use case and merchant information for TUTORERA by MENTISERA.",
  alternates: { canonical: "/payment-gateway-information" },
  robots: { index: false, follow: false },
};

const journey = ["Post Requirement","Receive Offers","Select Tutor","Accept Rate","Create Booking","Review PKR Amount","Checkout","Secure Payment","Payment Verification","Booking Confirmation","Tutoring Delivery"];

export default function PaymentGatewayInformationPage() {
  return (
    <main className={s.page}>
      <section className={s.hero}><h1>Payment Gateway & Merchant Information</h1><p>Clear payment-use information for confirmed tutoring bookings on {BRAND_NAME}.</p></section>
      <section className={s.container}><div className={s.grid}>
        <article className={s.card}><h2>Merchant / Platform Details</h2><p><strong>Merchant / Legal Operator:</strong> {LEGAL_OPERATOR}</p><p><strong>Platform:</strong> TUTORERA</p><p><strong>Customer Brand:</strong> {BRAND_NAME}</p><p><strong>Business Type:</strong> Student-Led Digital Tutoring Marketplace</p><p><strong>Website:</strong> {SITE_URL}</p><p><strong>Currency:</strong> PKR</p><p><strong>Email:</strong> <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p><p><strong>Phone:</strong> {SUPPORT_PHONE}</p><p><strong>Business Address:</strong> <span className={s.address}>{BUSINESS_ADDRESS}</span></p></article>
        <article className={s.card}><h2>How TUTORERA Uses the Payment Gateway</h2><p>TUTORERA by MENTISERA uses an authorized payment gateway to collect payments for confirmed tutoring bookings. Students do not make payment merely to post tutoring requirements or receive tutor offers. Payment begins only after a student selects a tutor, accepts the tutor&apos;s final rate, reviews the booking details, and confirms the total payable amount in PKR.</p><p><strong>Payment Use Case:</strong> Collection of customer payments against specific confirmed tutoring bookings after a student has selected a tutor and accepted the final tutoring rate.</p></article>
      </div></section>
      <section className={s.soft}><div className={s.container}><h2 className={s.sectionTitle}>Customer journey</h2><div className={s.flow}>{journey.map((x) => <span key={x}>{x}</span>)}</div></div></section>
      <section className={s.container}><div className={s.grid}><article className={s.card}><h2>Gateway may be used for</h2><ul className={s.checklist}>{["Online tutoring","In-person tutoring","Academic tutoring","Test preparation","Language tutoring","Skills tutoring","Tutoring packages","Legitimate platform charges"].map((x) => <li key={x}>{x}</li>)}</ul></article><article className={s.card}><h2>Gateway must not be used for</h2><ul>{["P2P transfers","Remittance","Cash withdrawal","Investment collection","Cryptocurrency","Lending","Gambling","Unrelated transactions","Prohibited goods/services"].map((x) => <li key={x}>{x}</li>)}</ul></article></div></section>
    </main>
  );
}
