import { Request, Response } from "express";
import { AuthRequest } from "../types";
import Contact from "../models/Contact.model";
import sendEmail from "../utils/sendEmail";

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
export const submitContact = async (req: Request, res: Response): Promise<void> => {
  const { name, email, phone, subject, message } = req.body;

  // Save to DB
  const contact = await Contact.create({ name, email, phone, subject, message });

  // Send email notification to admin
  await sendEmail({
    to: process.env.EMAIL_USER as string,
    subject: `New Contact Message: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">New Contact Form Submission</h2>
        <hr />
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p style="background: #f9fafb; padding: 1rem; border-radius: 0.5rem;">${message}</p>
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
        <h2 style="color: #1a1a2e;">Thank you, ${name}!</h2>
        <p>We've received your message and will get back to you within 24 hours.</p>
        <hr />
        <p><strong>Your message:</strong></p>
        <p style="background: #f9fafb; padding: 1rem; border-radius: 0.5rem;">${message}</p>
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