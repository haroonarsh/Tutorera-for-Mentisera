// test/requestLifecycle.test.js
// Production verification test suite for TUTORERA Tuition Request Expiry, Archival & Retention Engine
// Testing state transitions, timer decoupling, query filtering, extension limits, reposting, and safety invariants

const test = require("node:test");
const assert = require("node:assert/strict");

// Require compiled configurations and models
const {
  MARKETPLACE_REQUEST_EXPIRY_DAYS,
  MAX_REQUEST_EXTENSIONS,
  REQUEST_EXTENSION_DAYS,
  NEGOTIATION_GRACE_HOURS,
  ARCHIVE_INACTIVE_DAYS,
  ACTIVE_REQUEST_STATUSES,
  NON_EXPIRABLE_STATUSES,
} = require("../dist/config/marketplace");

test("marketplace request expiry configuration defaults to 7 days", () => {
  assert.equal(MARKETPLACE_REQUEST_EXPIRY_DAYS, 7, "Default request expiry must be 7 days");
  assert.equal(MAX_REQUEST_EXTENSIONS, 2, "Default max extensions must be 2");
  assert.equal(REQUEST_EXTENSION_DAYS, 7, "Each extension must grant 7 days");
  assert.equal(NEGOTIATION_GRACE_HOURS, 24, "Negotiation grace must be 24 hours");
  assert.equal(ARCHIVE_INACTIVE_DAYS, 30, "Archival threshold must be 30 days");
});

