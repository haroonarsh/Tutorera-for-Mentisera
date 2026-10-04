import { NotificationService } from "../services/notification.service";
import { publishReviewNotification } from "../services/reviewNotification.service";

describe("post-commit review notifications", () => {
  afterEach(() => jest.restoreAllMocks());

  it("passes successful delivery to the existing event service", async () => {
    const publish = jest.spyOn(NotificationService, "publishEvent").mockResolvedValue(undefined as never);
    await publishReviewNotification("user-id", "verification.approved", { title: "Approved" });
    expect(publish).toHaveBeenCalledWith("user-id", "verification.approved", { title: "Approved" });
  });

  it("does not fail a committed workflow or log sensitive provider details", async () => {
    jest.spyOn(NotificationService, "publishEvent").mockRejectedValue(new Error("secret recipient and document reason"));
    const log = jest.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(publishReviewNotification("private-user", "verification.rejected", { reason: "private reason" })).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledWith("[ReviewNotification] Post-commit delivery failed", {
      event: "verification.rejected", errorType: "Error",
    });
    expect(JSON.stringify(log.mock.calls)).not.toContain("private");
    expect(JSON.stringify(log.mock.calls)).not.toContain("secret");
  });
});
