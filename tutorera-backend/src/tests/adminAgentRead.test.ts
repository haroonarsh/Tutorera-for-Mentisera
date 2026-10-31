import { readAdminAgentSummary } from "../services/adminAgentRead.service";
import TutorProfile from "../models/TutorProfile.model";

jest.mock("../models/TutorProfile.model", () => ({
  __esModule: true,
  default: { countDocuments: jest.fn() },
}));

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

  it("does not query the database for unimplemented specialists", async () => {
    const result = await readAdminAgentSummary("finance");
    expect(result.status).toBe("not_implemented");
    expect(TutorProfile.countDocuments).not.toHaveBeenCalled();
  });
});
