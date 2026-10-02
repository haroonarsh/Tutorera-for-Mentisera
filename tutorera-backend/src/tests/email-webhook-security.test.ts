import request from "supertest";
import app from "../app";

describe("Resend webhook verification", () => {
  const originalSecret = process.env.RESEND_WEBHOOK_SECRET;
  const originalEnabled = process.env.RESEND_WEBHOOK_ENABLED;

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.RESEND_WEBHOOK_SECRET;
    else process.env.RESEND_WEBHOOK_SECRET = originalSecret;

    if (originalEnabled === undefined) delete process.env.RESEND_WEBHOOK_ENABLED;
    else process.env.RESEND_WEBHOOK_ENABLED = originalEnabled;
  });

  it("rejects unsigned events with 503 when webhook verification is not configured", async () => {
    delete process.env.RESEND_WEBHOOK_SECRET;

    const response = await request(app)
      .post("/api/v1/webhooks/resend")
      .send({ type: "email.delivered", data: { email_id: "forged-id" } });

    expect(response.status).toBe(503);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/not configured/i);
  });

  it("rejects events with 503 when webhooks are explicitly disabled", async () => {
    process.env.RESEND_WEBHOOK_ENABLED = "false";
    process.env.RESEND_WEBHOOK_SECRET = "whsec_test12345";

    const response = await request(app)
      .post("/api/v1/webhooks/resend")
      .send({ type: "email.delivered", data: { email_id: "forged-id" } });

    expect(response.status).toBe(503);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/disabled/i);
  });

  it("rejects unsigned events with 401 when secret is configured but Svix headers are missing", async () => {
    process.env.RESEND_WEBHOOK_SECRET = "whsec_test12345";

    const response = await request(app)
      .post("/api/v1/webhooks/resend")
      .send({ type: "email.delivered", data: { email_id: "forged-id" } });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/signature headers/i);
  });
});
