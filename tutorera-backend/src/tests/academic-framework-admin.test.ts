// src/tests/academic-framework-admin.test.ts
//
// Academic Framework audit, P1 (admin list / validation / immutable code):
//
//   > Admin lists stop at 100 records without real pagination. Stable
//   > codes remain editable through the API, and invalid statuses
//   > default to active.
//
// This file verifies the three fixes against the admin category
// endpoints — the pattern mirrors across disciplines / subjects /
// eligibility rules in the controller so the same guarantees hold on
// each; this suite just locks the shape in one place.

import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app";
import User from "../models/User.model";
import SubjectCategory from "../models/SubjectCategory.model";

function tokenFor(userId: string): string {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: "1h" });
}

async function makeSuperAdmin(suffix: string) {
  const user = await User.create({
    name: `SuperAdmin ${suffix}`,
    email: `admin-${suffix}@academic-admin.test`,
    password: "password123",
    role: "admin",
    adminRole: "super_admin",
    isActive: true,
  });
  return { user, token: tokenFor(user.id) };
}

describe("academic framework admin surface — audit P1 fixes", () => {
  it("list endpoint supports page + limit and returns real pagination metadata", async () => {
    const admin = await makeSuperAdmin("paginate");

    // Seed 25 categories so a 10/page listing paginates to 3 pages.
    const seeded = Array.from({ length: 25 }, (_, i) => ({
      code: `CAT-P${String(i).padStart(2, "0")}`,
      name: `Cat ${i}`,
      slug: `cat-${i}`,
      displayOrder: i,
      status: "active",
    }));
    await SubjectCategory.insertMany(seeded);

    const page1 = await request(app)
      .get(`/api/v1/admin/academic-framework/categories?limit=10&page=1`)
      .set("Authorization", `Bearer ${admin.token}`);
    expect(page1.status).toBe(200);
    expect(page1.body.categories).toHaveLength(10);
    expect(page1.body.pagination).toEqual({ total: 25, page: 1, limit: 10, pages: 3 });

    const page3 = await request(app)
      .get(`/api/v1/admin/academic-framework/categories?limit=10&page=3`)
      .set("Authorization", `Bearer ${admin.token}`);
    expect(page3.status).toBe(200);
    expect(page3.body.categories).toHaveLength(5);
    expect(page3.body.pagination).toEqual({ total: 25, page: 3, limit: 10, pages: 3 });
  });

  it("rejects an invalid status on create (no longer silently defaults to active)", async () => {
    const admin = await makeSuperAdmin("invalid-status");

    const res = await request(app)
      .post(`/api/v1/admin/academic-framework/categories`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ code: "CAT-BAD-STATUS", name: "Bad status", status: "achrived" });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_STATUS");
    expect(await SubjectCategory.findOne({ code: "CAT-BAD-STATUS" })).toBeNull();
  });

  it("rejects an invalid status on update instead of silently resetting the row to active", async () => {
    const admin = await makeSuperAdmin("invalid-status-update");
    const seeded = await SubjectCategory.create({
      code: "CAT-UPDATE-STATUS",
      name: "Updateable",
      slug: "updateable",
      status: "archived",
    });

    const res = await request(app)
      .patch(`/api/v1/admin/academic-framework/categories/${seeded.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ status: "achrived" });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_STATUS");

    const after = await SubjectCategory.findById(seeded._id);
    expect(after?.status).toBe("archived");
  });

  it("rejects any attempt to change code on update (stable identifier is immutable)", async () => {
    const admin = await makeSuperAdmin("code-immutable");
    const seeded = await SubjectCategory.create({
      code: "CAT-STABLE",
      name: "Stable",
      slug: "stable",
      status: "active",
    });

    const res = await request(app)
      .patch(`/api/v1/admin/academic-framework/categories/${seeded.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ code: "CAT-CHANGED", name: "Still editable name" });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("CODE_IMMUTABLE");

    const after = await SubjectCategory.findById(seeded._id);
    // Both the code AND the name must survive — the handler should
    // reject before touching anything on the row.
    expect(after?.code).toBe("CAT-STABLE");
    expect(after?.name).toBe("Stable");
  });

  it("code update that is a no-op (same value re-sent by UI) succeeds — name update applies", async () => {
    const admin = await makeSuperAdmin("code-noop");
    const seeded = await SubjectCategory.create({
      code: "CAT-NOOP",
      name: "Original name",
      slug: "original-name",
      status: "active",
    });

    const res = await request(app)
      .patch(`/api/v1/admin/academic-framework/categories/${seeded.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ code: "CAT-NOOP", name: "New name" });

    expect(res.status).toBe(200);

    const after = await SubjectCategory.findById(seeded._id);
    expect(after?.code).toBe("CAT-NOOP");
    expect(after?.name).toBe("New name");
  });
});
