import type { Metadata } from "next";
import { BRAND_NAME, BUSINESS_ADDRESS, LEGAL_OPERATOR, SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/site";
import s from "../compliance-pages.module.css";

export const metadata: Metadata = { title: "Refund Policy", description: "Refund eligibility and support process for TUTORERA tutoring bookings.", alternates: { canonical: "/refund-policy" } };

export default function RefundPolicyPage() {
  return <main className={s.page}><section className={s.hero}><h1>Refund Policy</h1><p>Refund and dispute support for tutoring bookings made through {BRAND_NAME}.</p></section><section className={s.narrow}><div className={s.content}><h2>Eligible refund support</h2><p>Customers may contact TUTORERA support if a paid tutoring service is not delivered, if a confirmed session is cancelled according to the applicable cancellation terms, or if there is a payment/service dispute requiring review.</p><p>Refund eligibility depends on booking records, payment verification, cancellation timing, service delivery evidence, and the applicable policy shown before or during booking.</p><h2>How to request a refund review</h2><ul><li>Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with your booking reference, transaction reference, amount paid in PKR, and issue details.</li><li>You may also contact Phone / WhatsApp: {SUPPORT_PHONE}.</li><li>TUTORERA may ask for additional information before reaching a decision.</li></ul><h2>Merchant details</h2><p><strong>{LEGAL_OPERATOR}</strong></p><p className={s.address}>{BUSINESS_ADDRESS}</p></div></section></main>;
}
