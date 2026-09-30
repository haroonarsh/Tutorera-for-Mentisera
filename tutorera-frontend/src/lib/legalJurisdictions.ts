// src/lib/legalJurisdictions.ts
// Shared per-country jurisdiction facts (governing law, dispute forum,
// consumer/privacy/tax/screening rules) - previously duplicated only inside
// /legal/country/[code]/page.tsx. This is real, already-established
// jurisdictional reference data, not substantive contract clauses; it's
// reused by the admin agreement-drafting tool to pre-fill the Country
// Schedule field with known facts, while the Master Contract Text itself
// still requires a human/lawyer to write - this module intentionally does
// not attempt to generate that.

import { LEGAL_OPERATOR } from "@/lib/site";

export interface CountryScheduleData {
  code: string;
  name: string;
  flag: string;
  legalEntity: string;
  governingLaw: string;
  disputeForum: string;
  consumerRights: string;
  dataPrivacyLaw: string;
  childAgeThreshold: number;
  taxNotes: string;
  inPersonScreening: string;
  coolingOffPeriod: string;
}

export const COUNTRY_SCHEDULES: Record<string, CountryScheduleData> = {
  pk: {
    code: "pk",
    name: "Pakistan",
    flag: "🇵🇰",
    legalEntity: `${LEGAL_OPERATOR}`,
    governingLaw: "Laws of the Islamic Republic of Pakistan",
    disputeForum: "Competent Courts of Islamabad, Pakistan",
    consumerRights:
      "Consumer rights under the Islamabad Consumer Protection Act 1995, Punjab Consumer Protection Act 2005, and provincial consumer laws apply. Statutory remedies for service non-performance are preserved.",
    dataPrivacyLaw:
      "Protection under PECA 2016 (Prevention of Electronic Crimes Act), sector-specific banking regulations, and general constitutional privacy protections.",
    childAgeThreshold: 13,
    taxNotes:
      "Tutors operate as self-employed independent contractors and are personally responsible for filing income tax with the Federal Board of Revenue (FBR) and provincial sales tax on services (PRA, SRB, KPRA, BRA) where applicable.",
    inPersonScreening:
      "Mandatory Police Character Certificate issued by Police Khidmat Markaz (PKM) or local police authorities with official tracking diary number.",
    coolingOffPeriod:
      "First-Session Guarantee applies: student may cancel or dispute within 24 hours of first session if service is deficient.",
  },
  ae: {
    code: "ae",
    name: "United Arab Emirates",
    flag: "🇦🇪",
    legalEntity: `${LEGAL_OPERATOR}`,
    governingLaw: "Laws of the United Arab Emirates as applied in the Emirate of Dubai",
    disputeForum: "Dubai Courts / DIFC Small Claims Tribunal where eligible",
    consumerRights:
      "Protected under Federal Law No. 15 of 2020 on Consumer Protection. Transparent pricing, itemized receipts, and service clarity mandatory.",
    dataPrivacyLaw:
      "Federal Decree-Law No. 45 of 2021 regarding the Protection of Personal Data (UAE PDPL). Explicit cross-border transfer protections apply.",
    childAgeThreshold: 14,
    taxNotes:
      "5% UAE Value Added Tax (VAT) rules apply where applicable under Federal Tax Authority (FTA) guidelines. Tutors are independent service providers.",
    inPersonScreening:
      "UAE Good Conduct / Police Clearance Certificate issued through the Ministry of Interior (MOI), Dubai Police, or Abu Dhabi Police.",
    coolingOffPeriod:
      "Session refund available within 24 hours prior to scheduled lesson start; full satisfaction guarantee on introductory session.",
  },
  gb: {
    code: "gb",
    name: "United Kingdom",
    flag: "🇬🇧",
    legalEntity: `${LEGAL_OPERATOR}`,
    governingLaw: "Laws of England and Wales",
    disputeForum: "Courts of England and Wales",
    consumerRights:
      "Consumer Rights Act 2015 and Consumer Contracts Regulations 2013 apply. Statutory rights cannot be limited or excluded by contract.",
    dataPrivacyLaw:
      "UK General Data Protection Regulation (UK GDPR), Data Protection Act 2018, and ICO Age Appropriate Design Code (Children's Code).",
    childAgeThreshold: 13,
    taxNotes:
      "Independent tutors are responsible for declaring educational earnings to HM Revenue & Customs (HMRC) via Self Assessment and monitoring UK VAT thresholds.",
    inPersonScreening:
      "Basic or Enhanced Disclosure and Barring Service (DBS) check, or active subscription to the DBS Update Service.",
    coolingOffPeriod:
      "Statutory 14-day cancellation right applies under Consumer Contracts Regulations, which expires upon express request to commence early digital lesson delivery.",
  },
  us: {
    code: "us",
    name: "United States",
    flag: "🇺🇸",
    legalEntity: `${LEGAL_OPERATOR}`,
    governingLaw: "Federal Arbitration Act and laws of the State of Delaware (without regard to conflict of law principles)",
    disputeForum: "American Arbitration Association (AAA) Consumer Arbitration / Individual Small Claims Court",
    consumerRights:
      "Federal Trade Commission (FTC) Act and state-specific consumer protection legislation (e.g., California Consumer Legal Remedies Act).",
    dataPrivacyLaw:
      "Children's Online Privacy Protection Act (COPPA - requires verifiable parental consent under 13), California Consumer Privacy Act (CCPA/CPRA), and applicable state privacy statutes.",
    childAgeThreshold: 13,
    taxNotes:
      "Tutors receive Form 1099-K if gross transaction volumes exceed statutory IRS reporting thresholds. Independent contractor 1099 classification applies.",
    inPersonScreening:
      "Multi-jurisdictional criminal record search and National Sex Offender Public Website (NSOPW) screening via FCRA-accredited agency.",
    coolingOffPeriod:
      "Platform satisfaction guarantee: dispute lesson charge within 24 hours if tutor fails to attend or instruction is materially defective.",
  },
  sa: {
    code: "sa",
    name: "Saudi Arabia",
    flag: "🇸🇦",
    legalEntity: `${LEGAL_OPERATOR}`,
    governingLaw: "Laws and Regulations of the Kingdom of Saudi Arabia",
    disputeForum: "Competent Courts of the Kingdom of Saudi Arabia",
    consumerRights:
      "Consumer Protection rules issued by the Ministry of Commerce and Saudi E-Commerce Law (Royal Decree No. M/126).",
    dataPrivacyLaw:
      "Saudi Personal Data Protection Law (PDPL - Royal Decree No. M/19) overseen by the Saudi Data & AI Authority (SDAIA).",
    childAgeThreshold: 15,
    taxNotes:
      "Zakat, Tax and Customs Authority (ZATCA) VAT regulations apply where applicable. Independent tutors must comply with freelancing document requirements.",
    inPersonScreening:
      "Criminal Record Status Clearance Certificate issued via Absher / Public Security.",
    coolingOffPeriod:
      "In accordance with Saudi E-Commerce Law, cancellation right applies prior to the delivery of live instructional services.",
  },
};

