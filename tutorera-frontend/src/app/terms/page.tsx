import { BUSINESS_ADDRESS, LEGAL_OPERATOR, SUPPORT_EMAIL } from "@/lib/site";
import s from "../compliance-pages.module.css";

const sections = [
  { title: "1. Acceptance of Terms", content: "By accessing or using TUTORERA®, you agree to these Terms and Conditions. If you do not agree, please do not use the platform." },
  { title: "2. Marketplace Role", content: "TUTORERA® is a student-led tutoring marketplace operated by MENTISERA (SMC-Private) Limited. TUTORERA provides technology, request posting, tutor discovery, offer comparison, booking records, payment facilitation, support, and governance. Tutors are independent service providers who deliver the actual tutoring service; TUTORERA is not a tuition centre and does not employ tutors as teachers unless a separate written agreement says otherwise." },
  { title: "3. Student-Led Offer Model", content: "Students or parents may post tutoring requirements and a preferred budget in PKR. Tutors may accept the proposed budget or submit an alternative offer where counter-offers are enabled. The student independently chooses whether to accept an offer. The cheapest offer is not automatically selected, and no tutor is guaranteed work from submitting an offer." },
  { title: "4. User Accounts and Accuracy", content: "Users must provide accurate account, profile, qualification, contact, scheduling, pricing, and payment information. Users are responsible for maintaining account confidentiality and for activity through their account." },
  { title: "5. Tutor Verification and Standards", content: "Tutors may be required to submit identity, academic, experience, and safety-related documents before profile approval. Verification reduces risk but does not guarantee academic outcomes, personal conduct, or future performance." },
  { title: "6. Payments, Fees, and Settlement", content: "Students currently pay the accepted tutoring amount shown in PKR with no student marketplace service fee. Tutor earnings are subject to the disclosed tutor marketplace fee and applicable tax on that fee. The current configured model is student fee 0%, tutor fee 20%, and tax 15% of the tutor fee. Every booking stores the fee configuration disclosed at acceptance." },
  { title: "7. Booking Lifecycle", content: "A booking is created only after a student accepts a tutor offer and the final rate is locked. Payment, confirmation, cancellation, refund, dispute, and completion statuses are managed according to the applicable platform policies and booking records." },
  { title: "8. Contact Sharing and Anti-Circumvention", content: "Sharing phone numbers, WhatsApp numbers, private emails, external payment links, or requests to move the transaction outside TUTORERA is prohibited where platform policy restricts it. Accounts may be warned, limited, suspended, or terminated for circumvention, spam, fraud, harassment, or unsafe conduct." },
  { title: "9. Cancellations, Refunds, and Disputes", content: "Cancellation and refund eligibility depends on timing, payment status, service delivery, communication records, and the published Refund Policy and Cancellation Policy. TUTORERA may review evidence and take administrative action where required." },
  { title: "10. No Affiliation with Other Marketplaces", content: "TUTORERA may use a student-led offer model similar in structure to reverse marketplaces, but it is an independent education technology platform. TUTORERA is not affiliated with, endorsed by, or certified by any ride-hailing or third-party marketplace brand." },
  { title: "11. Termination", content: "TUTORERA® may suspend, restrict, or terminate accounts that violate these Terms, platform policies, safety standards, payment rules, or applicable law." },
  { title: "12. Merchant and Contact Details", content: `TUTORERA by MENTISERA is operated by ${LEGAL_OPERATOR}. Business address: ${BUSINESS_ADDRESS}. For questions about these terms, email ${SUPPORT_EMAIL}.` },
];

export default function TermsPage() {
  return (
    <main className={s.page}>
      <section className={s.hero}>
        <h1>Terms & Conditions</h1>
        <p>Marketplace terms for students, parents, tutors, bookings, payments, and support on TUTORERA®.</p>
      </section>
      <section className={s.container}>
        <div className={s.grid}>
          {sections.map((section) => (
            <article key={section.title} className={s.card}>
              <h2>{section.title}</h2>
              <p>{section.content}</p>
            </article>
          ))}
        </div>
      </section>
      <section className={s.narrow}>
        <div className={s.infoBox}>
          <h2>Last updated</h2>
          <p>September 2, 2026</p>
        </div>
      </section>
    </main>
  );
}