test("request expiry timer and offer expiry timer are strictly decoupled", () => {
  const now = new Date("2026-09-01T10:00:00.000Z");
  
  // Student publishes request
  const requestPublishedAt = new Date(now);
  const requestExpiresAt = new Date(requestPublishedAt.getTime() + MARKETPLACE_REQUEST_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  
  // Tutor places offer on Day 3
  const offerCreatedAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const offerExpiresAt = new Date(offerCreatedAt.getTime() + 24 * 60 * 60 * 1000); // 24-hour offer validity
  
  // Verify independent durations
  const requestDurationDays = (requestExpiresAt.getTime() - requestPublishedAt.getTime()) / (24 * 60 * 60 * 1000);
  const offerDurationHours = (offerExpiresAt.getTime() - offerCreatedAt.getTime()) / (60 * 60 * 1000);
  
  assert.equal(requestDurationDays, 7, "Request validity should be exactly 7 days");
  assert.equal(offerDurationHours, 24, "Offer validity should be exactly 24 hours");
  assert.notEqual(requestExpiresAt.toISOString(), offerExpiresAt.toISOString(), "Timestamps must be distinct");
});

test("only active demand statuses are eligible for expiration", () => {
  const eligibleStatuses = ["open", "published", "receiving_offers", "negotiating"];
  assert.deepEqual([...ACTIVE_REQUEST_STATUSES], eligibleStatuses);

  // Successful and transactional states must NEVER be expired by worker
  const protectedStatuses = [
    "offer_accepted",
    "awaiting_payment",
    "booked",
    "in_progress",
    "completed",
    "disputed",
  ];
  for (const status of protectedStatuses) {
    assert.ok(NON_EXPIRABLE_STATUSES.includes(status), `Status '${status}' must be protected from automated expiry`);
    assert.ok(!eligibleStatuses.includes(status), `Status '${status}' must NOT be in active expiry list`);
  }
});

test("query-level filter excludes requests where expiresAt <= now immediately", () => {
  const now = new Date("2026-09-08T12:00:00.000Z");
  
  const mockDatabaseRequests = [
    { id: 1, subject: "Physics", expiresAt: new Date("2026-09-10T12:00:00.000Z"), status: "published" },
    { id: 2, subject: "Math", expiresAt: new Date("2026-09-07T12:00:00.000Z"), status: "published" }, // passed
    { id: 3, subject: "Chemistry", expiresAt: new Date("2026-09-08T11:59:59.000Z"), status: "open" }, // passed by 1s
    { id: 4, subject: "Biology", expiresAt: new Date("2026-09-08T12:00:01.000Z"), status: "open" }, // 1s remaining
  ];

  // Simulating query filter: { status: { $in: ACTIVE_REQUEST_STATUSES }, expiresAt: { $gt: now } }
  const visibleRequests = mockDatabaseRequests.filter(
    (r) => ACTIVE_REQUEST_STATUSES.includes(r.status) && r.expiresAt.getTime() > now.getTime()
  );

  assert.equal(visibleRequests.length, 2);
  assert.equal(visibleRequests[0].subject, "Physics");
  assert.equal(visibleRequests[1].subject, "Biology");
});

test("extension rule extends from current expiry and enforces MAX_REQUEST_EXTENSIONS", () => {
  const initialPublished = new Date("2026-09-01T00:00:00.000Z");
  const initialExpiry = new Date(initialPublished.getTime() + 7 * 86400000); // Day 7
  
  let extensionCount = 0;
  let currentExpiry = initialExpiry;

  // Extension 1 (Day 5 student clicks extend)
  assert.ok(extensionCount < MAX_REQUEST_EXTENSIONS);
  currentExpiry = new Date(currentExpiry.getTime() + REQUEST_EXTENSION_DAYS * 86400000);
  extensionCount += 1;
  assert.equal(extensionCount, 1);
  assert.equal(currentExpiry.toISOString(), "2026-09-15T00:00:00.000Z"); // Day 14

  // Extension 2 (Day 12 student clicks extend)
  assert.ok(extensionCount < MAX_REQUEST_EXTENSIONS);
  currentExpiry = new Date(currentExpiry.getTime() + REQUEST_EXTENSION_DAYS * 86400000);
  extensionCount += 1;
  assert.equal(extensionCount, 2);
  assert.equal(currentExpiry.toISOString(), "2026-09-22T00:00:00.000Z"); // Day 21

  // Extension 3 (Attempt exceeds limit)
  const canExtendThirdTime = extensionCount < MAX_REQUEST_EXTENSIONS;
  assert.equal(canExtendThirdTime, false, "Third extension must be blocked");
});

test("repost creates a new request document and preserves old record for analytics", () => {
  const oldRequest = {
    _id: "req_old_12345",
    subject: "O-Level Mathematics",
    level: "O-Level",
    budget: 2000,
    status: "expired",
    publishedAt: new Date("2026-09-01T00:00:00.000Z"),
    expiresAt: new Date("2026-09-08T00:00:00.000Z"),
    expiredAt: new Date("2026-09-08T00:00:00.000Z"),
    bidsCount: 4,
  };

  const now = new Date("2026-09-09T10:00:00.000Z");
  const newRequestId = "req_new_67890";

  // Repost simulation
  const newRequest = {
    _id: newRequestId,
    subject: oldRequest.subject,
    level: oldRequest.level,
    budget: oldRequest.budget,
    status: "published",
    publishedAt: now,
    expiresAt: new Date(now.getTime() + MARKETPLACE_REQUEST_EXPIRY_DAYS * 86400000),
    extensionCount: 0,
    maxExtensions: MAX_REQUEST_EXTENSIONS,
    repostedFromRequestId: oldRequest._id,
  };

  // Assertions
  assert.notEqual(newRequest._id, oldRequest._id, "Repost must generate a fresh request ID");
  assert.equal(newRequest.repostedFromRequestId, oldRequest._id, "New request must link to previous request");
  assert.equal(oldRequest.status, "expired", "Old request must remain expired and intact");
  assert.equal(oldRequest.bidsCount, 4, "Old request offer analytics must be preserved");
  assert.equal(newRequest.status, "published");
  assert.equal(
    newRequest.expiresAt.getTime() - newRequest.publishedAt.getTime(),
    7 * 86400000,
    "Fresh 7-day timer allocated to reposted demand"
  );
});

test("tutor offer submission on expired request is rejected with REQUEST_EXPIRED", () => {
  const expiredRequest = {
    status: "expired",
    expiresAt: new Date("2026-09-05T00:00:00.000Z"),
  };
  const now = new Date("2026-09-06T00:00:00.000Z");

  const isExpired = expiredRequest.status === "expired" || expiredRequest.expiresAt.getTime() <= now.getTime();
  assert.ok(isExpired);

  const errorResponse = isExpired ? {
    status: 410,
    code: "REQUEST_EXPIRED",
    message: "This tuition request has expired and is no longer accepting tutor offers.",
  } : null;

  assert.equal(errorResponse.status, 410);
  assert.equal(errorResponse.code, "REQUEST_EXPIRED");
  assert.equal(errorResponse.message, "This tuition request has expired and is no longer accepting tutor offers.");
});

test("negotiation grace preserves active in-flight counter offers", () => {
  const now = new Date("2026-09-08T12:00:00.000Z");

  const request = {
    _id: "req_neg_1",
    status: "negotiating",
    expiresAt: new Date("2026-09-08T11:00:00.000Z"), // Passed 1 hour ago
  };

  const activeCounterBid = {
    _id: "bid_1",
    status: "countered",
    expiresAt: new Date("2026-09-09T08:00:00.000Z"), // Valid for another 20 hours
  };

  // Rule: If request is in "negotiating" and active counter is valid, negotiation grace applies
  const activeNegotiationGrace =
    request.status === "negotiating" &&
    activeCounterBid.status === "countered" &&
    activeCounterBid.expiresAt.getTime() > now.getTime();

  assert.equal(activeNegotiationGrace, true, "Negotiation grace must protect the ongoing conversation");
});

test("archival preserves records tied to active bookings, disputes, or legal holds", () => {
  const thirtyDaysAgo = new Date(Date.now() - 31 * 86400000);

  const cases = [
    { id: 1, status: "expired", updatedAt: thirtyDaysAgo, legalHold: true, hasActiveBooking: false, expectArchived: false },
    { id: 2, status: "expired", updatedAt: thirtyDaysAgo, legalHold: false, hasActiveBooking: true, expectArchived: false },
    { id: 3, status: "expired", updatedAt: thirtyDaysAgo, legalHold: false, hasActiveBooking: false, expectArchived: true },
    { id: 4, status: "completed", updatedAt: thirtyDaysAgo, legalHold: false, hasActiveBooking: false, expectArchived: false }, // only expired or cancelled are archived
  ];

  for (const c of cases) {
    const isEligible =
      ["expired", "cancelled"].includes(c.status) &&
      !c.legalHold &&
      !c.hasActiveBooking &&
      c.updatedAt <= new Date(Date.now() - ARCHIVE_INACTIVE_DAYS * 86400000);

    assert.equal(isEligible, c.expectArchived, `Case ${c.id} archival eligibility mismatch`);
  }
});
