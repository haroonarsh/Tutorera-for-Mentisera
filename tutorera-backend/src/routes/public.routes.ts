import { Router } from "express";
import User from "../models/User.model";
import TutorProfile from "../models/TutorProfile.model";
import Booking from "../models/Booking.model";

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

export default router;
