import User from "../models/User.model";
import TutorProfile from "../models/TutorProfile.model";
import Request from "../models/Request.model";
import { computeLiquidityScore, getAllLiquidityScores } from "../services/liquidityScore.service";

async function createRequest(student: any, overrides: Record<string, unknown>) {
  return Request.create({
    student: student._id,
    subject: "Mathematics",
    level: "O-Level (Cambridge / Edexcel)",
    description: "Need structured tutoring support for upcoming exams.",
    budget: 2000,
    pricingUnit: "hour",
    currency: "PKR",
    allowCounterOffers: true,
    countryCode: "PK",
    city: "Lahore",
    teachingMode: "online",
    schedule: "Weekday evenings",
    status: "open",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ...overrides,
  });
}

describe("liquidity scoring contracts", () => {
  it("uses the correct subject fields for requests and tutor profiles", async () => {
    const [student, mathTutor, physicsTutor] = await User.create([
      { name: "Liquidity Student", email: "liquidity-student@test.com", password: "password123", role: "student" },
      { name: "Math Tutor", email: "liquidity-math@test.com", password: "password123", role: "tutor" },
      { name: "Physics Tutor", email: "liquidity-physics@test.com", password: "password123", role: "tutor" },
    ]);
    await createRequest(student, {});
    await TutorProfile.create([
      { user: mathTutor._id, fullName: mathTutor.name, countryCode: "PK", city: "Lahore", subjects: ["Mathematics"], teachingMode: "online", verificationStatus: "approved", marketplaceEligible: true },
      { user: physicsTutor._id, fullName: physicsTutor.name, countryCode: "PK", city: "Lahore", subjects: ["Physics"], teachingMode: "online", verificationStatus: "approved", marketplaceEligible: true },
    ]);

    const result = await computeLiquidityScore({ countryCode: "PK", city: "Lahore", subject: "Mathematics", teachingMode: "online" });
    expect(result.meta.openRequests).toBe(1);
    expect(result.meta.eligibleTutors).toBe(1);
    expect(result.meta.sampleSize).toBe(2);
  });

  it("returns only observed market segments instead of a Cartesian product", async () => {
    const student = await User.create({ name: "Segment Student", email: "segment-student@test.com", password: "password123", role: "student" });
    await createRequest(student, {});
    await createRequest(student, { city: "Karachi", subject: "Physics", teachingMode: "in-person" });
    await createRequest(student, { city: "Islamabad", subject: "Chemistry", status: "draft" });

    const scores = await getAllLiquidityScores("PK");
    expect(Object.keys(scores).sort()).toEqual([
      "Karachi|Physics|in-person",
      "Lahore|Mathematics|online",
    ]);
  });
});
