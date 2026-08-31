// src/tests/upload-mime.test.ts
//
// Covers BE-08 (uploaded files trust client MIME metadata) from the audit.
// Tests verifyFileSignature directly — the function responsible for
// inspecting actual file content (magic bytes) rather than trusting
// whatever mimetype the client claims.

import { verifyFileSignature } from "../middlewares/upload.middleware";

describe("BE-08: upload content is verified by real file signature, not claimed MIME type", () => {
  it("rejects plain text content even if it would be labeled as an image", async () => {
    const fakeImageBuffer = Buffer.from("this is just plain text, not an image at all");

    const result = await verifyFileSignature(fakeImageBuffer, ["image/jpeg", "image/png", "image/webp"]);

    expect(result.valid).toBe(false);
  });

  it("accepts a real PNG based on its actual magic bytes", async () => {
    // Real PNG file signature: 89 50 4E 47 0D 0A 1A 0A, followed by minimal
    // valid chunk data so file-type's detector recognizes it as a PNG.
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
      0x89,
    ]);

    const result = await verifyFileSignature(pngHeader, ["image/jpeg", "image/png", "image/webp"]);

    expect(result.valid).toBe(true);
    expect(result.detectedType).toBe("image/png");
  });

  it("rejects a real PDF disguised as an image upload", async () => {
    // A real PDF's actual magic bytes ("%PDF-"), which is a genuine,
    // recognizable file type — just not one on the image allow-list. This
    // simulates someone uploading a real PDF to an avatar endpoint that
    // only accepts images.
    const pdfHeader = Buffer.from("%PDF-1.4\n%âãÏÓ\n1 0 obj");

    const result = await verifyFileSignature(pdfHeader, ["image/jpeg", "image/png", "image/webp"]);

    expect(result.valid).toBe(false);
  });

  it("accepts a real PDF when the allow-list includes documents", async () => {
    const pdfHeader = Buffer.from("%PDF-1.4\n%âãÏÓ\n1 0 obj");

    const result = await verifyFileSignature(pdfHeader, ["application/pdf", "image/jpeg", "image/png"]);

    expect(result.valid).toBe(true);
  });
});