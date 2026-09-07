import { Response } from "express";
import { Types } from "mongoose";
import { AuthRequest } from "../types";
import RefundRequest, { IRefundRequest } from "../models/RefundRequest.model";
import Booking from "../models/Booking.model";
import User from "../models/User.model";
import sendEmail from "../utils/sendEmail";
import { escapeHtml } from "../utils/escapeHtml";
import { renderTransactionalEmail } from "../utils/emailBrand";

const REASON_LABELS: Record<string, string> = {
  tutor_cancelled: "Tutor Cancelled",
  session_not_delivered: "Session Not Delivered",
  quality_issue: "Quality Issue",
  scheduling_conflict: "Scheduling Conflict",
  duplicate_charge: "Duplicate Charge",
  other: "Other",
};

function today() {
  return new Date().toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

export const submitRefundRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const { reason, details } = req.body;
  const bookingId = req.params.id as string;

  if (!reason) {
    res.status(400).json({ success: false, message: "Refund reason is required." });
    return;
  }

  const booking = await Booking.findOne({
    _id: bookingId,
    student: req.user?._id,
    paymentStatus: "confirmed",
  }).populate<{ tutor: { _id: string; name: string; email: string } }>("tutor", "name email");

  if (!booking) {
    res.status(404).json({ success: false, message: "Booking not found or not eligible for refund." });
    return;
  }

  const existing = await RefundRequest.findOne({ booking: bookingId });
  if (existing) {
    res.status(409).json({ success: false, message: "A refund request has already been submitted for this booking." });
    return;
  }

  const tutor = booking.tutor as unknown as { _id: string; name: string; email: string };
  const refundAmount = booking.studentTotal || booking.amount;

  const refundReq = await RefundRequest.create({
    student: req.user?._id,
    booking: new Types.ObjectId(bookingId),
    tutor: tutor._id,
    amount: refundAmount,
    reason,
    details: details || "",
  });

  const reasonLabel = REASON_LABELS[reason] || reason;

  await sendEmail({
    to: process.env.EMAIL_USER as string,
    subject: `Refund Request — ${escapeHtml(req.user?.name)} (${reasonLabel})`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#1a1a2e;">New Refund Request</h2>
        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f9fafb;border-radius:8px;overflow:hidden;margin:1rem 0;">
          <tr><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;"><strong>Student</strong></td><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">${escapeHtml(req.user?.name)} (${escapeHtml(req.user?.email)})</td></tr>
          <tr><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;"><strong>Tutor</strong></td><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">${escapeHtml(tutor.name)}</td></tr>
          <tr><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;"><strong>Booking ID</strong></td><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">${escapeHtml(bookingId)}</td></tr>
          <tr><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;"><strong>Amount</strong></td><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">PKR ${refundAmount.toLocaleString()}</td></tr>
          <tr><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;"><strong>Reason</strong></td><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">${escapeHtml(reasonLabel)}</td></tr>
          <tr><td style="padding:12px 16px;"><strong>Details</strong></td><td style="padding:12px 16px;">${escapeHtml(details || "—")}</td></tr>
        </table>
        <p style="color:#6b7280;font-size:0.875rem;">Review in the admin panel and process the refund via the payment gateway if approved.</p>
      </div>
    `,
  });

  const studentEmailHtml = renderTransactionalEmail({
    subject: "TUTORERA® — Refund Request Received",
    emailCategory: "Refund",
    emailHeading: "Refund Request Received",
    emailSubheading: `Your refund request is being reviewed.`,
    firstName: req.user?.name,
    openingMessage: `We received your refund request for PKR ${refundAmount.toLocaleString()} and will review it within 2–3 business days.`,
    mainMessage: `Reason: ${reasonLabel}.${details ? ` Details: ${details}` : ""} If approved, the refund will be processed to your original payment method within 5–7 business days.`,
    transaction: {
      referenceId: `REF-${bookingId}`,
      date: today(),
      status: "Under Review",
      amount: `PKR ${refundAmount.toLocaleString()}`,
    },
    cta: { label: "View Booking", url: "https://tutorera.ac.pk/dashboard" },
    additionalInformation: "Refunds are processed to the original payment method. For questions, contact hello@mentisera.pk.",
    includeSecurityNotice: true,
    deliverability: "This transactional notification was sent because you submitted a refund request on TUTORERA.",
  });

  await sendEmail({
    to: req.user?.email as string,
    subject: "TUTORERA® — Refund Request Received",
    html: studentEmailHtml,
  });

  res.status(201).json({ success: true, message: "Refund request submitted.", refundRequest: refundReq });
};

export const getMyRefundRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  const requests = await RefundRequest.find({ student: req.user?._id })
    .populate("booking", "schedule teachingMode amount studentTotal createdAt")
    .populate("tutor", "name")
    .sort("-createdAt");

  res.status(200).json({ success: true, total: requests.length, refundRequests: requests });
};

export const getAllRefundRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status } = req.query;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const requests = await RefundRequest.find(filter)
    .populate("student", "name email phone")
    .populate("tutor", "name email")
    .populate("booking", "amount studentTotal schedule teachingMode createdAt")
    .sort("-createdAt");

  res.status(200).json({ success: true, total: requests.length, refundRequests: requests });
};

export const updateRefundRequestStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, adminNote } = req.body;

  const refundReq = await RefundRequest.findById(req.params.id)
    .populate<{ student: { name: string; email: string }; booking: { studentTotal: number; amount: number } }>(
      "student",
      "name email"
    )
    .populate("booking", "studentTotal amount");

  if (!refundReq) {
    res.status(404).json({ success: false, message: "Refund request not found." });
    return;
  }

  refundReq.status = status as IRefundRequest["status"];
  refundReq.adminNote = adminNote || "";
  if (status === "processed" || status === "approved") {
    refundReq.processedAt = new Date();
  }
  await refundReq.save();

  const student = refundReq.student as unknown as { name: string; email: string };

  if (status === "approved") {
    await Booking.findByIdAndUpdate(refundReq.booking, { paymentStatus: "refunded" });
  }

  if (status === "approved" || status === "rejected") {
    const refundAmount = (refundReq.booking as unknown as { studentTotal: number; amount: number }).studentTotal || refundReq.amount;
    const statusLabel = status === "approved" ? "Approved" : "Not Approved";
    const emailHtml = renderTransactionalEmail({
      subject: `TUTORERA® — Refund Request ${statusLabel}`,
      emailCategory: "Refund",
      emailHeading: `Refund Request ${statusLabel}`,
      emailSubheading: `Your refund request has been reviewed.`,
      firstName: student.name,
      openingMessage:
        status === "approved"
          ? `Your refund request of PKR ${refundAmount.toLocaleString()} has been approved.`
          : `After review, we were unable to approve your refund request at this time.`,
      mainMessage:
        status === "approved"
          ? `The refund will be processed to your original payment method within 5–7 business days.`
          : adminNote || `If you have questions, please contact our support team.`,
      transaction: {
        referenceId: `REF-${refundReq._id}`,
        date: today(),
        status: status === "approved" ? "Approved" : "Rejected",
        amount: `PKR ${refundAmount.toLocaleString()}`,
      },
      cta: { label: "Contact Support", url: "https://tutorera.ac.pk/contact" },
      additionalInformation:
        status === "approved"
          ? "The refund will appear in your account within 5–7 business days depending on your bank."
          : "You may contact hello@mentisera.pk for further clarification.",
      includeSecurityNotice: true,
      deliverability: "This transactional notification was sent because you submitted a refund request on TUTORERA.",
    });

    await sendEmail({
      to: student.email,
      subject: `TUTORERA® — Refund Request ${statusLabel}`,
      html: emailHtml,
    });
  }

  res.status(200).json({ success: true, refundRequest: refundReq });
};
