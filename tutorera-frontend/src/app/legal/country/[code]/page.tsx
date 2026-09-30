import {
  LEGAL_CONTACT_EMAIL,
  PRIVACY_CONTACT_EMAIL,
  TERMS_VERSION
} from "@/lib/site";
import { COUNTRY_SCHEDULES } from "@/lib/legalJurisdictions";
import {
  ArrowRight,
  Building,
  FileCheck,
  Globe2,
  Scale,
  ShieldCheck
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import s from "../../../compliance-pages.module.css";

export function generateStaticParams() {
  return [
    { code: "pk" },
    { code: "ae" },
    { code: "gb" },
    { code: "us" },
    { code: "sa" },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const schedule = COUNTRY_SCHEDULES[code.toLowerCase()];
  if (!schedule) {
    return {
      title: "Jurisdiction Legal Schedule",
      description: "Jurisdiction-specific legal and regulatory addendum for TUTORERA global marketplace.",
    };
  }

  return {
    title: `${schedule.flag} ${schedule.name} Legal Schedule & Statutory Terms`,
    description: `Specific consumer rights, dispute resolution, tax rules, and privacy regulations governing TUTORERA services in ${schedule.name}.`,
    alternates: {
      canonical: `/legal/country/${schedule.code}`,
    },
  };
}

export default async function CountryLegalSchedulePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const schedule = COUNTRY_SCHEDULES[code.toLowerCase()];

  if (!schedule) {
    notFound();
  }

  return (
    <div className={s.wrapper}>
      {/* Hero */}
      <section className={s.hero}>
        <div className={s.badge}>
          <Globe2 size={16} /> Jurisdiction Addendum: {schedule.name}
        </div>
        <h1 className={s.title}>
          {schedule.flag} {schedule.name} Legal & Regulatory Schedule
        </h1>
        <p className={s.subtitle}>
          This country-specific schedule forms a binding legal addendum to the TUTORERA Global
          Terms of Service and Privacy Policy for users residing or transacting in {schedule.name}.
        </p>
        <div className={s.meta}>
          <span>Schedule ID: {schedule.code.toUpperCase()}-{TERMS_VERSION}</span>
          <span>•</span>
          <span>Operating Entity: {schedule.legalEntity}</span>
          <span>•</span>
          <span>Legal Counsel: {LEGAL_CONTACT_EMAIL}</span>
        </div>
      </section>

      <div className={s.container}>
        {/* Country Selector Jump Bar */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#4b5563" }}>View other countries:</span>
          {Object.values(COUNTRY_SCHEDULES).map((item) => (
            <Link
              key={item.code}
              href={`/legal/country/${item.code}`}
              style={{
                padding: "0.4rem 0.85rem",
                borderRadius: "2rem",
                fontSize: "0.85rem",
                fontWeight: item.code === schedule.code ? "700" : "500",
                backgroundColor: item.code === schedule.code ? "var(--primary, #0f172a)" : "#f1f5f9",
                color: item.code === schedule.code ? "white" : "#334155",
                textDecoration: "none",
              }}
            >
              {item.flag} {item.name}
            </Link>
          ))}
        </div>

        {/* Core Notice */}
        <div className={s.highlightBox}>
          <strong>Relationship to Global Terms:</strong>
          <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.92rem", lineHeight: "1.6" }}>
            The TUTORERA Global Terms of Service apply universally to all marketplace participants.
            However, where mandatory consumer protection, child privacy, or local tax laws in{" "}
            <strong>{schedule.name}</strong> grant you greater statutory rights than set forth in
            the Global Terms, those local statutory rights take legal precedence.
          </p>
        </div>

        {/* Section 1: Governing Law & Jurisdiction */}
        <section className={s.section}>
          <h2 className={s.sectionTitle}>
            <Scale size={22} color="var(--primary, #0f172a)" /> 1. Governing Law & Dispute Forum
          </h2>
          <div className={s.cardGrid}>
            <div className={s.card}>
              <h3 className={s.cardTitle}>Governing Law</h3>
              <p className={s.cardText}>
                Subject to mandatory local consumer conflicts, transactions originating in {schedule.name}{" "}
                are governed by:
              </p>
              <p style={{ fontWeight: "700", marginTop: "0.5rem", color: "var(--primary, #0f172a)" }}>
                {schedule.governingLaw}
              </p>
            </div>
            <div className={s.card}>
              <h3 className={s.cardTitle}>Dispute Resolution Forum</h3>
              <p className={s.cardText}>
                Any formal unresolved dispute, claim, or controversy shall be adjudicated before:
              </p>
              <p style={{ fontWeight: "700", marginTop: "0.5rem", color: "var(--primary, #0f172a)" }}>
                {schedule.disputeForum}
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Statutory Consumer Rights */}
        <section className={s.section}>
          <h2 className={s.sectionTitle}>
            <ShieldCheck size={22} color="var(--primary, #0f172a)" /> 2. Statutory Consumer Protections
          </h2>
          <p>{schedule.consumerRights}</p>
          <div className={s.highlightBox} style={{ marginTop: "1rem" }}>
            <strong>Cooling-Off & Satisfaction Guarantee:</strong>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.92rem" }}>
              {schedule.coolingOffPeriod}
            </p>
          </div>
        </section>

        {/* Section 3: Data Privacy & Minor Safeguards */}
        <section className={s.section}>
          <h2 className={s.sectionTitle}>
            <FileCheck size={22} color="var(--primary, #0f172a)" /> 3. Data Privacy & Age Thresholds
          </h2>
          <div className={s.cardGrid}>
            <div className={s.card}>
              <h3 className={s.cardTitle}>Applicable Privacy Statute</h3>
              <p className={s.cardText}>{schedule.dataPrivacyLaw}</p>
              <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#6b7280" }}>
                Enquiries: <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>{PRIVACY_CONTACT_EMAIL}</a>
              </p>
            </div>
            <div className={s.card}>
              <h3 className={s.cardTitle}>Digital Age of Consent</h3>
              <p className={s.cardText}>
                In {schedule.name}, the statutory minimum age for direct digital account consent is{" "}
                <strong>{schedule.childAgeThreshold} years</strong>. Any student below this age must have their
                account created and supervised by a parent or verified guardian.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: In-Person Screening & Taxation */}
        <section className={s.section}>
          <h2 className={s.sectionTitle}>
            <Building size={22} color="var(--primary, #0f172a)" /> 4. In-Person Screening & Local Tax Treatment
          </h2>
          <div className={s.cardGrid}>
            <div className={s.card}>
              <h3 className={s.cardTitle}>Physical Tuition Background Standard</h3>
              <p className={s.cardText}>{schedule.inPersonScreening}</p>
            </div>
            <div className={s.card}>
              <h3 className={s.cardTitle}>Tax Responsibility & Classification</h3>
              <p className={s.cardText}>{schedule.taxNotes}</p>
            </div>
          </div>

          <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link href="/terms" className={s.primaryBtn}>
              Read Global Terms <ArrowRight size={16} />
            </Link>
            <Link href="/legal" className={s.secondaryBtn}>
              Return to Legal Center
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
