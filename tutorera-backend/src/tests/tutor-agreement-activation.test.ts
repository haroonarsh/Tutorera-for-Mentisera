import request from "supertest";
import app from "../app";
import User from "../models/User.model";
import TutorProfile from "../models/TutorProfile.model";
import LegalAgreement from "../models/LegalAgreement.model";
import TutorAgreementAcceptance from "../models/TutorAgreementAcceptance.model";
import {
  evaluateTutorActivation,
  syncTutorActivation,
} from "../services/tutorActivation.service";
import {
  computeAgreementHash,
  getApplicableAgreement,
  seedDefaultLegalAgreements,
} from "../services/legalAgreement.service";
import { generateContractPdf } from "../services/contractPdf.service";
import { generateToken } from "../utils/generateToken";

describe("Tutor Agreement, Contract Acceptance & Activation System", () => {
  let publishedAgreement: any;

  beforeEach(async () => {
    publishedAgreement = await seedDefaultLegalAgreements();
  });

  describe("Unit Tests: Cryptographic Hashing & Agreement Resolution", () => {
    it("generates deterministic SHA-256 agreement hash", () => {
      const hash1 = computeAgreementHash("Sample Agreement Content", "Schedule PK");
      const hash2 = computeAgreementHash("Sample Agreement Content", "Schedule PK");
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    it("detects any material changes in agreement text through hash divergence", () => {
      const hash1 = computeAgreementHash("Original Clause 1", "Schedule PK");
      const hash2 = computeAgreementHash("Tampered Clause 1", "Schedule PK");
      expect(hash1).not.toBe(hash2);
    });

    it("retrieves the current published agreement for Pakistan jurisdiction", async () => {
      const agreement = await getApplicableAgreement("TUTOR_AGREEMENT", "PK");
      expect(agreement).toBeDefined();
      expect(agreement?.version).toBe("TTA-2026.1");
      expect(agreement?.country).toBe("PK");
      expect(agreement?.status).toBe("published");
      expect(agreement?.isCurrent).toBe(true);
    });
  });

  describe("Unit Tests: Authoritative Activation Eligibility Service", () => {
    it("strictly blocks activation when documents or admin review is pending", async () => {
      const user = await User.create({
        name: "Pending Tutor",
        email: "pending-tutor@tutorera-test.pk",
        password: "Password123!",
        role: "tutor",
      });

      const profile = await TutorProfile.create({
        user: user._id,
        fullName: "Pending Tutor",
        hourlyRate: 2000,
        subjects: ["Mathematics"],
        teachingMode: "online",
        onboardingComplete: true,
        cnicFront: "https://cdn.test/cnic.jpg",
        videoIntro: "https://cdn.test/video.mp4",
        education: [{ degree: "BSCS", institution: "NUST", year: 2022, degreeDoc: "https://cdn.test/deg.pdf", degreeDocPublicId: "1" }],
        cnicVerificationStatus: "approved",
        degreeVerificationStatus: "pending",
        demoVideoStatus: "pending",
        verificationStatus: "pending", // NOT approved
      });

      const evalResult = await evaluateTutorActivation(user._id);
      expect(evalResult.isEligible).toBe(false);
      expect(evalResult.checks.adminApproved).toBe(false);
      expect(evalResult.checks.mandatoryDocumentsVerified).toBe(false);
      expect(evalResult.tutorStatus).toBe("under_verification");
    });

    it("strictly blocks activation when admin approved but agreement is NOT accepted", async () => {
      const user = await User.create({
        name: "Approved Unsigned",
        email: "approved-unsigned@tutorera-test.pk",
        password: "Password123!",
        role: "tutor",
      });

      const profile = await TutorProfile.create({
        user: user._id,
        fullName: "Approved Unsigned",
        hourlyRate: 2500,
        subjects: ["Physics"],
        teachingMode: "online",
        onboardingComplete: true,
        cnicFront: "https://cdn.test/cnic.jpg",
        videoIntro: "https://cdn.test/video.mp4",
        education: [{ degree: "MS", institution: "FAST", year: 2021, degreeDoc: "https://cdn.test/deg.pdf", degreeDocPublicId: "1" }],
        cnicVerificationStatus: "approved",
        degreeVerificationStatus: "approved",
        demoVideoStatus: "approved",
        verificationStatus: "approved", // Approved by admin
        agreementAcceptedAt: undefined, // Agreement NOT accepted
      });

      const evalResult = await evaluateTutorActivation(user._id);
      expect(evalResult.isEligible).toBe(false);
      expect(evalResult.checks.adminApproved).toBe(true);
      expect(evalResult.checks.currentAgreementAccepted).toBe(false);
      expect(evalResult.tutorStatus).toBe("approved_pending_agreement");

      // Verify sync keeps marketplace access disabled
      const syncResult = await syncTutorActivation(user._id);
      expect(syncResult.activated).toBe(false);
      expect(syncResult.profile.marketplaceEligible).toBe(false);
      expect(syncResult.profile.tutorStatus).toBe("approved_pending_agreement");
    });

    it("activates tutor ONLY when ALL mandatory conditions including agreement acceptance are satisfied", async () => {
      const user = await User.create({
        name: "Fully Eligible Tutor",
        email: "fully-eligible@tutorera-test.pk",
        password: "Password123!",
        role: "tutor",
      });

      const profile = await TutorProfile.create({
        user: user._id,
        fullName: "Fully Eligible Tutor",
        hourlyRate: 3000,
        subjects: ["Chemistry"],
        teachingMode: "online",
        onboardingComplete: true,
        cnicFront: "https://cdn.test/cnic.jpg",
        videoIntro: "https://cdn.test/video.mp4",
        education: [{ degree: "MPhil", institution: "QAU", year: 2020, degreeDoc: "https://cdn.test/deg.pdf", degreeDocPublicId: "1" }],
        cnicVerificationStatus: "approved",
        degreeVerificationStatus: "approved",
        demoVideoStatus: "approved",
        verificationStatus: "approved",
        agreementAcceptedAt: new Date(),
        agreementVersion: "TTA-2026.1",
      });

      // Create valid acceptance record
      await TutorAgreementAcceptance.create({
        tutor: user._id,
        tutorProfile: profile._id,
        legalAgreement: publishedAgreement._id,
        agreementVersion: publishedAgreement.version,
        agreementHash: publishedAgreement.contentHash,
        country: "PK",
        locale: "en",
        legalNameAtAcceptance: "Fully Eligible Tutor",
        electronicSignature: "Fully Eligible Tutor",
        acceptedAt: new Date(),
        effectiveAt: new Date(),
        consents: {
          consentAgreement: true,
          consentInformationAccuracy: true,
          consentSafeguarding: true,
          consentIndependentContractor: true,
          consentFeesTaxes: true,
          consentElectronicRecords: true,
        },
        feeDisclosureSnapshot: { marketplaceFeePercent: 20, taxRatePercent: 0, currency: "PKR", effectiveFrom: "2026-08-30" },
        contractSnapshot: {
          title: publishedAgreement.title,
          version: publishedAgreement.version,
          content: publishedAgreement.content,
          companyLegalName: "MENTISERA (SMC-Private) Limited",
          tradingName: "TUTORERA®",
          registeredAddress: "Islamabad, Pakistan",
          contactEmail: "hello@mentisera.pk",
        },
        acceptanceStatus: "active",
      });

      const evalResult = await evaluateTutorActivation(user._id);
      expect(evalResult.isEligible).toBe(true);
      expect(evalResult.tutorStatus).toBe("active");
      expect(evalResult.checks.profileComplete).toBe(true);
      expect(evalResult.checks.mandatoryDocumentsVerified).toBe(true);
      expect(evalResult.checks.identityVerified).toBe(true);
      expect(evalResult.checks.adminApproved).toBe(true);
      expect(evalResult.checks.currentAgreementAccepted).toBe(true);
      expect(evalResult.checks.mandatoryConsentsAccepted).toBe(true);
      expect(evalResult.checks.accountNotSuspended).toBe(true);
      expect(evalResult.checks.accountNotTerminated).toBe(true);

      const syncResult = await syncTutorActivation(user._id);
      expect(syncResult.activated).toBe(true);
      expect(syncResult.profile.marketplaceEligible).toBe(true);
      expect(syncResult.profile.tutorStatus).toBe("active");
    });

    it("immediately revokes activation if tutor is suspended", async () => {
      const user = await User.create({
        name: "Suspended Tutor",
        email: "suspended-tutor@tutorera-test.pk",
        password: "Password123!",
        role: "tutor",
        suspendedAt: new Date(),
        moderationStatus: "suspended",
      });

      await TutorProfile.create({
        user: user._id,
        fullName: "Suspended Tutor",
        hourlyRate: 2000,
        subjects: ["Biology"],
        teachingMode: "online",
        onboardingComplete: true,
        cnicFront: "https://cdn.test/cnic.jpg",
        videoIntro: "https://cdn.test/video.mp4",
        education: [{ degree: "BS", institution: "LUMS", year: 2021, degreeDoc: "https://cdn.test/deg.pdf", degreeDocPublicId: "1" }],
        cnicVerificationStatus: "approved",
        degreeVerificationStatus: "approved",
        demoVideoStatus: "approved",
        verificationStatus: "approved",
        suspendedAt: new Date(),
        suspendedReason: "Trust & Safety investigation",
      });

      const evalResult = await evaluateTutorActivation(user._id);
      expect(evalResult.isEligible).toBe(false);
      expect(evalResult.tutorStatus).toBe("suspended");

      const syncResult = await syncTutorActivation(user._id);
      expect(syncResult.activated).toBe(false);
      expect(syncResult.profile.marketplaceEligible).toBe(false);
    });
  });

  describe("End-to-End API Integration & Security Controls", () => {
    let tutorToken: string;
    let tutorUserId: string;
    let tutorProfileId: string;

    beforeEach(async () => {
      const email = `e2e-tutor-${Date.now()}-${Math.random()}@tutorera-test.pk`;
      const user = await User.create({
        name: "Muhammad Haroon",
        email,
        password: "SecurePassword123!",
        role: "tutor",
        countryCode: "PK",
      });

      tutorToken = generateToken(user._id.toString(), user.role);
      tutorUserId = user._id.toString();

      const profile = await TutorProfile.create({
        user: tutorUserId,
        fullName: "Muhammad Haroon",
        phone: "+923001234567",
        countryCode: "PK",
        city: "Islamabad",
        hourlyRate: 2500,
        subjects: ["Computer Science"],
        teachingMode: "online",
        onboardingComplete: true,
        cnicFront: "https://cdn.test/cnic.jpg",
        videoIntro: "https://cdn.test/video.mp4",
        education: [{ degree: "BS", institution: "NUST", year: 2022, degreeDoc: "https://cdn.test/deg.pdf", degreeDocPublicId: "1" }],
        cnicVerificationStatus: "approved",
        degreeVerificationStatus: "approved",
        demoVideoStatus: "approved",
        verificationStatus: "approved", // Admin approved
        agreementAcceptanceRequired: true,
        tutorStatus: "approved_pending_agreement",
        marketplaceEligible: false,
      });

      tutorProfileId = profile._id.toString();
    });

    it("rejects acceptance if signature does not match verified legal name", async () => {
      const res = await request(app)
        .post("/api/v1/tutor/agreements/accept")
        .set("Authorization", `Bearer ${tutorToken}`)
        .send({
          agreementId: publishedAgreement._id,
          electronicSignature: "Wrong Name John Doe",
          confirmations: {
            informationAccurate: true,
            agreementAccepted: true,
            safeguardingAccepted: true,
            independentProvider: true,
            feesTaxesUnderstood: true,
            electronicRecordsConsent: true,
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("SIGNATURE_MISMATCH");
    });

    it("rejects acceptance if any mandatory consent checkbox is omitted", async () => {
      const res = await request(app)
        .post("/api/v1/tutor/agreements/accept")
        .set("Authorization", `Bearer ${tutorToken}`)
        .send({
          agreementId: publishedAgreement._id,
          electronicSignature: "Muhammad Haroon",
          confirmations: {
            informationAccurate: true,
            agreementAccepted: true,
            safeguardingAccepted: false, // Omitted
            independentProvider: true,
            feesTaxesUnderstood: true,
            electronicRecordsConsent: true,
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("MANDATORY_CONSENTS_MISSING");
    });

    it("successfully records agreement acceptance, hashes text, and activates the tutor", async () => {
      const res = await request(app)
        .post("/api/v1/tutor/agreements/accept")
        .set("Authorization", `Bearer ${tutorToken}`)
        .send({
          agreementId: publishedAgreement._id,
          electronicSignature: "Muhammad Haroon",
          confirmations: {
            informationAccurate: true,
            agreementAccepted: true,
            safeguardingAccepted: true,
            independentProvider: true,
            feesTaxesUnderstood: true,
            electronicRecordsConsent: true,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.activated).toBe(true);
      expect(res.body.tutorStatus).toBe("active");
      expect(res.body.agreementHash).toBe(publishedAgreement.contentHash);

      // Verify immutable acceptance record in database
      const record = await TutorAgreementAcceptance.findById(res.body.acceptanceId);
      expect(record).toBeDefined();
      expect(record?.legalNameAtAcceptance).toBe("Muhammad Haroon");
      expect(record?.electronicSignature).toBe("Muhammad Haroon");
      expect(record?.acceptanceStatus).toBe("active");

      // Verify tutor is now live on marketplace
      const updatedProfile = await TutorProfile.findById(tutorProfileId);
      expect(updatedProfile?.marketplaceEligible).toBe(true);
      expect(updatedProfile?.tutorStatus).toBe("active");
    });

    it("prevents double-submission duplicate records (idempotency)", async () => {
      // First submission
      await request(app)
        .post("/api/v1/tutor/agreements/accept")
        .set("Authorization", `Bearer ${tutorToken}`)
        .send({
          agreementId: publishedAgreement._id,
          electronicSignature: "Muhammad Haroon",
          confirmations: {
            informationAccurate: true,
            agreementAccepted: true,
            safeguardingAccepted: true,
            independentProvider: true,
            feesTaxesUnderstood: true,
            electronicRecordsConsent: true,
          },
        });

      // Second immediate click
      const secondRes = await request(app)
        .post("/api/v1/tutor/agreements/accept")
        .set("Authorization", `Bearer ${tutorToken}`)
        .send({
          agreementId: publishedAgreement._id,
          electronicSignature: "Muhammad Haroon",
          confirmations: {
            informationAccurate: true,
            agreementAccepted: true,
            safeguardingAccepted: true,
            independentProvider: true,
            feesTaxesUnderstood: true,
            electronicRecordsConsent: true,
          },
        });

      expect(secondRes.status).toBe(200);
      expect(secondRes.body.message).toContain("already accepted");

      // Count records for this tutor and agreement
      const count = await TutorAgreementAcceptance.countDocuments({
        tutor: tutorUserId,
        legalAgreement: publishedAgreement._id,
        acceptanceStatus: "active",
      });
      expect(count).toBe(1);
    });

    it("generates a downloadable PDF contract containing execution block and agreement hash", async () => {
      const acceptRes = await request(app)
        .post("/api/v1/tutor/agreements/accept")
        .set("Authorization", `Bearer ${tutorToken}`)
        .send({
          agreementId: publishedAgreement._id,
          electronicSignature: "Muhammad Haroon",
          confirmations: {
            informationAccurate: true,
            agreementAccepted: true,
            safeguardingAccepted: true,
            independentProvider: true,
            feesTaxesUnderstood: true,
            electronicRecordsConsent: true,
          },
        });

      const acceptanceId = acceptRes.body.acceptanceId;

      const pdfRes = await request(app)
        .get(`/api/v1/tutor/agreements/${acceptanceId}/pdf`)
        .set("Authorization", `Bearer ${tutorToken}`);

      expect(pdfRes.status).toBe(200);
      expect(pdfRes.headers["content-type"]).toBe("application/pdf");
      expect(pdfRes.headers["content-disposition"]).toContain("TUTORERA-Tutor-Agreement");
      expect(pdfRes.body.length).toBeGreaterThan(1000);
    });

    it("prevents IDOR: a tutor cannot download another tutor's signed agreement PDF", async () => {
      const acceptRes = await request(app)
        .post("/api/v1/tutor/agreements/accept")
        .set("Authorization", `Bearer ${tutorToken}`)
        .send({
          agreementId: publishedAgreement._id,
          electronicSignature: "Muhammad Haroon",
          confirmations: {
            informationAccurate: true,
            agreementAccepted: true,
            safeguardingAccepted: true,
            independentProvider: true,
            feesTaxesUnderstood: true,
            electronicRecordsConsent: true,
          },
        });

      const acceptanceId = acceptRes.body.acceptanceId;

      // Create an attacker tutor
      const otherUser = await User.create({
        name: "Attacker Tutor",
        email: `attacker-${Date.now()}-${Math.random()}@test.pk`,
        password: "Password123!",
        role: "tutor",
        countryCode: "PK",
      });
      const otherToken = generateToken(otherUser._id.toString(), otherUser.role);

      // Attacker attempts to download victim's contract PDF
      const idorRes = await request(app)
        .get(`/api/v1/tutor/agreements/${acceptanceId}/pdf`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(idorRes.status).toBe(403);
    });
  });
});
