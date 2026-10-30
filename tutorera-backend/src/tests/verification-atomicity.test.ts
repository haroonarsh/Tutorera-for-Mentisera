/**
 * Atomicity tests for verification component decisions.
 *
 * Verifies that if any write inside session.withTransaction throws, the error
 * propagates (so MongoDB rolls back) and endSession is always called.
 *
 * Uses pure Jest mocks — no mongodb-memory-server — to avoid the fassert()
 * resource issue that occurs under --runInBand on Windows.
 */

// ── Jest mock declarations (hoisted, must not reference module-scope lets/consts) ──

jest.mock("mongoose", () => {
  const actual = jest.requireActual("mongoose");
  return { ...actual, startSession: jest.fn(), Types: actual.Types };
});

jest.mock("../models/TutorDocumentReview.model", () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    // findOne may be chained with .sort() in cleanupDuplicateQueueItems
    findOne: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue(null) }),
    deleteMany: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock("../models/TutorProfile.model", () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}));

jest.mock("../models/User.model", () => ({
  __esModule: true,
  default: {
    findById: jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
        name: "Test Tutor",
        email: "tutor@example.com",
        applicationId: "TUT-001",
      }),
    }),
  },
}));

jest.mock("../models/AdminVerificationReview.model", () => ({
  __esModule: true,
  default: { create: jest.fn().mockResolvedValue([{}]) },
}));

jest.mock("../utils/socket", () => ({ sendNotification: jest.fn().mockResolvedValue(undefined) }));

jest.mock("../utils/logAudit", () => ({ logAudit: jest.fn().mockResolvedValue(undefined) }));

jest.mock("../services/tracking.service", () => ({ recordStatusEvent: jest.fn().mockResolvedValue(undefined) }));

// ── Imports (after mock declarations) ────────────────────────────────────────

import mongoose from "mongoose";
import { approveComponent, rejectComponent } from "../services/verification.service";
import * as logAuditModule from "../utils/logAudit";
import * as trackingModule from "../services/tracking.service";
import TutorDocumentReview from "../models/TutorDocumentReview.model";
import TutorProfile from "../models/TutorProfile.model";

// ── Shared fixtures (built after imports so no TDZ issue) ─────────────────────

const makeId = () => new mongoose.Types.ObjectId();

const actor = { id: makeId().toString(), name: "Admin", role: "admin" as const };

function makeMockSession() {
  return {
    withTransaction: jest.fn() as jest.Mock,
    endSession: jest.fn().mockResolvedValue(undefined) as jest.Mock,
  };
}

function makeProfile() {
  return { _id: makeId(), save: jest.fn().mockResolvedValue(undefined) };
}

function makeItem(profileId: mongoose.Types.ObjectId) {
  return {
    _id: makeId(),
    tutor: makeId(),
    tutorProfile: profileId,
    component: "cnic",
    status: "in_review",
    save: jest.fn().mockResolvedValue(undefined),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("approveComponent atomicity", () => {
  let session: ReturnType<typeof makeMockSession>;
  let profile: ReturnType<typeof makeProfile>;
  let item: ReturnType<typeof makeItem>;

  beforeEach(() => {
    jest.clearAllMocks();
    session = makeMockSession();
    profile = makeProfile();
    item = makeItem(profile._id);
    (mongoose.startSession as jest.Mock).mockResolvedValue(session);
    (TutorDocumentReview.findById as jest.Mock).mockResolvedValue(item);
    // findOne is called with .sort() in cleanupDuplicateQueueItems; mock the chain
    (TutorDocumentReview.findOne as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue(item) });
    (TutorProfile.findById as jest.Mock).mockResolvedValue(profile);
  });

  it("calls withTransaction and endSession on the happy path", async () => {
    session.withTransaction.mockImplementation(async (fn: () => Promise<void>) => fn());
    await approveComponent(item._id.toString(), actor);
    expect(session.withTransaction).toHaveBeenCalledTimes(1);
    expect(session.endSession).toHaveBeenCalledTimes(1);
  });

  it("still calls endSession when the transaction itself throws", async () => {
    session.withTransaction.mockRejectedValue(new Error("Simulated DB failure"));
    await expect(approveComponent(item._id.toString(), actor)).rejects.toThrow("Simulated DB failure");
    expect(session.endSession).toHaveBeenCalledTimes(1);
  });

  it("propagates AuditLog write failure so the transaction rolls back", async () => {
    jest.spyOn(logAuditModule, "logAudit").mockRejectedValueOnce(new Error("AuditLog write failed"));
    session.withTransaction.mockImplementation(async (fn: () => Promise<void>) => fn());
    await expect(approveComponent(item._id.toString(), actor)).rejects.toThrow("AuditLog write failed");
    expect(session.endSession).toHaveBeenCalledTimes(1);
  });

  it("propagates recordStatusEvent failure so the transaction rolls back", async () => {
    jest.spyOn(trackingModule, "recordStatusEvent").mockRejectedValueOnce(new Error("StatusHistory write failed"));
    session.withTransaction.mockImplementation(async (fn: () => Promise<void>) => fn());
    await expect(approveComponent(item._id.toString(), actor)).rejects.toThrow("StatusHistory write failed");
    expect(session.endSession).toHaveBeenCalledTimes(1);
  });
});

describe("rejectComponent atomicity", () => {
  let session: ReturnType<typeof makeMockSession>;
  let profile: ReturnType<typeof makeProfile>;
  let item: ReturnType<typeof makeItem>;

  beforeEach(() => {
    jest.clearAllMocks();
    session = makeMockSession();
    profile = makeProfile();
    item = makeItem(profile._id);
    (mongoose.startSession as jest.Mock).mockResolvedValue(session);
    (TutorDocumentReview.findById as jest.Mock).mockResolvedValue(item);
    (TutorDocumentReview.findOne as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue(item) });
    (TutorProfile.findById as jest.Mock).mockResolvedValue(profile);
  });

  it("calls withTransaction and endSession on the happy path", async () => {
    session.withTransaction.mockImplementation(async (fn: () => Promise<void>) => fn());
    await rejectComponent(item._id.toString(), "Missing document", actor);
    expect(session.withTransaction).toHaveBeenCalledTimes(1);
    expect(session.endSession).toHaveBeenCalledTimes(1);
  });

  it("still calls endSession when the transaction throws", async () => {
    session.withTransaction.mockRejectedValue(new Error("Write conflict"));
    await expect(rejectComponent(item._id.toString(), "Missing document", actor)).rejects.toThrow("Write conflict");
    expect(session.endSession).toHaveBeenCalledTimes(1);
  });

  it("throws before starting a session when rejection reason is blank", async () => {
    await expect(rejectComponent(item._id.toString(), "  ", actor)).rejects.toThrow("Rejection reason is required");
    expect(session.withTransaction).not.toHaveBeenCalled();
  });

  it("propagates AuditLog failure so the transaction rolls back", async () => {
    jest.spyOn(logAuditModule, "logAudit").mockRejectedValueOnce(new Error("AuditLog write failed"));
    session.withTransaction.mockImplementation(async (fn: () => Promise<void>) => fn());
    await expect(rejectComponent(item._id.toString(), "Bad document", actor)).rejects.toThrow("AuditLog write failed");
    expect(session.endSession).toHaveBeenCalledTimes(1);
  });
});
