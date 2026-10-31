// Tests for adminAgentRead.service.ts — aggregate-only reads, no profile data

jest.mock("../models/TutorProfile.model", () => ({
  __esModule: true,
  default: { countDocuments: jest.fn().mockResolvedValue(0) },
}));
jest.mock("../models/Request.model", () => ({
  __esModule: true,
  default: { countDocuments: jest.fn().mockResolvedValue(0) },
}));
jest.mock("../models/Booking.model", () => ({
  __esModule: true,
  default: { countDocuments: jest.fn().mockResolvedValue(0) },
}));
jest.mock("../models/TutorPayout.model", () => ({
  __esModule: true,
  default: {
    countDocuments: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockResolvedValue([]),
  },
}));
jest.mock("../models/SafetyCase.model", () => ({
  __esModule: true,
  default: { countDocuments: jest.fn().mockResolvedValue(0) },
}));

import { readAdminAgentSummary } from "../services/adminAgentRead.service";

describe("readAdminAgentSummary", () => {
  it("returns tutor summary with correct shape", async () => {
    const result = await readAdminAgentSummary("tutor");
    expect(result.agentId).toBe("tutor");
    expect(typeof result.generatedAt).toBe("string");
    expect(result.data).toHaveProperty("pending");
    expect(result.data).toHaveProperty("active");
    expect(result.data).toHaveProperty("pendingAgreement");
  });

  it("returns marketplace summary with correct shape", async () => {
    const result = await readAdminAgentSummary("marketplace");
    expect(result.agentId).toBe("marketplace");
    expect(result.data).toHaveProperty("openRequests");
    expect(result.data).toHaveProperty("ongoingBookings");
  });

  it("returns finance summary with correct shape", async () => {
    const result = await readAdminAgentSummary("finance");
    expect(result.agentId).toBe("finance");
    expect(result.data).toHaveProperty("pendingPayouts");
    expect(result.data).toHaveProperty("pendingByCurrency");
  });

  it("returns operations summary with correct shape", async () => {
    const result = await readAdminAgentSummary("operations");
    expect(result.agentId).toBe("operations");
    expect(result.data).toHaveProperty("openCases");
    expect(result.data).toHaveProperty("criticalCases");
  });

  it("throws for an unknown agent id", async () => {
    // @ts-expect-error intentional bad input
    await expect(readAdminAgentSummary("unknown")).rejects.toThrow("Unknown agent id");
  });
});
