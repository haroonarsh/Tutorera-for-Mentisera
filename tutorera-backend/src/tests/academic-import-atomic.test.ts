// src/tests/academic-import-atomic.test.ts
//
// Academic Framework audit, P1 (CSV import atomicity):
//
//   > CSV commits save records individually without a transaction. A
//   > later failure can leave a partially imported catalogue.
//
// commit() is now wrapped in mongoose.startSession().withTransaction()
// so a mid-import failure aborts the entire batch. commitAcademicImport
// also records a status: "failed" AcademicImportJob row with the
// error message when the transaction aborts.
//
// Fault injection: Jest spy on SubjectCategory.prototype.save makes the
// SECOND row's save throw; the first row must then NOT be visible in
// the collection after the response returns, and a failed-job row
// must exist.

import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app";
import User from "../models/User.model";
import SubjectCategory from "../models/SubjectCategory.model";
import AcademicImportJob from "../models/AcademicImportJob.model";

function tokenFor(userId: string): string {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: "1h" });
}

async function makeSuperAdmin(suffix: string) {
  const user = await User.create({
    name: `SuperAdmin ${suffix}`,
    email: `admin-${suffix}@academic-import.test`,
    password: "password123",
    role: "admin",
    adminRole: "super_admin",
    isActive: true,
  });
  return { user, token: tokenFor(user.id) };
}

describe("academic CSV import atomicity (audit P1)", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("rolls back EVERY row when any row's save throws, and records a failed-job entry", async () => {
    const admin = await makeSuperAdmin("rollback");

    // Two-row categories CSV. Row 1 is a NEW category (triggers Model.create
    // inside the transaction). Row 2 is also NEW. Fault injection makes the
    // second create throw by patching the create() method after the first
    // call succeeds.
    const csv =
      "category_code,category_name,description,status,display_order\n" +
      "CAT-ONE,Row One,First row that would land first,active,10\n" +
      "CAT-TWO,Row Two,Second row that will fail the import,active,20\n";

    // Patch SubjectCategory.create to throw on the second invocation only.
    let callCount = 0;
    const originalCreate = SubjectCategory.create.bind(SubjectCategory);
    jest.spyOn(SubjectCategory, "create").mockImplementation(async (...args: unknown[]) => {
      callCount += 1;
      if (callCount === 2) {
        throw new Error("Injected failure on row 2 to test rollback");
      }
      // Delegate the first call to the real implementation so row 1 gets
      // written inside the transaction (then rolled back by the throw).
      // Mongoose SubjectCategory.create accepts an array when a session is
      // passed; the real signature matches.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (originalCreate as any)(...args);
    });

    const res = await request(app)
      .post(`/api/v1/admin/academic-framework/import-export/commit/categories`)
      .set("Authorization", `Bearer ${admin.token}`)
      .attach("file", Buffer.from(csv), "categories.csv");

    expect(res.status).toBe(500);

    // Row 1 must NOT exist after rollback. If the transaction wasn't
    // atomic, this document would be present with code=CAT-ONE.
    const rowOne = await SubjectCategory.findOne({ code: "CAT-ONE" });
    expect(rowOne).toBeNull();
    const rowTwo = await SubjectCategory.findOne({ code: "CAT-TWO" });
    expect(rowTwo).toBeNull();

    // A failed-job AcademicImportJob row must exist for operator audit.
    const failedJobs = await AcademicImportJob.find({ dataset: "categories", status: "failed" });
    expect(failedJobs.length).toBe(1);
    expect(failedJobs[0].validationErrors[0]?.message).toContain("Transaction aborted");
    expect(failedJobs[0].validationErrors[0]?.message).toContain("Injected failure on row 2");
  });

  it("positive control: a clean two-row import commits both rows and records a committed job", async () => {
    const admin = await makeSuperAdmin("happy");

    const csv =
      "category_code,category_name,description,status,display_order\n" +
      "CAT-HAPPY-A,Happy A,First happy row,active,10\n" +
      "CAT-HAPPY-B,Happy B,Second happy row,active,20\n";

    const res = await request(app)
      .post(`/api/v1/admin/academic-framework/import-export/commit/categories`)
      .set("Authorization", `Bearer ${admin.token}`)
      .attach("file", Buffer.from(csv), "categories.csv");

    expect(res.status).toBe(200);
    expect(res.body.created).toBe(2);

    expect(await SubjectCategory.findOne({ code: "CAT-HAPPY-A" })).not.toBeNull();
    expect(await SubjectCategory.findOne({ code: "CAT-HAPPY-B" })).not.toBeNull();

    const committedJobs = await AcademicImportJob.find({ dataset: "categories", status: "committed" });
    expect(committedJobs.length).toBe(1);
    expect(committedJobs[0].createdCount).toBe(2);
  });
});
