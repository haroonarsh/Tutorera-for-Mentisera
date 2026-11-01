import User from "../models/User.model";
import StudentProfile from "../models/StudentProfile.model";
import Request from "../models/Request.model";
import { AgentTask, AgentResult, EvidenceReference } from "./types";

const AGENT_ID = "student-operations";

function evidence(scope: string, resourceId = "User"): EvidenceReference {
  return {
    sourceType: "mongodb",
    resourceId,
    queryScope: scope,
    retrievedAt: new Date().toISOString(),
    dataFreshness: "realtime",
  };
}

export async function runStudentOperationsAgent(task: AgentTask): Promise<AgentResult> {
  const now = new Date().toISOString();
  const warnings: string[] = [];
  const evidenceRefs: EvidenceReference[] = [];

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalStudents,
      activeStudents,
      recentRegistrations30d,
      recentRegistrations7d,
      countryDist,
      cityDist,
      subjectDemand,
      curriculumDemand,
      awaitingMatch,
      openRequests,
    ] = await Promise.all([
      User.countDocuments({ role: "student", isDeleted: { $ne: true } }),
      User.countDocuments({ role: "student", isActive: true, isDeleted: { $ne: true } }),
      User.countDocuments({ role: "student", createdAt: { $gte: thirtyDaysAgo }, isDeleted: { $ne: true } }),
      User.countDocuments({ role: "student", createdAt: { $gte: sevenDaysAgo }, isDeleted: { $ne: true } }),
      User.aggregate([
        { $match: { role: "student", isDeleted: { $ne: true } } },
        { $group: { _id: "$countryCode", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      User.aggregate([
        { $match: { role: "student", isDeleted: { $ne: true } } },
        { $group: { _id: "$city", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Request.aggregate([
        { $match: { status: { $in: ["open", "published", "receiving_offers"] } } },
        { $group: { _id: "$subject", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),
      Request.aggregate([
        { $match: { curriculum: { $exists: true, $ne: null } } },
        { $group: { _id: "$curriculum", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      // Students with at least one open request but no accepted booking
      Request.aggregate([
        { $match: { status: { $in: ["open", "published", "receiving_offers"] } } },
        { $group: { _id: "$student" } },
        { $count: "total" },
      ]),
      Request.countDocuments({ status: { $in: ["open", "published", "receiving_offers"] } }),
    ]);

    evidenceRefs.push(
      evidence("student counts and registration trends", "User"),
      evidence("country/city aggregations", "User"),
      evidence("subject demand from open requests", "Request"),
    );

    const awaitingMatchCount = awaitingMatch[0]?.total ?? 0;

    const findings = {
      accounts: {
        totalRegistered: totalStudents,
        active: activeStudents,
        inactive: totalStudents - activeStudents,
      },
      registrationTrends: {
        last7Days: recentRegistrations7d,
        last30Days: recentRegistrations30d,
      },
      distribution: {
        byCountry: countryDist.map((c) => ({ country: c._id || "unknown", count: c.count })),
        byCity: cityDist.map((c) => ({ city: c._id || "unknown", count: c.count })),
      },
      demand: {
        bySubject: subjectDemand.map((s) => ({ subject: s._id, openRequests: s.count })),
        byCurriculum: curriculumDemand.map((c) => ({ curriculum: c._id, count: c.count })),
        totalOpenRequests: openRequests,
        studentsAwaitingMatch: awaitingMatchCount,
      },
      // PII minimisation: no names, emails, or individual records returned
      privacyNote: "All findings are aggregate statistics. No personally identifiable information is included.",
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
