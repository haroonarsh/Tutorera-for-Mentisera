import Subject from "../models/Subject.model";
import SchoolOffering from "../models/SchoolOffering.model";
import { SCHOOL_OFFERINGS } from "../config/schoolOfferings";
import { seedSchoolOfferings } from "../services/schoolOfferingSeed.service";

async function seedExistingSubjects() {
  const names = [...new Set(SCHOOL_OFFERINGS.map((item) => item.subject))].filter((name) => !["Further Mathematics", "Ethics"].includes(name));
  await Subject.insertMany(names.map((name, index) => ({ name, code: `FIXTURE-${index}`, slug: `fixture-${index}`, category: "Fixture", status: "active" })));
}

describe("school offering migration", () => {
  it("has distinct board, qualification, class and subject records with reviewed Pearson sources", () => {
    expect(SCHOOL_OFFERINGS).toHaveLength(234);
    expect(new Set(SCHOOL_OFFERINGS.map((row) => row.id)).size).toBe(234);
    expect(SCHOOL_OFFERINGS.filter((row) => row.boardCode === "pearson").every((row) => row.verificationSource?.startsWith("https://qualifications.pearson.com/"))).toBe(true);
    expect(SCHOOL_OFFERINGS.filter((row) => row.boardCode === "pearson" && row.qualificationCode.startsWith("ial") && row.subject === "Computer Science")).toHaveLength(2);
  });

  it("dry runs without writing and repeated apply preserves administrator changes", async () => {
    await seedExistingSubjects();
    const plan = await seedSchoolOfferings();
    expect(plan).toMatchObject({ total: 234, newOfferings: 234, applied: false, errors: [] });
    expect(plan.newSubjects.sort()).toEqual(["Ethics", "Further Mathematics"]);
    expect(await SchoolOffering.countDocuments()).toBe(0);
    expect((await seedSchoolOfferings(true)).applied).toBe(true);
    const selected = SCHOOL_OFFERINGS[0].id;
    await SchoolOffering.updateOne({ _id: selected }, { $set: { status: "inactive", reviewReason: "Admin review" } });
    expect((await seedSchoolOfferings(true)).newOfferings).toBe(0);
    expect(await SchoolOffering.countDocuments()).toBe(234);
    expect((await SchoolOffering.findById(selected))?.status).toBe("inactive");
    expect(await Subject.countDocuments({ name: "Ethics" })).toBe(1);
  });

  it("fails closed on ambiguous aliases instead of creating duplicates", async () => {
    await seedExistingSubjects();
    await Subject.create({ name: "MATHS", slug: "maths-fixture", code: "FIXTURE-ALIAS", category: "Fixture", status: "active" });
    const result = await seedSchoolOfferings(true);
    expect(result.applied).toBe(false);
    expect(result.errors).toContain("Ambiguous subject: Mathematics");
    expect(await SchoolOffering.countDocuments()).toBe(0);
  });
});
