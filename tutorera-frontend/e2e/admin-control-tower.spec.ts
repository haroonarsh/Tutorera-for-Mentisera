import { expect, test } from "@playwright/test";

const apiPattern = "**/api/v1/**";

const superAdmin = {
  _id: "admin-1",
  name: "Operations Commander",
  email: "admin@tutorera.ac.pk",
  role: "admin",
  adminRole: "super_admin",
  adminPermissions: ["*"],
  isVerified: true,
  isApproved: true,
  plan: "pro",
};

const pulseData = {
  pulse: {
    activeRequests: 42,
    successfulBookings: 128,
    requestsAtRisk: 7,
    zeroOfferRequests: 4,
    expiringToday: 3,
    verificationBacklog: 18,
    failedPayments: 2,
    openSafetyCases: 1,
  },
  urgentActions: [
    {
      id: "verification_backlog",
      type: "tutor_verification",
      severity: "critical",
      title: "Review 18 Tutors Awaiting Verification > 48h SLA",
      detail: "18 tutor applications have exceeded the 48-hour identity review turnaround SLA.",
      link: "/admin/applications?status=UNDER_REVIEW",
      actionLabel: "Review Tutors",
    },
    {
      id: "zero_offers_backlog",
      type: "at_risk_requests",
      severity: "high",
      title: "4 Student Requests Have Zero Tutor Offers > 24 Hours",
      detail: "Demand requests with zero offers are at high churn risk.",
      link: "/admin/at-risk-requests?filter=zero_offers",
      actionLabel: "Triage Requests",
    },
  ],
  atRiskPreview: [
    {
      request: {
        _id: "req-at-risk-1",
        subject: "A-Level Mathematics",
        level: "A-Level",
        budget: 4500,
        currency: "PKR",
        city: "Lahore",
        teachingMode: "online",
        student: { name: "Zainab Khan", city: "Lahore" },
      },
      riskReasons: ["Zero offers after 24h", "High-value student segment"],
      urgencyLevel: "critical",
      urgencyScore: 92,
      offersCount: 0,
      hoursSinceCreated: 28,
      hoursUntilExpiry: 16,
      recommendedAction: "rematch",
    },
  ],
};

const parentsData = {
  success: true,
  total: 2,
  page: 1,
  pages: 1,
  summary: { REGISTERED: 0, PROFILE_STARTED: 1, LEARNER_LINKED: 1 },
  rows: [
    {
      userId: "parent-u1",
      profileId: "parent-p1",
      name: "Tariq Mahmood",
      email: "tariq@example.com",
      countryCode: "PK",
      city: "Islamabad",
      phase: "LEARNER_LINKED",
      linkedLearners: 2,
      approvalRequiredForBookings: true,
      accountStatus: "active",
      lastUpdatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      userId: "parent-u2",
      profileId: "parent-p2",
      name: "Ayesha Siddiqui",
      email: "ayesha@example.com",
      countryCode: "PK",
      city: "Karachi",
      phase: "PROFILE_STARTED",
      linkedLearners: 0,
      approvalRequiredForBookings: false,
      accountStatus: "registered",
      lastUpdatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ],
};

const refundRequestsData = {
  success: true,
  total: 1,
  refundRequests: [
    {
      _id: "ref-101",
      student: { _id: "s-1", name: "Hamza Ali", email: "hamza@example.com" },
      tutor: { _id: "t-1", name: "Usman Ghani", email: "usman@example.com" },
      booking: { _id: "b-999", amount: 3500, studentTotal: 3500 },
      amount: 3500,
      reason: "tutor_no_show",
      details: "Tutor missed scheduled chemistry session without notice.",
      status: "pending",
      createdAt: new Date().toISOString(),
    },
  ],
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("token", "mock-superadmin-token");
  });

  await page.route(apiPattern, async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (path.endsWith("/auth/me")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ user: superAdmin }),
      });
    }

    if (path.endsWith("/control-tower/pulse")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(pulseData),
      });
    }

    if (path.includes("/onboarding/tutors")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          total: 18,
          summary: { UNDER_REVIEW: 18, APPLICATION_STARTED: 5, APPROVED_FOR_MARKETPLACE: 40 },
          rows: [],
        }),
      });
    }

    if (path.includes("/onboarding/students")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          total: 35,
          summary: { READY_TO_POST: 12, PROFILE_STARTED: 15, ACTIVE_REQUESTER: 8 },
          rows: [],
        }),
      });
    }

    if (path.includes("/onboarding/parents")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(parentsData),
      });
    }

    if (path.includes("/refund-requests")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(refundRequestsData),
      });
    }

    if (path.includes("/at-risk/requests")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: pulseData.atRiskPreview }),
      });
    }

    if (path.includes("/tracking/admin/applications")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          applications: [
            {
              _id: "app-1",
              profileId: "prof-1",
              name: "Farhan Saeed",
              email: "farhan@example.com",
              canonicalStatus: "UNDER_REVIEW",
              onboardingStep: 4,
              onboardingComplete: false,
              city: "Lahore",
              lastUpdatedAt: new Date().toISOString(),
            },
          ],
          total: 1,
          page: 1,
          pages: 1,
        }),
      });
    }

    if (path.includes("/admin/bookings")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          bookings: [
            {
              _id: "b-1",
              student: { name: "Zainab", email: "zainab@example.com", phone: "+923001234567" },
              tutor: { name: "Ahmed", email: "ahmed@example.com", phone: "+923007654321" },
              amount: 5000,
              currency: "PKR",
              schedule: "Monday 4pm",
              status: "confirmed",
              paymentStatus: "failed",
              payoutStatus: "pending",
              paymentNote: "Card declined by issuer",
              payoutNote: "",
              platformFee: 1000,
              tutorPayout: 4000,
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      });
    }

    if (path.includes("/admin/safety/cases")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          cases: [
            {
              _id: "case-1",
              caseId: "CASE-2026-001",
              reporter: { name: "Parent Ali", email: "ali@example.com" },
              reportedUser: { _id: "u-99", name: "Bad Actor", email: "bad@example.com", role: "tutor" },
              category: "harassment",
              severity: "critical",
              status: "open",
              evidence: [],
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      });
    }

    return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
});

