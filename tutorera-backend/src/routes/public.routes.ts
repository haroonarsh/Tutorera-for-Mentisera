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
      publicTutorUsers,
      totalBookings,
      completedSessions,
      totalStudents,
    ] = await Promise.all([
      User.find({ role: "tutor", isActive: true, isDeleted: { $ne: true }, isTestAccount: { $ne: true } }).select("_id").lean(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "completed" }),
      User.countDocuments({ role: "student", isActive: true, isDeleted: { $ne: true }, isTestAccount: { $ne: true } }),
    ]);

    // Public claims must describe the same pool users can actually browse,
    // not every historical tutor registration.
    const publicTutorIds = publicTutorUsers.map((user) => user._id);
    const visibleTutorFilter: any = {
      user: { $in: publicTutorIds },
      isVerified: true,
      verificationStatus: "approved",
      isTestAccount: { $ne: true },
    };
    const [visibleTutors, visiblePoliceVerified] = await Promise.all([
      TutorProfile.countDocuments(visibleTutorFilter),
      TutorProfile.countDocuments({ ...visibleTutorFilter, policeCertificate: { $exists: true, $ne: "" } }),
    ]);

    // The public pool contains only verified profiles, so this is 100 when
    // it exists. It is retained solely for the existing badge API contract.
    const verifiedPercent = visibleTutors > 0 ? 100 : 0;

    res.status(200).json({
      success: true,
      stats: {
        // `totalTutors` is retained for compatibility; every displayed
        // statistic is calculated from currently public, approved profiles.
        totalTutors: visibleTutors,
        verifiedTutors: visibleTutors,
        verifiedPercent,
        policeVerified: visiblePoliceVerified,
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

// A compact, cacheable inventory snapshot for server-rendered SEO routes.
// It replaces per-combination crawler requests with one truthful aggregation.
router.get("/seo-inventory", async (_req, res) => {
  try {
    const publicMatch = { verificationStatus: "approved", isVerified: true, isTestAccount: { $ne: true } };
    const rows = await TutorProfile.aggregate([
      { $match: publicMatch },
      { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "account" } },
      { $unwind: "$account" },
      { $match: { "account.isActive": true, "account.isDeleted": { $ne: true }, "account.isTestAccount": { $ne: true } } },
      { $project: { countryCode: 1, city: 1, subjects: 1, levels: 1, updatedAt: 1 } },
    ]);
    const count = (values: string[]) => Object.entries(values.reduce<Record<string, number>>((map, raw) => {
      const value = String(raw || "").trim(); if (value) map[value] = (map[value] || 0) + 1; return map;
    }, {})).filter(([, total]) => total >= 3).map(([value, total]) => ({ value, total }));
    const citySubject = new Map<string, number>();
    for (const row of rows) for (const subject of row.subjects || []) {
      const key = `${row.city || ""}|${subject}`;
      if (row.city && subject) citySubject.set(key, (citySubject.get(key) || 0) + 1);
    }
    res.set("Cache-Control", "public, max-age=300, s-maxage=900, stale-while-revalidate=3600");
    res.json({ success: true, generatedAt: new Date().toISOString(), totalPublicTutors: rows.length,
      countries: count(rows.map((row) => row.countryCode)), cities: count(rows.map((row) => row.city)),
      subjects: count(rows.flatMap((row) => row.subjects || [])), levels: count(rows.flatMap((row) => row.levels || [])),
      citySubjects: Array.from(citySubject.entries()).filter(([, total]) => total >= 3).map(([key, total]) => { const [city, subject] = key.split("|"); return { city, subject, total }; }),
    });
  } catch (err) { console.error("SEO inventory error:", err); res.status(500).json({ success: false, message: "SEO inventory unavailable." }); }
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
