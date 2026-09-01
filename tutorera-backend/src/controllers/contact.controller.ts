import { Request, Response } from "express";
import { AuthRequest } from "../types";
import Contact from "../models/Contact.model";
import sendEmail from "../utils/sendEmail";
import { escapeHtml } from "../utils/escapeHtml";

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
export const submitContact = async (req: Request, res: Response): Promise<void> => {
  const { name, email, phone, userType, bookingReference, transactionReference, subject, message } = req.body;

  // Save to DB
  const contact = await Contact.create({ name, email, phone, userType, bookingReference, transactionReference, subject, message });

  // Send email notification to admin
  await sendEmail({
    to: process.env.EMAIL_USER as string,
    subject: `New Contact Message: ${escapeHtml(subject)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">New Contact Form Submission</h2>
        <hr />
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone) || "Not provided"}</p>
        <p><strong>User Type:</strong> ${escapeHtml(userType) || "Not provided"}</p>
        <p><strong>Booking Reference:</strong> ${escapeHtml(bookingReference) || "Not provided"}</p>
        <p><strong>Transaction Reference:</strong> ${escapeHtml(transactionReference) || "Not provided"}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <p><strong>Message:</strong></p>
        <p style="background: #f9fafb; padding: 1rem; border-radius: 0.5rem;">${escapeHtml(message)}</p>
        <hr />
        <p style="color: #9ca3af; font-size: 0.875rem;">TUTORERA® Contact System</p>
      </div>
    `,
  });

  // Send confirmation to user
  await sendEmail({
    to: email,
    subject: "We received your message — TUTORERA®",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Thank you, ${escapeHtml(name)}!</h2>
        <p>We've received your message and will get back to you within 24 hours.</p>
        <hr />
        <p><strong>Your message:</strong></p>
        <p style="background: #f9fafb; padding: 1rem; border-radius: 0.5rem;">${escapeHtml(message)}</p>
        <hr />
        <p style="color: #9ca3af; font-size: 0.875rem;">TUTORERA® Pakistan</p>
      </div>
    `,
  });

  res.status(201).json({
    success: true,
    message: "Message sent successfully. We'll get back to you soon!",
    contact,
  });
};

// @desc    Get all contact messages
// @route   GET /api/contact
// @access  Private (admin)
export const getAllContacts = async (req: AuthRequest, res: Response): Promise<void> => {
  const contacts = await Contact.find().sort("-createdAt");
  res.status(200).json({ success: true, total: contacts.length, contacts });
};

// @desc    Submit in-session support request (tied to a booking)
// @route   POST /api/contact/support
// @access  Private (student or tutor)
export const submitSupportRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const { subject, message, bookingId, priority } = req.body;
  const user = req.user;

  if (!subject || !message) {
    res.status(400).json({ success: false, message: "Subject and message are required." });
    return;
  }

  const contact = await Contact.create({
    name: user?.name,
    email: user?.email,
    phone: user?.phone || "",
    subject,
    message,
    type: "support",
    bookingId: bookingId || "",
    userRole: user?.role === "tutor" ? "tutor" : "student",
    priority: priority || "normal",
    status: "open",
  });

  // Email to admin — includes booking context for quick lookup
  await sendEmail({
    to: process.env.EMAIL_USER as string,
    subject: `🆘 Support Request${priority === "urgent" ? " — URGENT" : ""}: ${escapeHtml(subject)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">New In-Session Support Request</h2>
        ${priority === "urgent" ? `<p style="background:#fef2f2;color:#ef4444;padding:0.5rem 1rem;border-radius:0.5rem;font-weight:700;">⚠ Marked as URGENT</p>` : ""}
        <hr />
        <p><strong>From:</strong> ${escapeHtml(user?.name)} (${escapeHtml(user?.role)})</p>
        <p><strong>Email:</strong> ${escapeHtml(user?.email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(user?.phone) || "Not provided"}</p>
        <p><strong>Booking ID:</strong> ${escapeHtml(bookingId) || "Not linked"}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <p><strong>Message:</strong></p>
        <p style="background: #f9fafb; padding: 1rem; border-radius: 0.5rem;">${escapeHtml(message)}</p>
        <hr />
        <p style="color: #9ca3af; font-size: 0.875rem;">TUTORERA® Support System</p>
      </div>
    `,
  });

  // Confirmation to user
  await sendEmail({
    to: user?.email as string,
    subject: "We received your support request — TUTORERA®",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Thanks, ${escapeHtml(user?.name)}!</h2>
        <p>Our support team has received your request and will respond as soon as possible.</p>
        ${priority === "urgent" ? `<p style="color:#ef4444;font-weight:600;">Since this is marked urgent, we'll prioritize it.</p>` : ""}
        <hr />
        <p><strong>Your message:</strong></p>
        <p style="background: #f9fafb; padding: 1rem; border-radius: 0.5rem;">${escapeHtml(message)}</p>
        <hr />
        <p style="color: #9ca3af; font-size: 0.875rem;">TUTORERA® Pakistan</p>
      </div>
    `,
  });

  res.status(201).json({
    success: true,
    message: "Support request submitted. Our team will contact you soon.",
    contact,
  });
};
