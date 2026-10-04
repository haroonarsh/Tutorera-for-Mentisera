import { Types } from "mongoose";
import type { ITutorProfile } from "../models/TutorProfile.model";
import { hasApprovedSubjectEvidence, reviewSubjectEvidence } from "../services/subjectEvidenceReview.service";

type Entry = NonNullable<ITutorProfile["subjectEligibility"]>[number];
function fixture(): Entry { return { subject: "Chemistry", status: "pending", levels: [], matchesDiscipline: false, requestedAt: new Date(), evidence: [{ url: "private-url", publicId: "private-id", status: "pending" }] }; }
describe("subject evidence reviews", () => {
  const actor = new Types.ObjectId().toString();
  it("does not treat an uploaded file as approved evidence", () => { expect(hasApprovedSubjectEvidence(fixture().evidence![0])).toBe(false); });
  it("records a reviewer, date, reason, and exact document binding", () => {
    const entry = fixture();
    expect(reviewSubjectEvidence(entry, 0, "approved", "Subject-specific certificate verified", actor).success).toBe(true);
    expect(hasApprovedSubjectEvidence(entry.evidence![0])).toBe(true);
    entry.evidence![0].publicId = "replacement-document";
    expect(hasApprovedSubjectEvidence(entry.evidence![0])).toBe(false);
  });
  it("requires a reason and keeps pending evidence unchanged on failure", () => {
    const entry = fixture();
    expect(reviewSubjectEvidence(entry, 0, "rejected", "  ", actor).success).toBe(false);
    expect(entry.evidence![0].status).toBe("pending");
  });
  it("retains rejection decisions when a new document is submitted", () => {
    const entry = fixture();
    reviewSubjectEvidence(entry, 0, "rejected", "Missing transcript pages", actor);
    expect(entry.status).toBe("needs_evidence");
    expect(reviewSubjectEvidence(entry, 0, "approved", "Changed my mind", actor).success).toBe(false);
    entry.evidence!.push({ url: "new-url", publicId: "new-id", status: "pending" });
    expect(reviewSubjectEvidence(entry, 1, "approved", "Full transcript verified", actor).success).toBe(true);
    expect(entry.evidence![0].status).toBe("rejected");
    expect(entry.status).toBe("pending");
  });
  it.each(["approved", "revoked", "suspended"] as const)("blocks evidence mutations for %s subject requests", (status) => {
    const entry = fixture(); entry.status = status;
    expect(reviewSubjectEvidence(entry, 0, "approved", "Reviewed", actor).success).toBe(false);
  });
  it("rejects invalid indexes and unsecured legacy evidence", () => {
    const entry = fixture();
    expect(reviewSubjectEvidence(entry, -1, "approved", "Reviewed", actor).success).toBe(false);
    entry.evidence![0].publicId = undefined;
    expect(reviewSubjectEvidence(entry, 0, "approved", "Reviewed", actor).success).toBe(false);
  });
});
