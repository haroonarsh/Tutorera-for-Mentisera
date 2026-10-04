import crypto from "crypto";
import LegalAgreement, { ILegalAgreement, AgreementDocumentType } from "../models/LegalAgreement.model";
import { COUNTRIES } from "../config/countries";

export function computeAgreementHash(content: string, schedule: string = ""): string {
  const normalized = `${content.trim()}\n---SCHEDULE---\n${schedule.trim()}`.replace(/\r\n/g, "\n");
  return crypto.createHash("sha256").update(normalized, "utf8").digest("hex");
}

export const TUTOR_AGREEMENT_VERSION = "TTA-2026.1";

export const TUTOR_AGREEMENT_MASTER_TEXT = `TUTORERA® TUTOR MARKETPLACE & INDEPENDENT TUTOR AGREEMENT
Version: ${TUTOR_AGREEMENT_VERSION}

1. PARTIES & RECITALS
This TUTORERA® Tutor Marketplace & Independent Tutor Agreement ("Agreement") constitutes a legally binding contract entered into by and between MENTISERA (SMC-Private) Limited ("Company", "Platform Operator", "TUTORERA", "we", "us", or "our"), trading as TUTORERA®, having its registered address at House 387, Street 11, Phase 5-B, Ghauri Town, Islamabad, Islamabad Capital Territory, Pakistan (contact: hello@mentisera.pk), and the individual applicant who completes electronic registration, credential verification, and electronic acceptance as an independent educator ("Tutor", "you", or "your").

2. ELECTRONIC ACCEPTANCE & LEGAL CAPACITY
By executing electronic acceptance of this Agreement, you represent and warrant that:
(a) You are of full legal age (at least 18 years of age) and possess full legal capacity to enter into legally enforceable contracts;
(b) You have read, understood, and agreed to be bound by all provisions of this Agreement, including all incorporated policies and the applicable Country Legal Schedule;
(c) Your electronic signature and consent constitute valid, enforceable legal execution under applicable electronic transactions law.

3. INDEPENDENT EDUCATOR RELATIONSHIP (NO EMPLOYMENT)
You perform tutoring services strictly as an independent service provider and independent contractor. Nothing in this Agreement, nor any action taken under it, creates an employer-employee relationship, agency, joint venture, franchise, or partnership between you and TUTORERA or MENTISERA (SMC-Private) Limited. You retain full pedagogical autonomy, set your schedule, determine your hourly rate, select your teaching methodologies, provide your own devices and instructional materials, and independently decide whether to accept or decline student inquiries.

4. CREDENTIAL VERIFICATION, PROFILE ACCURACY & REVERIFICATION
(a) You warrant that all personal identity documents (CNIC/passport/ID), academic degrees, university transcripts, teaching certifications, demo videos, and background certificates submitted to TUTORERA are authentic, unaltered, and lawfully issued.
(b) You agree to keep your profile information accurate, complete, and current at all times.
(c) TUTORERA reserves the right at any time to require reverification or updated background documentation to protect platform safety and regulatory compliance.

5. STUDENT-LED MARKETPLACE, TUTOR OFFERS & BOOKING FORMATION
(a) TUTORERA operates a student-led marketplace where students or their parents publish tuition requirements.
(b) As an approved and activated Tutor, you may review student requirements and submit binding tuition offers or counter-offers.
(c) A binding educational contract is formed between you and the student (or parent/guardian) when the student accepts your offer and completes checkout on the platform.

6. MARKETPLACE PLATFORM FEES, TAXES & DISCLOSURE
(a) In consideration for marketplace technology, student matching, credential verification badging, payment infrastructure, and dispute mediation, TUTORERA deducts a service fee from gross tuition earnings.
(b) The applicable platform fee percentage and statutory tax rates are determined dynamically by platform fee configuration and are clearly disclosed to you prior to accepting bookings and in your earnings dashboard.
(c) You are solely responsible for calculating, reporting, and remitting all personal income taxes, self-employment taxes, and social contributions applicable to your earnings in your jurisdiction.

7. PAYOUT SETTLEMENT, DISPUTES & CHARGEBACKS
(a) Net tutor earnings are disbursed to your registered bank account or verified digital wallet according to platform settlement cycles (typically within 3 to 5 business days following verified lesson completion).
(b) TUTORERA reserves the right to withhold disputed funds pending investigation of valid student claims under the First-Session Guarantee, session non-delivery, safety complaints, or suspected fraudulent activity.
(c) If a student initiates an unjustified payment chargeback, TUTORERA will provide platform records in defense; fraudulent chargebacks or tutor-induced disputes may result in payout offsets.

8. NON-CIRCUMVENTION & MARKETPLACE INTEGRITY
(a) For any student, parent, or family introduced to you through TUTORERA, you strictly agree that all tutoring sessions, extensions, additional subjects, and payments must be booked and processed exclusively through TUTORERA for a minimum period of 12 months following initial introduction.
(b) You must not solicit direct cash, offline bank transfers, or external wallet payments, nor share private phone numbers or WhatsApp contacts prior to confirmed booking.
(c) Circumvention deprives students of payment security, guarantees, and verified records, and constitutes a material breach resulting in immediate account termination and liability for lost platform fees.

9. CHILD SAFEGUARDING & PROTECTION OF MINORS
(a) Where instruction is provided to a student under 18 years of age, an adult parent or legal guardian must be physically present on the premises (for in-person home tuition) or maintain oversight (for online sessions).
(b) In-person tutoring must occur in open, visible common rooms (living room, study room with open doors)—never in closed private bedrooms.
(c) Tutors are strictly prohibited from soliciting private social media connections, non-academic personal photos, or private messaging with minor students.
(d) Any suspected abuse, harassment, or safety compromise must be reported immediately to platform Trust & Safety and local child protection authorities.

10. HOME TUITION & IN-PERSON STANDARDS
(a) In-person home tutors must satisfy enhanced background and identity verification.
(b) Tutors must respect family privacy; student residential addresses must remain strictly confidential and never disclosed to third parties.
(c) Possession or use of firearms, weapons, alcohol, narcotics, or dangerous materials on or near tutoring premises is strictly prohibited.

11. ONLINE TUTORING PROTOCOLS & PRIVACY
(a) Online tutoring sessions must be conducted in well-lit, professional, and quiet environments using reliable internet connections.
(b) Screen sharing and file exchanges must be strictly confined to legitimate educational materials.
(c) Neither party may record, capture, or screenshot tutoring sessions without prior explicit written consent from all participants (and parent/guardian consent for minors).

12. ACADEMIC INTEGRITY & ANTI-CHEATING
You must uphold the highest standards of academic honesty. You are strictly forbidden from taking tests, completing graded assignments, sitting exams, or writing submission papers on behalf of students. Tutoring must focus strictly on conceptual understanding, syllabus explanation, and learning guidance.

13. CONFIDENTIALITY & PERSONAL DATA PROTECTION
You agree to treat all student and family personal information (including names, contact information, academic records, and home addresses) as strictly confidential. You must not sell, disclose, or use student personal data for any purpose other than delivering confirmed tutoring services through the platform.

14. INTELLECTUAL PROPERTY
(a) You retain ownership of your original teaching notes and customized lesson materials.
(b) You grant TUTORERA a non-exclusive license to display your public profile, bio, credentials, and introductory demo video on the platform for student discovery and verification.
(c) TUTORERA trademarks, logos, branding, platform code, and user interface elements remain the exclusive intellectual property of MENTISERA (SMC-Private) Limited.

15. REVIEWS, ATTENDANCE & CANCELLATIONS
(a) Students may submit honest feedback and ratings following completed lessons. Tutors must not manipulate ratings, offer bribes for 5-star reviews, or retaliate against constructive negative feedback.
(b) Both parties must honor scheduled session times. Missed sessions or tardiness must be resolved in accordance with the platform Attendance and Cancellation Policy.

16. PROHIBITED CONDUCT, INVESTIGATIONS & SUSPENSION
TUTORERA reserves the right to immediately suspend or restrict marketplace access, pending investigation, in the event of:
(a) Document forgery, impersonation, or credential misrepresentation;
(b) Child safeguarding violations, harassment, or offensive conduct;
(c) Fee circumvention or solicitation of off-platform payments;
(d) Severe academic dishonesty or ghostwriting;
(e) Repeated unexcused session cancellations or no-shows.

17. DEPARTURE, WITHDRAWAL & TERMINATION
(a) Either party may terminate this Agreement by providing written notice through the platform, subject to fulfilling all accepted, confirmed, and prepaid student bookings.
(b) Upon departure, the tutor's public listing will be deactivated; however, completed transaction records, tax invoices, and electronic contract acceptance logs will be preserved in accordance with statutory accounting and legal record-retention requirements.
(c) Platform deactivation does not relieve either party of outstanding payment or payout settlement obligations accrued prior to termination.

18. PLATFORM ROLE & LIMITATION OF LIABILITY
(a) TUTORERA operates as a two-sided technology platform facilitating introductions, scheduling, payment records, and verification badging.
(b) To the maximum extent permitted by applicable law, TUTORERA and MENTISERA (SMC-Private) Limited shall not be liable for indirect, incidental, punitive, or consequential damages, nor for the pedagogical performance or individual actions of students, parents, or tutors.
(c) TUTORERA's aggregate liability under this Agreement shall not exceed the total platform fees collected by TUTORERA from bookings completed by you during the three (3) months preceding the event giving rise to liability.

19. INDEMNIFICATION
You agree to indemnify, defend, and hold harmless MENTISERA (SMC-Private) Limited, TUTORERA®, its directors, officers, employees, and agents against any claims, losses, liabilities, fines, or expenses (including reasonable legal fees) arising from your gross negligence, willful misconduct, violation of this Agreement, violation of child safeguarding policies, or breach of applicable laws.

20. INCORPORATED POLICIES & AMENDMENTS
This Agreement incorporates by reference:
• Global Terms of Service
• Child Safeguarding Policy & Trust & Safety Standards
• Verification & Badging Policy
• Home Tuition Terms
• Online Tutoring Terms
• Privacy & Data Protection Policy
Material amendments to this Agreement will be published with an updated version number and effective date. Material amendments requiring reacceptance will be notified with a compliance deadline; tutors must reaccept to maintain active marketplace bidding privileges.

21. SEVERABILITY, ASSIGNMENT & ENTIRE AGREEMENT
If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall remain in full force and effect. You may not assign or transfer your rights or obligations under this Agreement. This Agreement constitutes the entire agreement between you and TUTORERA regarding the subject matter herein.`;

