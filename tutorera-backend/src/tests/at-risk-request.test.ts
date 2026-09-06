// src/tests/at-risk-request.test.ts
// Unit tests for AtRiskRequestService (automated zero-offer rescue)

import mongoose from "mongoose";
import { Types } from "mongoose";
import { jest } from "jest";
import { Request } from "../models/Request.model";
import { Bid } from "../models/Bid.model";
import { User } from "../models/User.model";
import { TutorProfile } from "../models/TutorProfile.model";
import { AtRiskRequestService } from "../services/atRiskRequest.service";
import { MatchingService } from "../services/matching.service";
import { sendNotification } from "../utils/socket";

jest.mock("../utils/socket");
jest.mock("../services/matching.service");

describe("AtRiskRequestService - Automated Zero-Offer Rescue", () => {
  let testStudent: any;
  let testRequest: any;
  let io: any;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create test student
    testStudent = await User.create({
      name: "Test Student",
      email: "student@example.com",
      password: "password",
      role: "student",
      isActive: true,
    });

    // Create test request
    testRequest = await Request.create({
      student: testStudent._id,
      subject: "Mathematics",
      level: "intermediate",
      budget: 2000,
      currency: "PKR",
      teachingMode: "online",
      status: "open",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24h ago
    });

    // Mock socket.io
    io = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    };
  });

  afterEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Close DB connection after all tests
    await mongoose.connection.close();
  });

  describe("autoExpandMatchingForZeroOffer", () => {
    it("should auto-expand matching for zero-offer requests after 24h", async () => {
      // Create zero offers
      await Bid.create({
        request: testRequest._id,
        tutor: new Types.ObjectId(),
        amount: 2000,
        status: "withdrawn",
        createdAt: new Date(),
      });

      const result = await AtRiskRequestService.autoExpandMatchingForZeroOffer(
        testRequest._id.toString(),
        io
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain("Auto-expanded tutor matching");
      expect(MatchingService.dispatchProgressiveNotifications).toHaveBeenCalled();
    });

    it("should return false for non-existent request", async () => {
      const nonExistentId = new Types.ObjectId().toString();
      const result = await AtRiskRequestService.autoExpandMatchingForZeroOffer(
        nonExistentId,
        io
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe("Request not found.");
      expect(MatchingService.dispatchProgressiveNotifications).not.toHaveBeenCalled();
    });

    it("should not dispatch notifications when io is null", async () => {
      const result = await AtRiskRequestService.autoExpandMatchingForZeroOffer(
        testRequest._id.toString(),
        null
      );

      expect(result.success).toBe(true);
      expect(MatchingService.dispatchProgressiveNotifications).toHaveBeenCalledWith(
        testRequest,
        null
      );
    });
  });

  describe("getAtRiskRequests with auto-rescue", () => {
    it("should auto-expand matching for zero-offer requests after 24h in getAtRiskRequests", async () => {
      // Create zero offers
      await Bid.create({
        request: testRequest._id,
        tutor: new Types.ObjectId(),
        amount: 2000,
        status: "withdrawn",
        createdAt: new Date(),
      });

      // Trigger auto-rescue via getAtRiskRequests
      const atRiskItems = await AtRiskRequestService.getAtRiskRequests(100, io);

      expect(atRiskItems).toHaveLength(1);
      expect(atRiskItems[0].request._id.toString()).toBe(testRequest._id.toString());
      expect(MatchingService.dispatchProgressiveNotifications).toHaveBeenCalled();
    });

    it("should auto-expand matching for zero-offer requests after 48h in getAtRiskRequests", async () => {
      // Update request creation time to 48h ago
      await Request.findByIdAndUpdate(testRequest._id, {
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      });

      // Create zero offers
      await Bid.create({
        request: testRequest._id,
        tutor: new Types.ObjectId(),
        amount: 2000,
        status: "withdrawn",
        createdAt: new Date(),
      });

      const atRiskItems = await AtRiskRequestService.getAtRiskRequests(100, io);

      expect(atRiskItems).toHaveLength(1);
      expect(MatchingService.dispatchProgressiveNotifications).toHaveBeenCalled();
    });

    it("should not auto-expand for requests with offers", async () => {
      // Create one offer
      await Bid.create({
        request: testRequest._id,
        tutor: new Types.ObjectId(),
        amount: 2000,
        status: "accepted",
        createdAt: new Date(),
      });

      const atRiskItems = await AtRiskRequestService.getAtRiskRequests(100, io);

      expect(atRiskItems).toHaveLength(0);
      expect(MatchingService.dispatchProgressiveNotifications).not.toHaveBeenCalled();
    });
  });
});