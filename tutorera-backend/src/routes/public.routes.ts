import { Router } from "express";
import User from "../models/User.model";
import TutorProfile from "../models/TutorProfile.model";
import Booking from "../models/Booking.model";
import { getPayoutReportById } from "../services/payoutReport.service";

const router = Router();

// @desc    Get live platform verification and trust statistics
// @route   GET /api/public/stats
// @access  Public
router.get("/stats", async (_req, res) => {
  try {
    const [
      totalTutors,
      verifiedTutors,
      policeVerified,
      totalBookings,
      completedSessions,
      totalStudents,
    ] = await Promise.all([
      User.countDocuments({ role: "tutor" }),
      TutorProfile.countDocuments({ isVerified: true }),
      TutorProfile.countDocuments({ policeCertificate: { $exists: true, $ne: "" } }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "completed" }),
      User.countDocuments({ role: "student" }),
    ]);

    const verifiedPercent = totalTutors > 0
      ? Math.round((verifiedTutors / totalTutors) * 100)
      : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalTutors,
        verifiedTutors,
        verifiedPercent,
        policeVerified,
        totalBookings,
        completedSessions,
        totalStudents,
      },
    });
  } catch (err) {
    console.error("Public stats error:", err);
    res.status(500).json({ success: false, message: "Failed to load stats." });
  }
});

// @desc    Verify payout report
// @route   GET /api/public/verify/report/:reportId
// @access  Public
router.get("/verify/report/:reportId", async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await getPayoutReportById(reportId);
    if (!report) {
      res.status(404).json({ success: false, message: "Report not found." });
      return;
    }
    res.status(200).json({
      success: true,
      data: {
        reportReference: report.reportReference,
        tutorName: report.tutorName,
        periodStart: report.periodStart,
        periodEnd: report.periodEnd,
        grossAmount: report.grossAmount,
        netPayout: report.netPayout,
        totalDeduction: report.totalDeduction,
        sessionsCompleted: report.sessionsCompleted,
        paymentDate: report.paymentDate,
        complianceStatus: report.complianceStatus,
        generatedAt: report.generatedAt,
        expiresAt: report.expiresAt,
        digest: report.digest,
        verified: true,
      },
    });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ success: false, message: "Verification failed." });
  }
});

export default router;
