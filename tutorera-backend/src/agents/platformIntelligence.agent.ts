import User from "../models/User.model";
import TutorProfile from "../models/TutorProfile.model";
import AuditLog from "../models/AuditLog.model";
import Booking from "../models/Booking.model";
import Request from "../models/Request.model";
import { AgentTask, AgentResult, EvidenceReference } from "./types";

const AGENT_ID = "platform-intelligence";

function evidence(scope: string, resourceId: string): EvidenceReference {
  return {
    sourceType: "mongodb",
    resourceId,
    queryScope: scope,
    retrievedAt: new Date().toISOString(),
    dataFreshness: "realtime",
  };
}

export async function runPlatformIntelligenceAgent(task: AgentTask): Promise<AgentResult> {
  const now = new Date().toISOString();
  const warnings: string[] = [];
  const evidenceRefs: EvidenceReference[] = [];

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalTutors,
      totalStudents,
      totalAdmins,
      pendingVerification,
      approvedTutors,
      rejectedTutors,
      activeUsers,
      inactiveUsers,
      recentAuditLogs,
      auditLogTotal,
      deletedUsers,
      usersWithNoCountry,
      tutorsWithNoSubjects,
      recentBookings30d,
      recentRequests30d,
      multipleRoleUsers,
    ] = await Promise.all([
      User.countDocuments({ isDeleted: { $ne: true } }),
      User.countDocuments({ role: "tutor", isDeleted: { $ne: true } }),
      User.countDocuments({ role: "student", isDeleted: { $ne: true } }),
      User.countDocuments({ role: "admin", isDeleted: { $ne: true } }),
      TutorProfile.countDocuments({ verificationStatus: "pending" }),
      TutorProfile.countDocuments({ verificationStatus: "approved" }),
      TutorProfile.countDocuments({ verificationStatus: "rejected" }),
      User.countDocuments({ isActive: true, isDeleted: { $ne: true } }),
      User.countDocuments({ isActive: false, isDeleted: { $ne: true } }),
      AuditLog.find({}).sort({ createdAt: -1 }).limit(10).select("action actor entity createdAt").lean(),
      AuditLog.countDocuments({}),
      User.countDocuments({ isDeleted: true }),
      User.countDocuments({ countryCode: { $in: [null, ""] }, isDeleted: { $ne: true } }),
      TutorProfile.countDocuments({ $or: [{ subjects: { $exists: false } }, { subjects: { $size: 0 } }] }),
      Booking.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Request.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      // Users with unexpected role combinations (pending + active flag)
      User.countDocuments({ role: "pending", isActive: true, isDeleted: { $ne: true } }),
    ]);

    evidenceRefs.push(
      evidence("platform user counts and role distribution", "User"),
      evidence("tutor verification status", "TutorProfile"),
      evidence("recent audit log entries", "AuditLog"),
      evidence("data quality checks", "User/TutorProfile"),
    );

    const riskIndicators: string[] = [];
    if (pendingVerification > 20) riskIndicators.push(`High verification backlog: ${pendingVerification} tutors awaiting review`);
    if (usersWithNoCountry > 50) riskIndicators.push(`${usersWithNoCountry} users have no country assigned`);
    if (tutorsWithNoSubjects > 10) riskIndicators.push(`${tutorsWithNoSubjects} tutor profiles have no subjects listed`);
    if (multipleRoleUsers > 0) riskIndicators.push(`${multipleRoleUsers} pending-role accounts are flagged as active`);

    const findings = {
      platformKpis: {
        totalUsers,
        totalTutors,
        totalStudents,
        totalAdmins,
        activeUsers,
        inactiveUsers,
        deletedAccounts: deletedUsers,
        bookingsLast30Days: recentBookings30d,
        requestsLast30Days: recentRequests30d,
      },
      verificationTrends: {
        pending: pendingVerification,
        approved: approvedTutors,
        rejected: rejectedTutors,
      },
      dataQuality: {
        usersWithNoCountry,
        tutorsWithNoSubjects,
        dataQualityNote: "Counts reflect records missing required fields. Does not constitute a compliance audit.",
      },
      roleAnomalies: {
        pendingUsersMarkedActive: multipleRoleUsers,
        anomalyNote: "Role anomalies require manual investigation. This agent does not alter account status.",
      },
      riskIndicators,
      auditLog: {
        totalEvents: auditLogTotal,
        recentEvents: recentAuditLogs.map((log) => ({
          action: log.action,
          actor: log.actor,
          entity: log.entity,
          at: log.createdAt,
        })),
      },
      disclaimer: "Platform Intelligence findings are operational indicators only. This agent does not provide regulatory compliance certification, legal assurance, or security guarantees.",
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