export const PAKISTAN_LEGAL_SCHEDULE_TEXT = `PAKISTAN LEGAL SCHEDULE (ADDENDUM PK)
Applicable to all tutors operating in the Islamic Republic of Pakistan or providing tutoring to students in Pakistan.

1. CONTRACTING ENTITY
The platform is operated by MENTISERA (SMC-Private) Limited, a single-member private limited company incorporated under the Companies Act, 2017 of Pakistan, having its registered office at House 387, Street 11, Phase 5-B, Ghauri Town, Islamabad, Islamabad Capital Territory, Pakistan.

2. GOVERNING LAW & JURISDICTION
This Agreement, this Pakistan Legal Schedule, and any dispute or claim arising out of or in connection with them shall be governed by and construed in accordance with the substantive laws of the Islamic Republic of Pakistan.
Any dispute, controversy, or claim arising out of or relating to this Agreement that cannot be resolved amicably through platform support within thirty (30) days shall be referred to and finally resolved by arbitration in Islamabad in accordance with the Arbitration Act, 1940. Subject to arbitration, the courts having jurisdiction in Islamabad, Pakistan shall have exclusive jurisdiction.

3. ELECTRONIC TRANSACTIONS COMPLIANCE
Electronic contracting, electronic records, and electronic signatures under this Agreement are executed in full conformity with the Electronic Transactions Ordinance, 2002 (ETO 2002) of Pakistan. Your electronic typed signature, verified against your government-issued Computerised National Identity Card (CNIC) or official identity documentation, constitutes valid electronic consent.

4. TAX & STATUTORY COMPLIANCE
Tutors operating in Pakistan are recognized as independent self-employed professionals. Tutors are responsible for obtaining their National Tax Number (NTN) where required by the Federal Board of Revenue (FBR) and filing applicable income tax returns. TUTORERA deducts applicable provincial sales taxes on platform services (such as PRA, SRB, KPRA, or BRA where mandated by law) and provides digital tax receipts upon request.

5. CHILD PROTECTION & LOCAL COMPLIANCE
All in-person home tuition conducted within Pakistan must comply with federal and provincial child protection statutes, including the Islamabad Capital Territory Child Protection Act, 2018 and corresponding provincial legislation. Mandatory parental presence during home tuition is strictly enforced.`;

