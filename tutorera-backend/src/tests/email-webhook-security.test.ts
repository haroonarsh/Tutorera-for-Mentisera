import request from "supertest";
import app from "../app";

describe("Resend webhook verification", () => {
  const originalSecret = process.env.RESEND_WEBHOOK_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.RESEND_WEBHOOK_SECRET;
    else process.env.RESEND_WEBHOOK_SECRET = originalSecret;
  });

  it("rejects unsigned events when webhook verification is not configured", async () => {
    delete process.env.RESEND_WEBHOOK_SECRET;

    const response = await request(app)
      .post("/api/v1/webhooks/resend")
      .send({ type: "email.delivered", data: { email_id: "forged-id" } });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
