import { Response } from "express";
import { Types } from "mongoose";
import { AuthRequest } from "../types";
import GuaranteeClaim from "../models/GuaranteeClaim.model";
import Booking from "../models/Booking.model";
import User from "../models/User.model";
import sendEmail from "../utils/sendEmail";
import { escapeHtml } from "../utils/escapeHtml";

// @desc    Submit a first session guarantee claim
// @route   POST /api/guarantee/claim
// @access  Private (student)
export const submitClaim = async (req: AuthRequest, res: Response): Promise<void> => {
  const { bookingId, reason, details } = req.body;

  if (!bookingId || !reason) {
    res.status(400).json({ success: false, message: "Booking ID and reason are required." });
    return;
  }

  // Verify booking exists, belongs to this student, is completed, and is first session
  const booking = await Booking.findOne({
    _id: bookingId,
    student: req.user?._id,
    status: "completed",
    isFirstSession: true,
  }).populate("tutor", "name email");

  if (!booking) {
    res.status(404).json({
      success: false,
      message: "Booking not found or not eligible for guarantee claim.",
    });
    return;
  }

  // Check if claim already submitted for this booking
  const existing = await GuaranteeClaim.findOne({ booking: bookingId });
  if (existing) {
    res.status(400).json({
      success: false,
      message: "A guarantee claim has already been submitted for this session.",
    });
    return;
  }

  const tutor = booking.tutor as unknown as { _id: Types.ObjectId; name: string; email: string };

  const claim = await GuaranteeClaim.create({
    student: req.user?._id,
    booking: bookingId,
    tutor: tutor._id,
    reason,
    details: details || "",
  });

  // Email to admin
  await sendEmail({
    to: process.env.EMAIL_USER as string,
    subject: `🔴 First Session Guarantee Claim — ${escapeHtml(req.user?.name)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">First Session Guarantee Claim</h2>
        <p style="background: #fef2f2; padding: 0.75rem 1rem; border-radius: 0.5rem; color: #ef4444; font-weight: 600;">
          A student was not satisfied with their first session and is requesting a remedy.
        </p>
        <hr />
        <p><strong>Student:</strong> ${escapeHtml(req.user?.name)} (${escapeHtml(req.user?.email)})</p>
        <p><strong>Tutor:</strong> ${escapeHtml(tutor.name)} (${escapeHtml(tutor.email)})</p>
        <p><strong>Booking ID:</strong> ${escapeHtml(bookingId)}</p>
        <p><strong>Amount Paid:</strong> Rs. ${booking.amount.toLocaleString()}</p>
        <p><strong>Reason:</strong> ${escapeHtml(reason)}</p>
        ${details ? `<p><strong>Details:</strong></p><p style="background: #f9fafb; padding: 1rem; border-radius: 0.5rem;">${escapeHtml(details)}</p>` : ""}
        <hr />
        <p style="color: #6b7280; font-size: 0.875rem;">
          Please review this claim in the admin panel and take appropriate action.
        </p>
        <p style="color: #9ca3af; font-size: 0.875rem;">TUTORERA® Guarantee System</p>
      </div>
    `,
  });

  // Confirmation email to student
  await sendEmail({
    to: req.user?.email as string,
    subject: "Your First Session Guarantee Claim — TUTORERA®",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">We received your claim, ${escapeHtml(req.user?.name)}!</h2>
        <p>Our team will review your first session guarantee claim and get back to you within <strong>24–48 hours</strong>.</p>
        <div style="background: #f9fafb; border-radius: 0.5rem; padding: 1rem; margin: 1rem 0;">
          <p style="margin: 0 0 0.5rem;"><strong>Your reason:</strong> ${escapeHtml(reason)}</p>
          ${details ? `<p style="margin: 0;"><strong>Details:</strong> ${escapeHtml(details)}</p>` : ""}
        </div>
        <p>If approved, we will either:</p>
        <ul>
          <li>Offer you a session credit to try another tutor, or</li>
          <li>Process a refund — our team will contact you with next steps</li>
        </ul>
        <hr />
        <p style="color: #9ca3af; font-size: 0.875rem;">TUTORERA® Pakistan · First Session Guarantee</p>
      </div>
    `,
  });

  res.status(201).json({
    success: true,
    message: "Your guarantee claim has been submitted. We'll review it within 24–48 hours.",
    claim,
  });
};

// @desc    Get all guarantee claims (admin)
// @route   GET /api/admin/guarantee-claims
// @access  Private (admin)
export const getAllClaims = async (req: AuthRequest, res: Response): Promise<void> => {
  const claims = await GuaranteeClaim.find()
    .populate("student", "name email phone")
    .populate("tutor", "name email")
    .populate("booking", "amount schedule teachingMode createdAt")
    .sort("-createdAt");

  res.status(200).json({ success: true, total: claims.length, claims });
};

// @desc    Update guarantee claim status (admin)
// @route   PATCH /api/admin/guarantee-claims/:id
// @access  Private (admin)
export const updateClaimStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, adminNote } = req.body;

  const claim = await GuaranteeClaim.findByIdAndUpdate(
    req.params.id,
    { status, adminNote: adminNote || "" },
    { new: true }
  ).populate("student", "name email");

  if (!claim) {
    res.status(404).json({ success: false, message: "Claim not found" });
    return;
  }

  // Email student about the decision
  const student = claim.student as unknown as { name: string; email: string };
  if (status === "approved") {
    await sendEmail({
      to: student.email,
      subject: "✅ Your Guarantee Claim Was Approved — TUTORERA®",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Great news, ${escapeHtml(student.name)}!</h2>
          <p>Your first session guarantee claim has been <strong>approved</strong>.</p>
          ${adminNote ? `<p><strong>Note from our team:</strong> ${escapeHtml(adminNote)}</p>` : ""}
          <p>Our team will contact you shortly to arrange your session credit or refund.</p>
          <hr />
          <p style="color: #9ca3af; font-size: 0.875rem;">TUTORERA® Pakistan</p>
        </div>
      `,
    });
  } else if (status === "rejected") {
    await sendEmail({
      to: student.email,
      subject: "Update on your Guarantee Claim — TUTORERA®",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a2e;">Update on your claim, ${escapeHtml(student.name)}</h2>
          <p>After reviewing your first session guarantee claim, we were unable to approve it at this time.</p>
          ${adminNote ? `<p><strong>Reason:</strong> ${escapeHtml(adminNote)}</p>` : ""}
          <p>If you have questions, please contact our support team.</p>
          <hr />
          <p style="color: #9ca3af; font-size: 0.875rem;">TUTORERA® Pakistan</p>
        </div>
      `,
    });
  }

  res.status(200).json({ success: true, claim });
};