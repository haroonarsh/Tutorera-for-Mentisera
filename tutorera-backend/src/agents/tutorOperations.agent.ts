import { Types } from "mongoose";
import TutorProfile from "../models/TutorProfile.model";
import User from "../models/User.model";
import { AgentTask, AgentResult, EvidenceReference } from "./types";

const AGENT_ID = "tutor-operations";

function evidence(scope: string, resourceId = "TutorProfile"): EvidenceReference {
  return {
    sourceType: "mongodb",
    resourceId,
    queryScope: scope,
    retrievedAt: new Date().toISOString(),
    dataFreshness: "realtime",
  };
}

export async function runTutorOperationsAgent(task: AgentTask): Promise<AgentResult> {
  const now = new Date().toISOString();
  const warnings: string[] = [];
  const evidenceRefs: EvidenceReference[] = [];

  try {
    const [
      totalTutorUsers,
      activeTutorUsers,
      pendingVerification,
      approvedTutors,
      rejectedTutors,
      onboardingComplete,
      onboardingIncomplete,
      countryDist,
      cityDist,
      subjectDist,
      curriculaDist,
      onboardingStepDist,
      missingCnic,
      missingDegree,
      missingVideo,
      levelDist,
    ] = await Promise.all([
      User.countDocuments({ role: "tutor", isDeleted: { $ne: true } }),
      User.countDocuments({ role: "tutor", isActive: true, isDeleted: { $ne: true } }),
      TutorProfile.countDocuments({ verificationStatus: "pending" }),
      TutorProfile.countDocuments({ verificationStatus: "approved" }),
      TutorProfile.countDocuments({ verificationStatus: "rejected" }),
      TutorProfile.countDocuments({ onboardingComplete: true }),
      TutorProfile.countDocuments({ onboardingComplete: false }),
      TutorProfile.aggregate([
        { $group: { _id: "$countryCode", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      TutorProfile.aggregate([
        { $group: { _id: "$city", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      TutorProfile.aggregate([
        { $unwind: "$subjects" },
        { $group: { _id: "$subjects", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),
      TutorProfile.aggregate([
        { $unwind: { path: "$curricula", preserveNullAndEmptyArrays: false } },
        { $group: { _id: "$curricula", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      TutorProfile.aggregate([
        { $group: { _id: "$onboardingStep", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      TutorProfile.countDocuments({ cnicVerificationStatus: "not_submitted" }),
      TutorProfile.countDocuments({ degreeVerificationStatus: "not_submitted" }),
      TutorProfile.countDocuments({ demoVideoStatus: "not_submitted" }),
      TutorProfile.aggregate([
        { $unwind: "$levels" },
        { $group: { _id: "$levels", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    evidenceRefs.push(
      evidence("tutor user counts", "User"),
      evidence("verification status distribution", "TutorProfile"),
      evidence("country/city/subject aggregations", "TutorProfile"),
    );

    const findings = {
      accounts: {
        totalRegistered: totalTutorUsers,
        active: activeTutorUsers,
        inactive: totalTutorUsers - activeTutorUsers,
      },
      verification: {
        pending: pendingVerification,
        approved: approvedTutors,
        rejected: rejectedTutors,
      },
      onboarding: {
        complete: onboardingComplete,
        incomplete: onboardingIncomplete,
        byStep: onboardingStepDist.map((s) => ({ step: s._id, count: s.count })),
      },
      missingDocuments: {
        cnic: missingCnic,
        degree: missingDegree,
        demoVideo: missingVideo,
      },
      distribution: {
        byCountry: countryDist.map((c) => ({ country: c._id || "unknown", count: c.count })),
        byCity: cityDist.map((c) => ({ city: c._id || "unknown", count: c.count })),
      },
      coverage: {
        subjects: subjectDist.map((s) => ({ subject: s._id, count: s.count })),
        curricula: curriculaDist.map((c) => ({ curriculum: c._id, count: c.count })),
        levels: levelDist.map((l) => ({ level: l._id, count: l.count })),
      },
    };

    return {
      taskId: task.taskId,
      agentId: AGENT_ID,
      status: "success",
      findings,
      evidence: evidenceRefs,
      confidence: "high",
      generatedAt: now,
      warnings,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      taskId: task.taskId,
      agentId: AGENT_ID,
      status: "failed",
      findings: null,
      evidence: [],
      confidence: "low",
      generatedAt: now,
      warnings: [`Agent execution failed: ${message}`],
    };
  }
}