test("Control Tower renders operational pulses, pipelines, and action triage", async ({ page }) => {
  await page.goto("/admin");

  // Header and Control Tower
  await expect(page.getByRole("heading", { name: "Marketplace Command Center" })).toBeVisible();

  // Pulse Cards
  await expect(page.getByText("Verification Backlog")).toBeVisible();
  await expect(page.getByText("Requests At Risk")).toBeVisible();

  // Onboarding Pipelines Section
  await expect(page.getByRole("heading", { name: "Onboarding Pipelines & User Readiness" })).toBeVisible();
  await expect(page.getByRole("strong").filter({ hasText: "Tutor Pipeline" })).toBeVisible();
  await expect(page.getByRole("strong").filter({ hasText: "Student Pipeline" })).toBeVisible();
  await expect(page.getByRole("strong").filter({ hasText: "Parent & Guardian Pipeline" })).toBeVisible();

  // Urgent action triage item
  await expect(page.getByText("Review 18 Tutors Awaiting Verification > 48h SLA")).toBeVisible();
});

test("Navigation to Parents Directory works end-to-end", async ({ page }) => {
  await page.goto("/admin/parents");

  await expect(page.getByRole("heading", { name: "Parents & Guardians Directory" })).toBeVisible();
  await expect(page.getByText("Tariq Mahmood")).toBeVisible();
  await expect(page.getByText("Islamabad")).toBeVisible();
  await expect(page.getByText("2 Learners")).toBeVisible();
});

test("Navigation to Refund Requests works end-to-end with dispute triage modal", async ({ page }) => {
  await page.goto("/admin/refund-requests");

  await expect(page.getByRole("heading", { name: "Refund & Dispute Resolution" })).toBeVisible();
  await expect(page.getByText("Hamza Ali")).toBeVisible();
  await expect(page.getByRole("table").getByText("PKR 3,500")).toBeVisible();
  await expect(page.getByText("Tutor Did Not Show Up")).toBeVisible();

  // Open review modal
  await page.getByRole("button", { name: "Review & Resolve" }).click();
  await expect(page.getByRole("heading", { name: "Review Refund Claim" })).toBeVisible();
  await expect(page.getByRole("button", { name: "✓ Approve" })).toBeVisible();
  await expect(page.getByRole("button", { name: "✕ Reject" })).toBeVisible();
});

test("Onboarding pipeline respects query parameter tab switching", async ({ page }) => {
  await page.goto("/admin/onboarding?tab=parents");

  await expect(page.getByRole("heading", { name: "Application & Readiness Pipelines" })).toBeVisible();
  // Ensure Parent tab is active and displays parent onboarding records
  await expect(page.getByRole("button", { name: "Parent & Guardian Onboarding" })).toBeVisible();
});

test("Action button deep links preserve filter query parameters", async ({ page }) => {
  // Test Applications with status=UNDER_REVIEW
  await page.goto("/admin/applications?status=UNDER_REVIEW");
  await expect(page.getByRole("heading", { name: "Tutor applications" })).toBeVisible();

  // Test At-Risk Requests with filter=zero_offers
  await page.goto("/admin/at-risk-requests?filter=zero_offers");
  await expect(page.getByRole("heading", { name: "At-Risk Student Request Queue" })).toBeVisible();

  // Test Payments with status=failed
  await page.goto("/admin/payments?status=failed");
  await expect(page.getByRole("heading", { name: "Payment Management" })).toBeVisible();

  // Test Safety Cases with status=open
  await page.goto("/admin/safety-cases?status=open");
  await expect(page.getByRole("heading", { name: "Trust & Safety Case Management" })).toBeVisible();
});
