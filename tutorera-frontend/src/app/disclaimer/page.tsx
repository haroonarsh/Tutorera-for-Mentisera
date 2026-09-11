import { UI_COLORS } from "@/lib/brand";
import { LEGAL_ENTITY_NAME, TRADING_NAME, LEGAL_CONTACT_EMAIL, SUPPORT_EMAIL } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";

const C = UI_COLORS;

export const metadata: Metadata = {
  title: "Platform Disclaimer & Advertising Disclosure",
  description: "TUTORERA disclaimer covering marketplace role, tutor verification limits, user-generated content, and advertising disclosure for Google AdSense.",
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return (
    <div style={{ backgroundColor: 'white' }}>
      <section style={{ backgroundColor: C.primary, padding: '5rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '800', color: 'white', marginBottom: '1rem' }}>
          Platform Disclaimer & Advertising Disclosure
        </h1>
        <p style={{ color: '#cbd5e1', fontSize: '1.05rem', maxWidth: '700px', margin: '0 auto' }}>
          Important information about TUTORERA's role as a marketplace, tutor verification limits, user-generated content, and advertising disclosure.
        </p>
      </section>

      <section style={{ padding: '4rem 1.5rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', color: C.gray500, lineHeight: '1.75', fontSize: '0.95rem' }}>

          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: C.primary, marginBottom: '0.75rem' }}>Marketplace Technology Provider</h2>
            <p>
              {TRADING_NAME}® is a technology marketplace platform operated by {LEGAL_ENTITY_NAME} that connects
              students and parents with independent, self-employed tutors. We do not directly provide tutoring
              services, employ tutors, or accredit any educational institution. All educational instruction is
              delivered directly by independent contractors under separate agreements with students.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: C.primary, marginBottom: '0.75rem' }}>Tutor Verification Disclaimer</h2>
            <p>
              While we verify tutor credentials through our multi-layer verification process (including
              government ID, educational documents, demo video, and background checks where required), we
              cannot guarantee the accuracy, completeness, or ongoing validity of all information provided by
              tutors. Verification status is time-sensitive and subject to our{" "}
              <Link href="/tutor-verification-standards" style={{ color: C.accent, fontWeight: 600 }}>Verification Standards</Link>.
              Users are advised to exercise their own due diligence when selecting a tutor.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: C.primary, marginBottom: '0.75rem' }}>Limitation of Liability</h2>
            <p>
              {TRADING_NAME}® is not responsible for the quality, outcomes, or safety of tutoring sessions,
              disputes between students and tutors, or any results arising from tutoring relationships formed
              on the platform. All tutor profiles, rates, availability, and content are user-generated and do
              not constitute professional advice from {LEGAL_ENTITY_NAME}.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: C.primary, marginBottom: '0.75rem' }}>Educational Content & Research</h2>
            <p>
              All content on this platform is for informational purposes only. Blog articles, research reports,
              and guides are provided "as is" without warranties of any kind. Rates shown in research pages are
              aggregated advertised rates from public profiles and do not represent completed transactions or
              guarantees of future pricing. See our{" "}
              <Link href="/research-methodology" style={{ color: C.accent, fontWeight: 600 }}>Research Methodology</Link>
              {" "}for full limitations.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: C.primary, marginBottom: '0.75rem' }}>Advertising & Affiliate Disclosure</h2>
            <p>
              This website participates in the Google AdSense program. Third-party advertisers, including
              Google AdSense, may place cookies on your browser to collect information about your activities
              across websites for the purpose of delivering targeted advertisements. These third parties
              operate their own cookie policies and privacy practices. We have no control over, and assume no
              responsibility for, the content, privacy policies, or practices of any third-party advertisers
              or ad servers. This platform uses{" "}
              <Link href="/cookies" style={{ color: C.accent, fontWeight: 600 }}>Google AdSense</Link>{" "}
              with publisher ID <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>ca-pub-2559940686225219</code>
              {" "}to serve contextual and interest-based advertisements. Ad placements are clearly labelled as
              "Advertisement" and do not influence our editorial content or tutor verification standards. We do
              not sell personal data to advertisers. For advertising inquiries, contact{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: C.accent, fontWeight: 600 }}>{SUPPORT_EMAIL}</a>.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: C.primary, marginBottom: '0.75rem' }}>Changes to Services</h2>
            <p>
              {LEGAL_ENTITY_NAME} reserves the right to modify or discontinue services, ad placements, or any
              portion of the platform at any time without notice. The presence of advertisements does not
              imply endorsement or recommendation of any advertised product or service by {TRADING_NAME}®.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: C.primary, marginBottom: '0.75rem' }}>Contact Information</h2>
            <p>
              For questions regarding this disclaimer or our advertising practices, contact{" "}
              <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} style={{ color: C.accent, fontWeight: 600 }}>{LEGAL_CONTACT_EMAIL}</a>.
            </p>
          </div>

        </div>
      </section>
    </div>
  );
}
