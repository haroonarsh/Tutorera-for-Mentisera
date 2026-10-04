import { expect, test } from "@playwright/test";

test("admin reviews a specific qualification with a mandatory rejection reason", async ({ page }) => {
  const profile = {
    _id: "profile-1", fullName: "Fixture Tutor", phone: "", city: "", gender: "", dateOfBirth: "", bio: "",
    subjects: [], levels: [], hourlyRate: 20, teachingMode: "online", education: [
      { degree: "BSc Biology", institution: "Fixture University", year: 2020, discipline: "Biology", degreeDoc: "document", verificationStatus: "pending" },
      { degree: "MSc Biology", institution: "Fixture University", year: 2022, discipline: "Biology", degreeDoc: "document-2", verificationStatus: "pending" },
    ], subjectEligibility: [{ subject: "Biology", levels: [], status: "pending", matchesDiscipline: false, evidenceRequired: true, requestedAt: "2026-10-04T00:00:00Z", evidence: [{ label: "Teaching certificate", status: "pending", reason: "" }] }], verificationStatus: "pending", rejectionReason: "", onboardingComplete: true,
    cnicVerificationStatus: "approved", degreeVerificationStatus: "pending", demoVideoStatus: "approved",
    policeVerificationStatus: "not_required", avatarVerificationStatus: "approved", marketplaceEligible: false,
    homeTuitionEligible: false, createdAt: "2026-10-04T00:00:00Z",
  };
  const decisions: Record<string, unknown>[] = [];
  const evidenceDecisions: Record<string, unknown>[] = [];
  await page.addInitScript(() => localStorage.setItem("token", "qualification-test-token"));
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = {};
    if (path.endsWith("/auth/me")) body = { user: { _id: "admin-1", name: "Admin", role: "admin", adminRole: "super_admin", email: "admin@example.test", isActive: true } };
    else if (path.endsWith("/tracking/admin/applications/profile-1/degree")) {
      const decision = route.request().postDataJSON();
      decisions.push(decision);
      const qualification = profile.education[decision.qualificationIndex];
      Object.assign(qualification, { verificationStatus: decision.status, reviewReason: decision.reason, verifiedDegreeLevel: decision.verifiedDegreeLevel });
      body = { success: true };
    } else if (path.endsWith("/subject-eligibility/Biology/evidence/0")) {
      const decision = route.request().postDataJSON(); evidenceDecisions.push(decision);
      Object.assign(profile.subjectEligibility[0].evidence[0], { status: decision.status, reason: decision.reason });
      body = { success: true };
    } else if (path.endsWith("/tracking/admin/applications/profile-1")) {
      body = { application: { applicationId: "TUT-TEST", tutorUserId: "tutor-1", tutorName: "Fixture Tutor", tutorEmail: "tutor@example.test", isActive: true, profile, history: [], reviewHistory: [] } };
    } else if (path.endsWith("/tracking/admin/applications")) body = { applications: [{ _id: "profile-1" }] };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.goto("/admin/applications/profile-1");
  const card = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Qualification 2: MSc Biology" }) });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Reject qualification" }).click();
  await expect(card.getByRole("alert")).toContainText("what the tutor must correct");
  expect(decisions).toHaveLength(0);
  await card.getByLabel("Review reason").fill("Upload the full transcript for this MSc.");
  await card.getByRole("button", { name: "Reject qualification" }).click();
  await expect(card.getByText("Reviewer feedback:")).toBeVisible();
  expect(decisions[0]).toMatchObject({ qualificationIndex: 1, status: "rejected", reason: "Upload the full transcript for this MSc." });
  await card.getByLabel("Verified degree level").selectOption("masters");
  await card.getByRole("button", { name: "Approve qualification" }).click();
  await expect(card.getByRole("status")).toContainText("approved");
  expect(decisions[1]).toMatchObject({ qualificationIndex: 1, status: "approved", verifiedDegreeLevel: "masters" });
  const evidenceCard = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Biology evidence 1: Teaching certificate" }) });
  await evidenceCard.getByRole("button", { name: "Approve evidence" }).click();
  await expect(evidenceCard.getByRole("alert")).toContainText("document-specific reason");
  expect(evidenceDecisions).toHaveLength(0);
  await evidenceCard.getByLabel("Review reason").fill("Certificate and issuing institution verified.");
  await evidenceCard.getByRole("button", { name: "Approve evidence" }).click();
  await expect(evidenceCard.getByRole("status")).toContainText("Evidence approved");
  await expect(evidenceCard.getByRole("button", { name: "Approve evidence" })).toHaveCount(0);
  expect(evidenceDecisions[0]).toMatchObject({ status: "approved", reason: "Certificate and issuing institution verified." });
});

