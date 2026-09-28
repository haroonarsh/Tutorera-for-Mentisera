import { createDirectBookingRequestSchema, createRequestSchema } from "../validators/request.validator";

const baseRequest = {
  subject: "Mathematics",
  description: "Structured support for upcoming coursework and assessments.",
  budget: 35,
  teachingMode: "online",
  schedule: "Monday and Wednesday, 18:00",
};

describe("market-specific request levels", () => {
  it.each(["GCSE", "Key Stage 3", "CBSE Class 10", "Ontario Curriculum (OSSD)"])("accepts %s for a tuition request", (level) => {
    expect(createRequestSchema.safeParse({ ...baseRequest, level }).success).toBe(true);
  });

  it("accepts a market-specific level for direct booking", () => {
    expect(createDirectBookingRequestSchema.safeParse({
      ...baseRequest,
      tutorId: "tutor-user-id",
      level: "GCSE",
    }).success).toBe(true);
  });
});
