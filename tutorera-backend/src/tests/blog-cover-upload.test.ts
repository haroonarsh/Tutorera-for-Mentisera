import request from "supertest";
import app from "../app";
import User from "../models/User.model";

jest.mock("../utils/uploadToCloudinary", () => ({
  uploadToCloudinary: jest.fn().mockResolvedValue({ secure_url: "https://res.cloudinary.com/test/blog-covers/mock.png", public_id: "tutorera/blog-covers/mock" }),
}));

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-at-least-16-chars";
});

// A minimal valid 1x1 PNG, so file-type detection (real magic-byte sniffing,
// not just the client-supplied mimetype) actually recognizes it as an image.
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

describe("POST /upload/blog-cover", () => {
  async function adminAgent() {
    const admin = await User.create({ name: "Admin", email: "blog-cover-admin@test.com", password: "password123", role: "admin" });
    const agent = request.agent(app);
    await agent.post("/api/v1/auth/login").send({ email: admin.email, password: "password123" }).expect(200);
    return agent;
  }

  async function tutorAgent() {
    const tutor = await User.create({ name: "Tutor", email: "blog-cover-tutor@test.com", password: "password123", role: "tutor" });
    const agent = request.agent(app);
    await agent.post("/api/v1/auth/login").send({ email: tutor.email, password: "password123" }).expect(200);
    return agent;
  }

  it("rejects non-admin roles", async () => {
    const agent = await tutorAgent();
    await agent.post("/api/v1/upload/blog-cover").attach("coverImage", PNG_1X1, "cover.png").expect(403);
  });

  it("uploads a valid image and returns its URL", async () => {
    const agent = await adminAgent();
    const res = await agent.post("/api/v1/upload/blog-cover").attach("coverImage", PNG_1X1, "cover.png").expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.url).toBe("https://res.cloudinary.com/test/blog-covers/mock.png");
  });

  it("rejects a file whose content isn't actually an image", async () => {
    const agent = await adminAgent();
    const res = await agent
      .post("/api/v1/upload/blog-cover")
      .attach("coverImage", Buffer.from("not a real image"), { filename: "cover.png", contentType: "image/png" })
      .expect(400);
    expect(res.body.success).toBe(false);
  });
});
