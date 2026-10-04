import { verifyFileSignature } from "../middlewares/upload.middleware";
import { uploadSubjectEligibilityEvidence } from "../controllers/tutor.controller";
import TutorProfile from "../models/TutorProfile.model";
import { AuthRequest } from "../types";
import { Response } from "express";

describe("Subject evidence content validation", () => {
  const acceptedTypes = ["application/pdf", "image/jpeg", "image/png"];

  it("rejects executable content even when labelled as a PDF", async () => {
    const forgedFile = Buffer.from("This is not a PDF document or an image.");
    expect((await verifyFileSignature(forgedFile, acceptedTypes)).valid).toBe(false);
  });

  it("accepts an actual PDF signature", async () => {
    const document = Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF");
    expect((await verifyFileSignature(document, acceptedTypes)).valid).toBe(true);
  });

  it("rejects forged content in the upload handler before accessing any profile", async () => {
    const lookup = jest.spyOn(TutorProfile, "findOne");
    const request = { params: { subject: "Mathematics" }, file: { mimetype: "application/pdf", buffer: Buffer.from("Not a PDF"), originalname: "forged.pdf" } } as unknown as AuthRequest;
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    try {
      await uploadSubjectEligibilityEvidence(request, response);
      expect(response.status).toHaveBeenCalledWith(400);
      expect(lookup).not.toHaveBeenCalled();
    } finally { lookup.mockRestore(); }
  });
});
