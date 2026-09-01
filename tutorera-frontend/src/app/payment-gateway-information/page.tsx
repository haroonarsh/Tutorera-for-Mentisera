import Link from "next/link";
import type { Metadata } from "next";
import { BRAND_NAME, BUSINESS_ADDRESS, LEGAL_OPERATOR, SITE_URL, SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/site";
import s from "../compliance-pages.module.css";

export const metadata: Metadata = {
  title: "Payment Gateway Information",
  description: "Merchant information, gateway purpose, and student-led reverse marketplace payment timing for TUTORERA by MENTISERA.",
  alternates: { canonical: "/payment-gateway-information" },
};

const rapidPayStatement = "TUTORERA operates a student-led reverse marketplace for tutoring. Students or parents post tutoring requirements and may state their preferred budget in PKR. Eligible tutors can submit offers based on the requirement. The student compares available tutor profiles and offers and independently selects a tutor. Once a tutor's offer is accepted, the agreed tutoring rate is locked and a booking is generated. Payment is then collected through the authorized payment gateway against that specific confirmed booking. The tutor subsequently delivers the tutoring service.";
const flow = ["Post Requirement", "Receive Offers", "Select Tutor", "Accept Price", "Booking Created", "Review PKR Amount", "Pay", "Booking Confirmed", "Tutoring Delivered"];
const useCases = ["Online tutoring sessions","In-person tutoring bookings","One-to-one tutoring","Group tutoring where offered","Academic tutoring","Examination preparation","Language tutoring","Skills tutoring","Tutoring packages","Legitimate platform/service charges disclosed before payment"];
const prohibited = ["Posting a requirement without selecting a tutor","Holding speculative offer money","Peer-to-peer money transfer","Remittance","Cash withdrawals","Cryptocurrency trading","Investment collection","Lending","Gambling","Unrelated financial transactions","Prohibited goods or services"];

export default function PaymentGatewayInformationPage() {
  return (
    <main className={s.page}>
      <section className={s.hero}>
        <h1>Merchant Information</h1>
        <p>Public payment-gateway information for {BRAND_NAME}.</p>
      </section>

      <section className={s.container}>
        <div className={s.grid}>
          <article className={s.card}>
            <h2>Merchant summary</h2>
            <p><strong>Legal Operator:</strong> {LEGAL_OPERATOR}</p>
            <p><strong>Platform:</strong> TUTORERA</p>
            <p><strong>Brand:</strong> {BRAND_NAME}</p>
            <p><strong>Business:</strong> Digital tutoring marketplace</p>
            <p><strong>Pricing Model:</strong> Student requirement + tutor offer + student selection</p>
            <p><strong>Currency:</strong> PKR</p>
            <p><strong>Payment Timing:</strong> Only after tutor selection and final price acceptance</p>
            <p><strong>Gateway Purpose:</strong> Collect payment against a specific confirmed tutoring booking</p>
            <p><strong>Website:</strong> {SITE_URL}</p>
            <p><strong>Email:</strong> <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
            <p><strong>Phone:</strong> {SUPPORT_PHONE}</p>
            <p><strong>Address:</strong> <span className={s.address}>{BUSINESS_ADDRESS}</span></p>
          </article>
          <article className={s.card}>
            <h2>How TUTORERA Uses the Payment Gateway</h2>
            <p>{rapidPayStatement}</p>
            <p>TUTORERA by MENTISERA uses an authorized payment gateway to collect payments for confirmed tutoring bookings. Students do not make payment merely to post a tutoring requirement or receive tutor offers.</p>
            <div className={s.flow}>{flow.map((x) => <span key={x}>{x}</span>)}</div>
          </article>
        </div>
      </section>

      <section className={s.soft}>
        <div className={s.container}>
          <div className={s.grid}>
            <article className={s.card}><h2>Gateway may collect payments for</h2><ul className={s.checklist}>{useCases.map((x) => <li key={x}>{x}</li>)}</ul></article>
            <article className={s.card}><h2>Gateway is not used for</h2><ul>{prohibited.map((x) => <li key={x}>{x}</li>)}</ul></article>
          </div>
        </div>
      </section>

      <section className={s.narrow}>
        <div className={s.infoBox}>
          <h2>Reviewer links</h2>
          <div className={s.flow}>{[{l:"Business Model",h:"/business-model"},{l:"Student Journey",h:"/student-journey"},{l:"How It Works",h:"/how-it-works"},{l:"Services",h:"/services"},{l:"Pricing",h:"/pricing"},{l:"Refund Policy",h:"/refund-policy"},{l:"Cancellation Policy",h:"/cancellation-policy"},{l:"Terms",h:"/terms"},{l:"Contact",h:"/contact"}].map((x) => <Link key={x.h} href={x.h}>{x.l}</Link>)}</div>
        </div>
      </section>
    </main>
  );
}
