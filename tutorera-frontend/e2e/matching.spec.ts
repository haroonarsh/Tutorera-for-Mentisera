import { expect, test } from "@playwright/test";

const apiPattern = "**/api/v1/**";

const superAdmin = {
  _id: "admin-1",
  name: "Senior Matching Architect",
  email: "architect@tutorera.ac.pk",
  role: "admin",
  adminRole: "super_admin",
  adminPermissions: ["*"],
  isVerified: true,
  isApproved: true,
  plan: "pro",
};

const analyticsMock = {
  success: true,
  analytics: {
    totalMatches: 38,
    avgMatchScore: 86,
    offerConversionRate: 42.1,
    bookingConversionRate: 26.3,
    avgStudentResponseMinutes: 45,
    tierDistribution: {
      excellent: 16,
      great: 12,
      good: 7,
      fair: 3,
    },
    activeRequestsCount: 19,
    verifiedTutorsCount: 45,
    engineStatus: "ONLINE_CALIBRATED",
    hasData: true,
  },
  filters: { algorithm: "RULE_V1" },
};

const configMock = {
  success: true,
  config: {
    algorithmVersion: "RULE_V1",
    onlineWeights: {
      subject: 20,
      levelCurriculum: 16,
      availability: 15,
      mode: 10,
      budget: 12,
      location: 0,
      language: 7,
      quality: 8,
      experience: 5,
      reliability: 5,
      verification: 2,
    },
    homeWeights: {
      subject: 18,
      levelCurriculum: 14,
      availability: 14,
      mode: 10,
      budget: 10,
      location: 15,
      language: 5,
      quality: 6,
      experience: 4,
      reliability: 2,
      verification: 2,
    },
    thresholds: {
      excellent: 90,
      strong: 80,
      good: 70,
      notificationMinimum: 60,
      maxOffers: 5,
    },
    bayesian: {
      globalMeanRating: 4.85,
      minReviewThreshold: 5,
    },
    coldStart: {
      explorationRatio: 0.15,
      newTutorDaysWindow: 30,
      newTutorQualityScore: 4.85,
    },
  },
};

const configHistoryMock = {
  success: true,
  history: [
    {
      _id: "hist-1",
      revision: 1,
      changeReason: "Calibrated Bayesian prior m=5 for fair cold-start rating",
      changedBy: { name: "System Architect", email: "architect@tutorera.ac.pk" },
      createdAt: new Date().toISOString(),
    },
  ],
};

const liveRequestsMock = {
  items: [
    {
      request: {
        _id: "req-1",
        subject: "Mathematics",
        level: "A-Level",
        budget: 4500,
        currency: "PKR",
        pricingUnit: "hr",
        teachingMode: "online",
        city: "Lahore",
        student: { name: "Zainab Khan" },
      },
    },
  ],
};

const simulateMock = {
  success: true,
  totalEligible: 12,
  totalRanked: 2,
  tierSummary: {
    excellent: 1,
    great: 1,
    good: 0,
    fair: 0,
  },
  matches: [
    {
      tutor: {
        _id: "tutor-101",
        name: "Dr. Arshad Farooq",
        email: "arshad@example.com",
        policeCertificateVerified: true,
        hourlyRate: 4000,
        currency: "PKR",
      },
      score: 94,
      tier: "excellent",
      scoreBreakdown: {
        subjectScore: 30,
        levelScore: 20,
        availabilityScore: 20,
        pricingScore: 14,
        ratingScore: 10,
      },
      reasons: ["Exact match on subject", "Full schedule alignment", "Verified police clearance"],
    },
    {
      tutor: {
        _id: "tutor-102",
        name: "Sana Tariq",
        email: "sana@example.com",
        policeCertificateVerified: false,
        hourlyRate: 3500,
        currency: "PKR",
      },
      score: 82,
      tier: "great",
      scoreBreakdown: {
        subjectScore: 30,
        levelScore: 15,
        availabilityScore: 17,
        pricingScore: 10,
        ratingScore: 10,
      },
      reasons: ["Strong subject capability", "Good pricing fit"],
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

    if (path.includes("/matching/admin/analytics")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(analyticsMock),
      });
    }

    if (path.includes("/admin/config/history")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(configHistoryMock),
      });
    }

    if (path.includes("/admin/config")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(configMock),
      });
    }

    if (path.includes("/at-risk/requests")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(liveRequestsMock),
      });
    }

    if (path.includes("/matching/admin/simulate")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(simulateMock),
      });
    }

    return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
});

test("Smart Tutor Matching renders redesigned UI, telemetry, simulator, and calibration tabs", async ({ page }) => {
  await page.goto("/admin/matching");

  // 1. Header & Live Telemetry Pool
  await expect(page.getByRole("heading", { name: "Smart Tutor Matching Engine" })).toBeVisible();
  await expect(page.getByText("ALGORITHM ARCHITECTURE · MULTI-FACTOR ENGINE")).toBeVisible();
  await expect(page.getByText("Live Requests:")).toBeVisible();
  await expect(page.getByText("Verified Tutors:")).toBeVisible();

  // 2. Segmented Navigation Tabs
  const telemetryTab = page.getByRole("button", { name: "Telemetry & Conversion" });
  const simulatorTab = page.getByRole("button", { name: "Interactive Match Simulator" });
  const weightsTab = page.getByRole("button", { name: "Algorithm Weights & Calibration" });

  await expect(telemetryTab).toBeVisible();
  await expect(simulatorTab).toBeVisible();
  await expect(weightsTab).toBeVisible();

  // 3. Telemetry KPIs & Fairness Rules
  await expect(page.getByText("Match Evaluations")).toBeVisible();
  await expect(page.getByText("Avg Match Score")).toBeVisible();
  await expect(page.getByText("Offer Conversion")).toBeVisible();
  await expect(page.getByText("Booking Conversion")).toBeVisible();
  await expect(page.getByText("Response Time")).toBeVisible();

  // Tier distribution & Fairness Rules
  await expect(page.getByText("Match Score Tier Distribution")).toBeVisible();
  await expect(page.getByText("Algorithm Fairness & Trust Rules")).toBeVisible();
  await expect(page.getByText("Zero Platform Revenue Bias")).toBeVisible();
  await expect(page.getByText("Home Tuition Police Verification Gate")).toBeVisible();

  // 4. Switch to Interactive Match Simulator
  await simulatorTab.click();
  await expect(page.getByRole("heading", { name: "Live Match Simulation & Diagnostics" })).toBeVisible();

  // Run simulation
  const evalBtn = page.getByRole("button", { name: "Run Match Evaluation" });
  await expect(evalBtn).toBeVisible();
  await evalBtn.click();

  // Verify ranked candidates and factor breakdowns
  await expect(page.getByText("Dr. Arshad Farooq")).toBeVisible();
  await expect(page.getByText(/Police Verified/)).toBeVisible();
  await expect(page.getByText("Sana Tariq")).toBeVisible();
  await expect(page.getByText("Exact match on subject")).toBeVisible();

  // 5. Switch to Algorithm Weights & Calibration Tab
  await weightsTab.click();
  await expect(page.getByRole("heading", { name: "Live Algorithm Weight Calibration" })).toBeVisible();
  await expect(page.getByText("100 / 100 Points ✓ Calibrated")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Algorithm Calibration History & Audit" })).toBeVisible();
  await expect(page.getByText("Calibrated Bayesian prior m=5 for fair cold-start rating")).toBeVisible();
});
