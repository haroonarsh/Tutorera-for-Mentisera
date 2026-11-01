import { readAdminAgentSummary } from "../services/adminAgentRead.service";
import TutorProfile from "../models/TutorProfile.model";
import Request from "../models/Request.model";
import Booking from "../models/Booking.model";
import SafetyCase from "../models/SafetyCase.model";

jest.mock("../models/TutorProfile.model", () => ({
  __esModule: true,
  default: { countDocuments: jest.fn() },
}));

jest.mock("../models/Request.model", () => ({ __esModule: true, default: { countDocuments: jest.fn() } }));
jest.mock("../models/Booking.model", () => ({ __esModule: true, default: { countDocuments: jest.fn() } }));
jest.mock("../models/SafetyCase.model", () => ({ __esModule: true, default: { countDocuments: jest.fn() } }));

describe("read-only admin specialist", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns aggregate tutor verification counts without profile data", async () => {
    (TutorProfile.countDocuments as jest.Mock)
      .mockResolvedValueOnce(3).mockResolvedValueOnce(8).mockResolvedValueOnce(2);
    const result = await readAdminAgentSummary("tutor");
    expect(result).toEqual({
      agentId: "tutor",
      status: "completed",
      data: { pendingVerifications: 3, approvedTutors: 8, rejectedTutors: 2 },
    });
    expect(TutorProfile.countDocuments).toHaveBeenCalledTimes(3);
    expect(TutorProfile.countDocuments).toHaveBeenCalledWith({ verificationStatus: "pending" });
  });

  it("returns marketplace counts", async () => {
    (Request.countDocuments as jest.Mock).mockResolvedValueOnce(12).mockResolvedValueOnce(4);
    expect((await readAdminAgentSummary("marketplace")).data).toEqual({ activeRequests: 12, awaitingPayment: 4 });
  });

  it("returns finance exception counts", async () => {
    (Booking.countDocuments as jest.Mock).mockResolvedValueOnce(2).mockResolvedValueOnce(1);
    expect((await readAdminAgentSummary("finance")).data).toEqual({ failedPayments: 2, heldPayouts: 1 });
  });

  it("returns open safety case counts", async () => {
    (SafetyCase.countDocuments as jest.Mock).mockResolvedValueOnce(3);
    expect((await readAdminAgentSummary("operations")).data).toEqual({ openSafetyCases: 3 });
  });

  it("does not query the database for unimplemented specialists", async () => {
    const result = await readAdminAgentSummary("unknown" as any);
    expect(result.status).toBe("not_implemented");
    expect(TutorProfile.countDocuments).not.toHaveBeenCalled();
  });
});
