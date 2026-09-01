import Link from "next/link";
import type { Metadata } from "next";
import { BRAND_NAME, BUSINESS_ADDRESS, LEGAL_OPERATOR, SITE_URL, SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/site";
import s from "../compliance-pages.module.css";

export const metadata: Metadata = { title: "Payment Gateway Information", description: "Merchant information and payment gateway use case for TUTORERA by MENTISERA.", alternates: { canonical: "/payment-gateway-information" } };

const useCases = ["Online tutoring sessions","In-person tutoring bookings","One-to-one tutoring","Group tutoring where offered","Academic tutoring","Examination preparation","Language tutoring","Skills tutoring","Tutoring packages","Legitimate platform/service charges disclosed before payment"];
const prohibited = ["Peer-to-peer money transfer","Remittance","Cash withdrawals","Cryptocurrency trading","Investment collection","Lending","Gambling","Unrelated financial transactions","Prohibited goods or services"];
const flow = ["Browse / Post Requirement", "Select Tutor", "Confirm Booking", "Review PKR Price", "Checkout", "Secure Payment", "Payment Verification", "Booking Confirmation", "Tutoring Service Delivery"];

export default function PaymentGatewayInformationPage() {
  return <main className={s.page}>
    <section className={s.hero}><h1>Merchant Information</h1><p>Public payment-gateway information for {BRAND_NAME}.</p></section>
    <section className={s.container}><div className={s.grid}>
      <article className={s.card}><h2>Merchant summary</h2><p><strong>Legal Operator:</strong> {LEGAL_OPERATOR}</p><p><strong>Platform:</strong> TUTORERA</p><p><strong>Brand:</strong> {BRAND_NAME}</p><p><strong>Business Type:</strong> Digital Tutoring Marketplace</p><p><strong>Website:</strong> {SITE_URL}</p><p><strong>Currency:</strong> PKR</p><p><strong>Email:</strong> <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p><p><strong>Phone:</strong> {SUPPORT_PHONE}</p><p><strong>Address:</strong> <span className={s.address}>{BUSINESS_ADDRESS}</span></p></article>
      <article className={s.card}><h2>Payment Gateway Purpose</h2><p>Collection of payments from customers for legitimate tutoring and education-related services booked through TUTORERA.</p><h3>Customer Payment Journey</h3><div className={s.flow}>{flow.map(x=><span key={x}>{x}</span>)}</div></article>
    </div></section>
    <section className={s.soft}><div className={s.container}><div className={s.grid}><article className={s.card}><h2>Gateway may collect payments for</h2><ul className={s.checklist}>{useCases.map(x=><li key={x}>{x}</li>)}</ul></article><article className={s.card}><h2>Gateway is not used for</h2><ul>{prohibited.map(x=><li key={x}>{x}</li>)}</ul></article></div></div></section>
    <section className={s.narrow}><div className={s.infoBox}><h2>Reviewer links</h2><div className={s.flow}>{[{l:"Business Model",h:"/business-model"},{l:"How It Works",h:"/how-it-works"},{l:"Services",h:"/services"},{l:"Pricing",h:"/pricing"},{l:"Refund Policy",h:"/refund-policy"},{l:"Cancellation Policy",h:"/cancellation-policy"},{l:"Terms",h:"/terms"},{l:"Contact",h:"/contact"}].map(x=><Link key={x.h} href={x.h}>{x.l}</Link>)}</div></div></section>
  </main>;
}
