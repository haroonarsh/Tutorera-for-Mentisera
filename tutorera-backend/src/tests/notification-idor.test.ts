// src/tests/notification-idor.test.ts
//
// Audit §15 follow-on: notification IDOR. A notification body routinely
// contains PII (names, booking summaries, chat previews, payment
// subjects), so an authorization bypass on the read or markAsRead
// endpoints is a direct privacy exposure, not just data integrity.
//
// notification.controller.ts filters every query by
// { user: req.user._id }. The markAsRead handler returns 200 whether
// or not the notification was actually owned (so a stranger request
// is a silent no-op rather than a 403); that is the correct behaviour
// from a security standpoint — leaking existence would be worse — but
// the test must assert on the DATABASE state, not just the HTTP
// response, to catch a real regression.

import request from "supertest";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import app from "../app";
import User from "../models/User.model";
import Notification from "../models/Notification.model";

function tokenFor(userId: string): string {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: "1h" });
}

async function makeUser(suffix: string) {
  const user = await User.create({
    name: `Student ${suffix}`,
    email: `student-${suffix}@notification-idor.test`,
    password: "password123",
    role: "student",
    isActive: true,
  });
  return { user, token: tokenFor(user.id) };
}

async function makeNotification(userId: Types.ObjectId, title: string) {
  return Notification.create({
    user: userId,
    title,
    message: `Private body for ${title}`,
    type: "bid",
    isRead: false,
  });
}

describe("notification IDOR boundaries", () => {
  it("GET /notifications only returns the caller's own notifications — never another user's", async () => {
    const owner = await makeUser("owner-list");
    const stranger = await makeUser("stranger-list");
    await makeNotification(owner.user._id as Types.ObjectId, "Owner notification 1");
    await makeNotification(owner.user._id as Types.ObjectId, "Owner notification 2");
    await makeNotification(stranger.user._id as Types.ObjectId, "Stranger PRIVATE");

    const res = await request(app)
      .get(`/api/v1/notifications`)
      .set("Authorization", `Bearer ${owner.token}`);

    expect(res.status).toBe(200);

    const notifications: { title: string; user: string }[] = res.body.notifications || [];
    expect(notifications).toHaveLength(2);
    // Must not contain any notification from the stranger — not even by
    // title substring (would mean the body leaked through).
    const bodyBlob = JSON.stringify(res.body);
    expect(bodyBlob).not.toContain("Stranger PRIVATE");
    for (const n of notifications) {
      expect(n.user).toBe((owner.user._id as Types.ObjectId).toString());
    }
    expect(res.body.unreadCount).toBe(2);
  });

  it("markAsRead by a stranger silently no-ops — the target notification stays UNREAD in the database", async () => {
    const owner = await makeUser("owner-mark");
    const stranger = await makeUser("stranger-mark");
    const target = await makeNotification(owner.user._id as Types.ObjectId, "Owner-only");

    const res = await request(app)
      .patch(`/api/v1/notifications/${target.id}/read`)
      .set("Authorization", `Bearer ${stranger.token}`);

    // Handler always returns 200 to avoid leaking existence; the real
    // assertion is on the database.
    expect(res.status).toBe(200);

    const after = await Notification.findById(target._id);
    expect(after?.isRead).toBe(false);
  });

  it("the real owner can mark their own notification as read (positive control)", async () => {
    const owner = await makeUser("owner-ok-mark");
    const target = await makeNotification(owner.user._id as Types.ObjectId, "Mine to read");

    const res = await request(app)
      .patch(`/api/v1/notifications/${target.id}/read`)
      .set("Authorization", `Bearer ${owner.token}`);

    expect(res.status).toBe(200);

    const after = await Notification.findById(target._id);
    expect(after?.isRead).toBe(true);
  });

  it("markAllAsRead only affects the caller — a stranger's unread rows stay unread", async () => {
    const owner = await makeUser("owner-mark-all");
    const stranger = await makeUser("stranger-mark-all");
    await makeNotification(owner.user._id as Types.ObjectId, "Owner A");
    await makeNotification(owner.user._id as Types.ObjectId, "Owner B");
    const strangerNotif = await makeNotification(stranger.user._id as Types.ObjectId, "Stranger C");

    const res = await request(app)
      .patch(`/api/v1/notifications/read-all`)
      .set("Authorization", `Bearer ${owner.token}`);

    expect(res.status).toBe(200);

    // Owner's rows now read, stranger's untouched.
    const ownerUnread = await Notification.countDocuments({ user: owner.user._id, isRead: false });
    expect(ownerUnread).toBe(0);

    const strangerRow = await Notification.findById(strangerNotif._id);
    expect(strangerRow?.isRead).toBe(false);
  });
});