/** Formats an existing country's jurisdiction facts into a starting-point
 * text block for the admin agreement-drafting tool's Country Schedule
 * field. Only reuses facts already established elsewhere in the codebase -
 * never invents legal text. Returns "" for a country with no schedule on
 * file (the admin still needs to research and write one from scratch). */
export function formatScheduleDraft(countryCode: string): string {
  const schedule = COUNTRY_SCHEDULES[countryCode.toLowerCase()];
  if (!schedule) return "";
  return [
    `Governing Law: ${schedule.governingLaw}`,
    `Dispute Forum: ${schedule.disputeForum}`,
    `Consumer Rights: ${schedule.consumerRights}`,
    `Data Privacy Law: ${schedule.dataPrivacyLaw}`,
    `Minimum Age Threshold: ${schedule.childAgeThreshold}`,
    `Tax Notes: ${schedule.taxNotes}`,
    `In-Person Screening Requirement: ${schedule.inPersonScreening}`,
    `Cooling-Off / Cancellation Period: ${schedule.coolingOffPeriod}`,
    "",
    "— Pre-filled from the existing public legal schedule (/legal/country/" + schedule.code + "). Review and adapt for this specific agreement before publishing; this is jurisdictional reference data, not reviewed contract language.",
  ].join("\n");
}
