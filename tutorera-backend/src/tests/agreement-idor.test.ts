// src/tests/agreement-idor.test.ts
//
// Audit §15 follow-on: tutor-agreement acceptance IDOR. The acceptance
// record is a signed legal document — the person who signed, their
// electronic signature, IP, and the consent snapshot. A bypass that
// lets one tutor read or download another tutor's acceptance exposes
// personally-signed legal records.
//
// legalAgreement.controller.ts gates every read/download with
//   if (role !== "admin" && acceptance.tutor.toString() !== req.user._id)
//     → 403
// and gates the write (acceptTutorAgreement) with role === "tutor"
// plus a scoped TutorProfile.findOne({ user: req.user._id }).

import request from "supertest";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import app from "../app";
import User from "../models/User.model";
import TutorProfile from "../models/TutorProfile.model";
import LegalAgreement from "../models/LegalAgreement.model";
import TutorAgreementAcceptance from "../models/TutorAgreementAcceptance.model";

// contractPdf.service calls out to the PDF generator with the whole
// acceptance. For the IDOR test we only care about who may invoke the
// endpoint, so stub to a tiny buffer so the response path still writes
// a body and matches a real 200.
jest.mock("../services/contractPdf.service", () => ({
  generateContractPdf: jest.fn().mockResolvedValue(Buffer.from("%PDF-1.4 stub")),
}));

function tokenFor(userId: string): string {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: "1h" });
}

async function makeUser(role: "tutor" | "student" | "admin", suffix: string) {
  const user = await User.create({
    name: `${role[0].toUpperCase() + role.slice(1)} ${suffix}`,
    email: `${role}-${suffix}@agreement-idor.test`,
    password: "password123",
    role,
    isActive: true,
  });
  return { user, token: tokenFor(user.id) };
}

async function seedAgreementAndAcceptance(tutorUserId: Types.ObjectId) {
  const profile = await TutorProfile.create({
    user: tutorUserId,
    bio: "Honest teaching biography that is sufficiently long.",
    subjects: ["Mathematics"],
    hourlyRate: 1500,
    teachingMode: "online",
  });
  const agreement = await LegalAgreement.create({
    documentType: "TUTOR_AGREEMENT",
    version: "1.0.0",
    title: "Tutor Agreement",
    content: "The full tutor agreement content for the test fixture.",
    contentHash: "sha256-stub-hash-for-fixture",
    country: "PK",
    locale: "en",
    status: "published",
  });
  const acceptance = await TutorAgreementAcceptance.create({
    tutor: tutorUserId,
    tutorProfile: profile._id,
    legalAgreement: agreement._id,
    agreementVersion: agreement.version,
    agreementHash: "test-hash",
    country: "PK",
    locale: "en",
    legalNameAtAcceptance: "Test Tutor",
    electronicSignature: "Test Tutor",
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
    feeDisclosureSnapshot: {
      marketplaceFeePercent: 15,
      taxRatePercent: 0,
      currency: "PKR",
      effectiveFrom: "2026-01-01",
    },
    contractSnapshot: {
      title: "Tutor Agreement",
      version: "1.0.0",
      content: "The full tutor agreement content for the test fixture.",
      companyLegalName: "Tutorera Ltd",
      tradingName: "Tutorera",
      registeredAddress: "Islamabad, PK",
      contactEmail: "legal@tutorera.com",
    },
  });
  return { acceptance, agreement, profile };
}

describe("tutor-agreement IDOR boundaries", () => {
  it("a tutor cannot view another tutor's acceptance record (403)", async () => {
    const owner = await makeUser("tutor", "owner-view");
    const attacker = await makeUser("tutor", "attacker-view");
    const { acceptance } = await seedAgreementAndAcceptance(owner.user._id as Types.ObjectId);

    const res = await request(app)
      .get(`/api/v1/tutor/agreements/${acceptance.id}`)
      .set("Authorization", `Bearer ${attacker.token}`);

    expect(res.status).toBe(403);
    expect(res.body.acceptance).toBeUndefined();
  });

  it("the owning tutor can view their own acceptance record (positive control)", async () => {
    const owner = await makeUser("tutor", "owner-view-ok");
    const { acceptance } = await seedAgreementAndAcceptance(owner.user._id as Types.ObjectId);

    const res = await request(app)
      .get(`/api/v1/tutor/agreements/${acceptance.id}`)
      .set("Authorization", `Bearer ${owner.token}`);

    expect(res.status).toBe(200);
    expect(res.body.acceptance?._id).toBe(acceptance.id);
    expect(res.body.acceptance?.electronicSignature).toBe("Test Tutor");
  });

  it("an admin can view any tutor's acceptance record (bypasses the tutor-id filter)", async () => {
    const admin = await makeUser("admin", "admin-view");
    const owner = await makeUser("tutor", "owner-admin-view");
    const { acceptance } = await seedAgreementAndAcceptance(owner.user._id as Types.ObjectId);

    const res = await request(app)
      .get(`/api/v1/tutor/agreements/${acceptance.id}`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.acceptance?._id).toBe(acceptance.id);
  });

  it("a student cannot view a tutor's acceptance (403)", async () => {
    // Role is not admin and acceptance.tutor !== req.user._id, so the
    // handler's authorization branch rejects.
    const student = await makeUser("student", "student-view");
    const owner = await makeUser("tutor", "owner-student-view");
    const { acceptance } = await seedAgreementAndAcceptance(owner.user._id as Types.ObjectId);

    const res = await request(app)
      .get(`/api/v1/tutor/agreements/${acceptance.id}`)
      .set("Authorization", `Bearer ${student.token}`);

    expect(res.status).toBe(403);
  });

  it("a tutor cannot download another tutor's agreement PDF (403)", async () => {
    const owner = await makeUser("tutor", "owner-pdf");
    const attacker = await makeUser("tutor", "attacker-pdf");
    const { acceptance } = await seedAgreementAndAcceptance(owner.user._id as Types.ObjectId);

    const res = await request(app)
      .get(`/api/v1/tutor/agreements/${acceptance.id}/pdf`)
      .set("Authorization", `Bearer ${attacker.token}`);

    expect(res.status).toBe(403);
    // Must not have sent a PDF body under 403.
    expect(res.headers["content-type"]).not.toContain("application/pdf");
  });

  it("a non-tutor (student) cannot accept a tutor agreement (role gate → 403)", async () => {
    const student = await makeUser("student", "accept-role");

    const res = await request(app)
      .post(`/api/v1/tutor/agreements/accept`)
      .set("Authorization", `Bearer ${student.token}`)
      .send({
        agreementId: new Types.ObjectId().toString(),
        electronicSignature: "Not Allowed",
        confirmations: {
          informationAccurate: true,
          agreementAccepted: true,
          safeguardingAccepted: true,
          independentProvider: true,
          feesTaxesUnderstood: true,
          electronicRecordsConsent: true,
        },
      });

    expect(res.status).toBe(403);
    expect(await TutorAgreementAcceptance.countDocuments()).toBe(0);
  });

  it("an unauthenticated request to download a PDF is rejected (401)", async () => {
    const owner = await makeUser("tutor", "owner-unauth-pdf");
    const { acceptance } = await seedAgreementAndAcceptance(owner.user._id as Types.ObjectId);

    const res = await request(app)
      .get(`/api/v1/tutor/agreements/${acceptance.id}/pdf`);

    expect(res.status).toBe(401);
  });
});