export async function seedDefaultLegalAgreements(): Promise<ILegalAgreement> {
  const hash = computeAgreementHash(TUTOR_AGREEMENT_MASTER_TEXT, PAKISTAN_LEGAL_SCHEDULE_TEXT);

  const existing = await LegalAgreement.findOne({
    documentType: "TUTOR_AGREEMENT",
    version: TUTOR_AGREEMENT_VERSION,
    country: "PK",
  });

  if (existing) {
    if (!existing.isCurrent) {
      existing.isCurrent = true;
      existing.status = "published";
      await existing.save();
    }
    return existing;
  }

  // Ensure no other PK agreement is marked isCurrent
  await LegalAgreement.updateMany(
    { documentType: "TUTOR_AGREEMENT", country: "PK" },
    { $set: { isCurrent: false } }
  );

  const agreement = await LegalAgreement.create({
    documentType: "TUTOR_AGREEMENT",
    version: TUTOR_AGREEMENT_VERSION,
    title: "TUTORERA Tutor Marketplace & Independent Tutor Agreement",
    content: TUTOR_AGREEMENT_MASTER_TEXT,
    applicableSchedule: PAKISTAN_LEGAL_SCHEDULE_TEXT,
    country: "PK",
    locale: "en",
    status: "published",
    isCurrent: true,
    requiresReacceptance: true,
    contentHash: hash,
    effectiveDate: new Date("2026-08-30"),
    publishedAt: new Date("2026-08-30"),
    feeScheduleSnapshot: {
      marketplaceFeePercent: 20,
      taxRatePercent: 0,
      // This seed is the Pakistan legal schedule, so its disclosed currency is
      // the Pakistani market's own currency rather than a settlement default.
      // The live tutor-facing disclosure is built from the real fee config in
      // legalAgreement.controller.ts, not from this seed.
      currency: COUNTRIES.find((c) => c.code === "PK")?.currency || "PKR",
      effectiveFrom: "2026-08-30",
    },
    companyDetails: {
      legalName: "MENTISERA (SMC-Private) Limited",
      tradingName: "TUTORERA®",
      registeredAddress:
        "House 387, Street 11, Phase 5-B, Ghauri Town, Islamabad, Islamabad Capital Territory, Pakistan",
      contactEmail: "hello@mentisera.pk",
    },
    changelogNotes: "Initial authoritative version TTA-2026.1 with Pakistan Legal Schedule.",
  });

  return agreement;
}

export async function getApplicableAgreement(
  documentType: AgreementDocumentType = "TUTOR_AGREEMENT",
  country: string = "PK",
  locale: string = "en",
  options: { session?: import("mongoose").ClientSession } = {}
): Promise<ILegalAgreement | null> {
  const normCountry = (country || "PK").toUpperCase();

  // Try country-specific current published agreement
  let agreement = await LegalAgreement.findOne({
    documentType,
    country: normCountry,
    status: "published",
    isCurrent: true,
  }).session(options.session || null);

  // Fallback to GLOBAL or PK if country-specific is not yet published
  if (!agreement) {
    agreement = await LegalAgreement.findOne({
      documentType,
      country: { $in: ["GLOBAL", "PK"] },
      status: "published",
      isCurrent: true,
    }).session(options.session || null).sort({ country: normCountry === "PK" ? -1 : 1 });
  }

  // If still none, seed the default
  if (!agreement && documentType === "TUTOR_AGREEMENT" && !options.session) {
    agreement = await seedDefaultLegalAgreements() as unknown as typeof agreement;
  }

  return agreement as ILegalAgreement | null;
}
