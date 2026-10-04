// src/tests/tutor-profile-education-preservation.test.ts
//
// Academic Framework audit, P0-2:
//
//   > Profile validation strips education fields beyond degree,
//   > institution, and year — including discipline and document metadata.
//
// Before the fix, the tutorProfileSchema Zod validator declared
// education entries as { degree, institution, year } only; the
// validator's safeParse would drop every additional field (discipline,
// disciplineRef, degreeDoc, degreeDocPublicId) before the handler saw
// the body. A tutor saving any unrelated profile field (bio, rate,
// city, …) silently had their qualification metadata wiped from every
// education row they echoed back from the client, breaking downstream
// subject-eligibility checks that look up DisciplineSubjectMap by
// discipline / disciplineRef.
//
// This test posts a profile update whose education[] contains the
// extra fields and asserts they survive the round-trip through the
// validator into the saved TutorProfile.education row.

import request from "supertest";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import app from "../app";
import User from "../models/User.model";
import TutorProfile from "../models/TutorProfile.model";

function tokenFor(userId: string): string {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: "1h" });
}

async function makeTutor(suffix: string) {
  const user = await User.create({
    name: `Tutor ${suffix}`,
    email: `tutor-${suffix}@edu-preserve.test`,
    password: "password123",
    role: "tutor",
    isActive: true,
  });
  return { user, token: tokenFor(user.id) };
}

describe("tutorProfileSchema preserves education qualification metadata (audit P0-2)", () => {
  it("discipline + disciplineRef + degreeDoc + degreeDocPublicId survive a profile update", async () => {
    const tutor = await makeTutor("preserve-full");
    const discipline = new Types.ObjectId().toString();

    const res = await request(app)
      .post(`/api/v1/tutors/profile`)
      .set("Authorization", `Bearer ${tutor.token}`)
      .send({
        bio: "An honest biography describing the tutor's teaching background.",
        education: [
          {
            degree: "BS Computer Science",
            institution: "FAST-NUCES",
            year: 2020,
            discipline: "Computer Science",
            disciplineRef: discipline,
            degreeDoc: "https://cloudinary.test/degree.jpg",
            degreeDocPublicId: "tutorera/degrees/abc123",
          },
        ],
      });

    // Handler returns 201 on first create, 200 on update.
    expect([200, 201]).toContain(res.status);

    const after = await TutorProfile.findOne({ user: tutor.user._id });
    expect(after?.education).toHaveLength(1);
    const edu = after!.education[0];
    expect(edu.degree).toBe("BS Computer Science");
    expect(edu.institution).toBe("FAST-NUCES");
    expect(edu.year).toBe(2020);
    // These four were the fields the validator used to strip.
    expect(edu.discipline).toBe("Computer Science");
    expect(edu.disciplineRef?.toString()).toBe(discipline);
    expect(edu.degreeDoc).toBe("https://cloudinary.test/degree.jpg");
    expect(edu.degreeDocPublicId).toBe("tutorera/degrees/abc123");
  });

  it("a later unrelated profile update (just bio) does NOT wipe the previously saved discipline fields", async () => {
    // This is the real regression the audit flagged: a tutor who
    // previously registered their discipline edits their bio and —
    // because the frontend typically re-sends education[] alongside —
    // loses their discipline linkage. We reproduce that: seed a
    // profile with the full education row, then PATCH only a bio that
    // also echoes education[] back, and assert nothing was lost.
    const tutor = await makeTutor("preserve-after-bio");
    const discipline = new Types.ObjectId().toString();

    const firstSave = await request(app)
      .post(`/api/v1/tutors/profile`)
      .set("Authorization", `Bearer ${tutor.token}`)
      .send({
        bio: "Initial bio — this must be at least twenty characters.",
        education: [
          {
            degree: "BS Mathematics",
            institution: "LUMS",
            year: 2019,
            discipline: "Mathematics",
            disciplineRef: discipline,
            degreeDoc: "https://cloudinary.test/math-degree.jpg",
            degreeDocPublicId: "tutorera/degrees/math-doc-id",
          },
        ],
      });
    expect([200, 201]).toContain(firstSave.status);

    const bioOnlyUpdate = await request(app)
      .post(`/api/v1/tutors/profile`)
      .set("Authorization", `Bearer ${tutor.token}`)
      .send({
        bio: "Updated bio text that is still long enough for the validator.",
        education: [
          {
            degree: "BS Mathematics",
            institution: "LUMS",
            year: 2019,
            discipline: "Mathematics",
            disciplineRef: discipline,
            degreeDoc: "https://cloudinary.test/math-degree.jpg",
            degreeDocPublicId: "tutorera/degrees/math-doc-id",
          },
        ],
      });
    expect(bioOnlyUpdate.status).toBe(200);

    const after = await TutorProfile.findOne({ user: tutor.user._id });
    const edu = after!.education[0];
    expect(edu.discipline).toBe("Mathematics");
    expect(edu.disciplineRef?.toString()).toBe(discipline);
    expect(edu.degreeDoc).toBe("https://cloudinary.test/math-degree.jpg");
    expect(edu.degreeDocPublicId).toBe("tutorera/degrees/math-doc-id");
  });
});