test("tutor sees qualification feedback and refreshed decisions without admin controls", async ({ page }) => {
  const qualification = { degree: "BSc Biology", institution: "Fixture University", year: 2020, discipline: "Biology", degreeDoc: "private-document", verificationStatus: "rejected", reviewReason: "Upload all transcript pages.", verifiedDegreeLevel: "" };
  const eligibility = { eligible: false, since: null, reasonIfBlocked: "Education requires review" };
  const component = { status: "pending", rejectionReason: null, submittedAt: null, reviewedAt: null };
  const payload = {
    applicationId: "TUT-TEST", tutorName: "Fixture Tutor", submittedAt: null, lastUpdatedAt: "2026-10-04T00:00:00Z",
    canonicalStatus: "UNDER_REVIEW", canonicalStatusLabel: "Under review", marketplaceEligibility: eligibility,
    homeTuitionEligibility: eligibility, homeTuitionRequired: false, verifiedBadge: false,
    demoVideo: { status: "pending", publicProfileVisible: false, reviewedAt: null, rejectionReason: null },
    verificationChecklist: [], progress: { completed: 0, total: 100, percent: 0 }, timeline: [], history: [],
    reVerificationRequired: false, suspended: false, suspendedReason: null, trackingTokenMeta: { createdAt: null, rotatedAt: null },
    actionRequired: null, publicTrackingPath: "/track/test", verificationComponents: { cnic: component, degree: component, demoVideo: component, police: component },
  };
  await page.addInitScript(() => localStorage.setItem("token", "qualification-test-token"));
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = {};
    if (path.endsWith("/auth/me")) body = { user: { _id: "tutor-1", name: "Fixture Tutor", role: "tutor", email: "tutor@example.test", isActive: true } };
    else if (path.endsWith("/tracking/application-status")) body = { payload };
    else if (path.endsWith("/tutors/profile/me")) body = { profile: { education: [qualification], subjectEligibility: [{ subject: "Biology", status: "needs_evidence", evidenceRequired: true, evidence: [{ label: "Teaching certificate", status: "rejected", reason: "Certificate issuer cannot be verified." }] }] } };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.goto("/tutor/application-status");
  const card = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Qualification 1: BSc Biology" }) });
  await expect(card).toContainText("Upload all transcript pages.");
  await expect(card.getByRole("link", { name: "Update education and documents" })).toHaveAttribute("href", "/onboarding/tutor?step=2");
  await expect(card.getByRole("button", { name: "Approve qualification" })).toHaveCount(0);
  const evidenceCard = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Biology evidence 1: Teaching certificate" }) });
  await expect(evidenceCard).toContainText("Certificate issuer cannot be verified.");
  await expect(evidenceCard.getByRole("button", { name: "Approve evidence" })).toHaveCount(0);
  await expect(page.getByLabel("Upload evidence for Biology")).toBeVisible();
  qualification.verificationStatus = "approved";
  qualification.verifiedDegreeLevel = "bachelors";
  qualification.reviewReason = "Credential verified.";
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(card).toContainText("Credential verified.");
  await expect(card).toContainText("bachelors");
  await expect(card.getByRole("link", { name: "Update education and documents" })).toHaveCount(0);
});
