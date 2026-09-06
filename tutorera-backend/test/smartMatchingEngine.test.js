const test = require("node:test");
const assert = require("node:assert/strict");
const { MatchingService } = require("../dist/services/matching.service");
const { DEFAULT_MATCHING_CONFIG } = require("../dist/config/matchingConfig");

test("Bayesian rating formula calculates correct weighted score", () => {
  // Formula: (v / (v + m)) * R + (m / (v + m)) * C
  // With C = 4.85, m = 5
  // Case 1: Brand new tutor (v = 0, R = 0) -> should be 4.85
  const newTutorScore = MatchingService.calculateBayesianRating(0, 0);
  assert.equal(Math.round(newTutorScore * 100) / 100, 4.85);

  // Case 2: Established 5-star tutor with 15 reviews (v = 15, R = 5.0)
  // (15 / 20) * 5.0 + (5 / 20) * 4.85 = 3.75 + 1.2125 = 4.9625
  const establishedScore = MatchingService.calculateBayesianRating(5.0, 15);
  assert.equal(Math.round(establishedScore * 100) / 100, 4.96);

  // Case 3: Tutor with single bad 1-star review (v = 1, R = 1.0)
  // (1 / 6) * 1.0 + (5 / 6) * 4.85 = 0.1667 + 4.0417 = 4.21
  const badReviewScore = MatchingService.calculateBayesianRating(1.0, 1);
  assert.ok(badReviewScore > 4.0 && badReviewScore < 4.3);
});

test("Home tuition requires mandatory police certificate verification", async () => {
  const request = {
    _id: "req_home_01",
    subject: "Mathematics",
    level: "O Level",
    teachingMode: "home",
    city: "Lahore",
    countryCode: "PK",
    budget: 3000,
    pricingUnit: "hour",
    currency: "PKR",
    days: ["Monday", "Wednesday"],
    schedule: "Evening",
    genderPreference: "any",
  };

  const unverifiedTutor = {
    _id: "tutor_01",
    user: "user_01",
    isVerified: true,
    policeCertificateVerified: false, // NOT verified
    teachingModes: ["home", "online"],
    subjects: ["Mathematics"],
    levels: ["O Level"],
    curricula: ["Cambridge O/A Levels"],
    city: "Lahore",
    countryCode: "PK",
    hourlyRate: 2500,
    averageRating: 5.0,
    totalReviews: 10,
    active: true,
  };

  const result = await MatchingService.calculateMatchScore(request, unverifiedTutor);
  assert.equal(result.score, 0);
  assert.equal(result.tier, "other");
  assert.ok(result.reasons[0].includes("Police certificate"));
});

test("Matching engine awards high compatibility score for matching credentials and availability", async () => {
  const request = {
    _id: "req_online_01",
    subject: "Physics",
    level: "A Level",
    curriculum: "Cambridge O/A Levels",
    teachingMode: "online",
    city: "Islamabad",
    countryCode: "PK",
    budget: 3500,
    pricingUnit: "hour",
    currency: "PKR",
    days: ["Monday", "Tuesday", "Thursday"],
    schedule: "Evening",
    genderPreference: "any",
  };

  const qualifiedTutor = {
    _id: "tutor_02",
    user: "user_02",
    isVerified: true,
    policeCertificateVerified: true,
    teachingModes: ["online"],
    subjects: ["Physics", "Mathematics"],
    levels: ["A Level", "O Level"],
    curricula: ["Cambridge O/A Levels"],
    city: "Islamabad",
    countryCode: "PK",
    hourlyRate: 3000, // Within student budget of 3500
    averageRating: 4.9,
    totalReviews: 12,
    responseRate: 98,
    completionRate: 95,
    responseTimeMinutes: 20,
    active: true,
  };

  const result = await MatchingService.calculateMatchScore(request, qualifiedTutor);
  assert.ok(result.score >= 80, `Expected score >= 80, got ${result.score}`);
  assert.ok(result.tier === "excellent" || result.tier === "strong" || result.tier === "great");
  assert.ok(result.reasons.some(r => r.includes("Physics")));
  assert.ok(result.reasons.some(r => r.includes("budget") || r.includes("Affordable") || r.includes("rate")));
});

test("Default matching config weights sum up properly", () => {
  const onlineSum = Object.values(DEFAULT_MATCHING_CONFIG.onlineWeights).reduce((a, b) => a + b, 0);
  const homeSum = Object.values(DEFAULT_MATCHING_CONFIG.homeWeights).reduce((a, b) => a + b, 0);
  assert.equal(onlineSum, 100);
  assert.equal(homeSum, 100);
});
