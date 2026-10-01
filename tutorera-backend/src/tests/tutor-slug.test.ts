// src/tests/tutor-slug.test.ts
//
// Covers the SEO-friendly tutor profile slug migration: the new slug must
// never contain the Mongo ObjectId, must be globally unique (with
// collision suffixes), and must regenerate only when the inputs that feed
// it actually change.

import User from "../models/User.model";
import TutorProfile from "../models/TutorProfile.model";
import { buildTutorSlugBase, assignUniqueTutorSlug, buildTutorProfileUrl, slugify } from "../services/tutorSlug.service";

async function makeTutor(overrides: Partial<Record<string, unknown>> = {}) {
  const user = await User.create({
    name: (overrides.fullName as string) || "Samah Gamal",
    email: `slug-${Date.now()}-${Math.random()}@test.com`,
    password: "password123",
    role: "tutor",
  });
  const profile = await TutorProfile.create({
    user: user._id,
    fullName: "Samah Gamal",
    countryCode: "EG",
    countryName: "Egypt",
    subjects: ["Mathematics"],
    ...overrides,
  });
  return { user, profile };
}

describe("tutorSlug.service", () => {
  it("builds a slug with no ObjectId in it", async () => {
    const { profile } = await makeTutor();
    await assignUniqueTutorSlug(profile);
    expect(profile.slug).toBeTruthy();
    expect(profile.slug).not.toMatch(/[a-f0-9]{24}/i);
    expect(profile.slug).toContain("samah-gamal");
    expect(profile.slug).toContain("mathematics");
    expect(profile.slug).toContain("tutor");
  });

  it("builds the expected name-subject-tutor-nationality shape", () => {
    const base = buildTutorSlugBase({ fullName: "Samah Gamal", subject: "Mathematics", countryCode: "EG", countryName: "Egypt" });
    expect(base).toBe(slugify("Samah Gamal Mathematics tutor Egyptian"));
  });

  it("appends a numeric suffix on collision", async () => {
    const { profile: first } = await makeTutor();
    await assignUniqueTutorSlug(first);
    await first.save();

    const { profile: second } = await makeTutor();
    await assignUniqueTutorSlug(second);
    await second.save();

    expect(second.slug).not.toBe(first.slug);
    expect(second.slug).toBe(`${first.slug}-2`);
  });

  it("does not regenerate the slug when unrelated fields change", async () => {
    const { profile } = await makeTutor();
    await assignUniqueTutorSlug(profile);
    const originalSlug = profile.slug;

    profile.bio = "Updated bio text";
    await assignUniqueTutorSlug(profile);
    expect(profile.slug).toBe(originalSlug);
  });

  it("regenerates the slug when the name changes", async () => {
    const { profile } = await makeTutor();
    await assignUniqueTutorSlug(profile);
    const originalSlug = profile.slug;

    profile.fullName = "A Different Name";
    await assignUniqueTutorSlug(profile);
    expect(profile.slug).not.toBe(originalSlug);
    expect(profile.slug).toContain("a-different-name");
  });

  it("buildTutorProfileUrl produces /tutors/{country}/{slug}", async () => {
    const { profile } = await makeTutor();
    await assignUniqueTutorSlug(profile);
    const url = buildTutorProfileUrl(profile);
    expect(url).toBe(`/tutors/egypt/${profile.slug}`);
  });
});
