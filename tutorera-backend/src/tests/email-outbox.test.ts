const send = jest.fn();
jest.mock("resend", () => ({ Resend: jest.fn().mockImplementation(() => ({ emails: { send } })) }));

import EmailLog from "../models/EmailLog.model";
import EmailOutbox from "../models/EmailOutbox.model";
import { deliverOutboxEmail, enqueueEmail, processEmailOutbox } from "../services/emailOutbox.service";

const input = { to: "tutor@test.com", subject: "Application update", html: "<p>Update</p>", eventType: "tutor.profile.submitted", templateId: "application_update" };

describe("durable email outbox", () => {
  beforeEach(() => send.mockReset());
  it("keeps one log and marks its persisted delivery job sent", async () => {
    send.mockResolvedValue({ data: { id: "provider-1" } });
    const job = await enqueueEmail(input);
    await deliverOutboxEmail(job._id.toString());
    expect((await EmailOutbox.findById(job._id))!.status).toBe("sent");
    expect((await EmailLog.findById(job.emailLog))!).toMatchObject({ status: "sent", providerMessageId: "provider-1" });
  });
  it("retains a failed provider send for a later retry without creating another log", async () => {
    send.mockRejectedValueOnce(new Error("provider offline")).mockResolvedValueOnce({ data: { id: "provider-2" } });
    const job = await enqueueEmail(input);
    await expect(deliverOutboxEmail(job._id.toString())).rejects.toThrow("provider offline");
    const failed = (await EmailOutbox.findById(job._id))!;
    expect(failed.status).toBe("queued");
    expect(await EmailLog.countDocuments()).toBe(1);
    await EmailOutbox.updateOne({ _id: job._id }, { $set: { nextAttemptAt: new Date(0) } });
    expect(await processEmailOutbox()).toMatchObject({ attempted: 1, sent: 1, failed: 0 });
    expect(await EmailLog.countDocuments()).toBe(1);
    expect((await EmailLog.findById(job.emailLog))!.retryCount).toBe(1);
  });
});
