import { escapeHtml } from "./escapeHtml";

export const bookingConfirmedEmail = (studentName: string, tutorName: string, amount: number) => ({
  subject: "TUTORERA® — Booking Confirmed",
  html: `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a2e;">Booking Confirmed 📅</h2>
      <p style="color: #374151;">Hi ${escapeHtml(studentName)},</p>
      <p style="color: #374151;">Your booking with <strong>${escapeHtml(tutorName)}</strong> has been confirmed.</p>
      <div style="background: #eff6ff; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="color: #1a1a2e; margin: 0; font-weight: 700;">Amount: Rs. ${escapeHtml(amount.toLocaleString())}</p>
      </div>
      <p style="color: #374151;">Please complete payment via NayaPay to:</p>
      <p style="color: #374151; font-weight: 600;">NayaPay ID: mentisera@nayapay</p>
      <p style="color: #6b7280; font-size: 13px;">After payment, email proof to billing@tutorera.pk to confirm your session.</p>
    </div>
  `,
});

export const bidAcceptedEmail = (tutorName: string, studentName: string, amount: number) => ({
  subject: "TUTORERA® — Your Bid Was Accepted!",
  html: `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a2e;">Bid Accepted ✅</h2>
      <p style="color: #374151;">Hi ${escapeHtml(tutorName)},</p>
      <p style="color: #374151;"><strong>${escapeHtml(studentName)}</strong> has accepted your bid! A booking has been created.</p>
      <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="color: #1a1a2e; margin: 0; font-weight: 700;">Session Amount: Rs. ${escapeHtml(amount.toLocaleString())}</p>
      </div>
      <p style="color: #6b7280; font-size: 13px;">Log in to your dashboard to view session details.</p>
    </div>
  `,
});

export const welcomeEmail = (name: string) => ({
  subject: "Welcome to TUTORERA®!",
  html: `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a2e;">Welcome, ${escapeHtml(name)}! 🎉</h2>
      <p style="color: #374151;">Thanks for joining TUTORERA® — Pakistan's tutoring marketplace.</p>
      <p style="color: #374151;">You can now browse tutors, book sessions, and start learning.</p>
      <p style="color: #6b7280; font-size: 13px;">If you have any questions, our support team is here to help.</p>
    </div>
  `,
});

export const tutorPendingEmail = (name: string) => ({
  subject: "TUTORERA® — Your Application is Under Review",
  html: `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a2e;">Thanks for applying, ${escapeHtml(name)}!</h2>
      <p style="color: #374151;">Your tutor profile is currently <strong>pending verification</strong>.</p>
      <p style="color: #374151;">Our team is reviewing your application and will notify you once approved — usually within 24–48 hours.</p>
      <p style="color: #6b7280; font-size: 13px;">You'll be able to receive bookings once approved.</p>
    </div>
  `,
});

export const tutorApprovedEmail = (name: string) => ({
  subject: "🎉 Your TUTORERA® Profile is Approved!",
  html: `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #16a34a;">Congratulations, ${escapeHtml(name)}!</h2>
      <p style="color: #374151;">Your tutor profile has been <strong>approved</strong>. You're now visible to students on TUTORERA®.</p>
      <p style="color: #6b7280; font-size: 13px;">Log in to your dashboard to complete your profile and start receiving requests.</p>
    </div>
  `,
});

export const tutorRejectedEmail = (name: string, reason?: string) => ({
  subject: "TUTORERA® — Update on Your Application",
  html: `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a2e;">Update on your application, ${escapeHtml(name)}</h2>
      <p style="color: #374151;">After review, we were unable to approve your tutor profile at this time.</p>
      ${reason ? `<p style="color: #374151;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ""}
      <p style="color: #6b7280; font-size: 13px;">Contact support if you'd like more information or wish to reapply.</p>
    </div>
  `,
});

export const planUpgradedEmail = (name: string, plan: string) => ({
  subject: `TUTORERA® — Your Plan is Now ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
  html: `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #16a34a;">Plan Upgraded! 🎉</h2>
      <p style="color: #374151;">Hi ${escapeHtml(name)}, your TUTORERA® plan has been upgraded to <strong style="text-transform: capitalize;">${escapeHtml(plan)}</strong>.</p>
      <p style="color: #6b7280; font-size: 13px;">Log in to your dashboard to see your new limits and features.</p>
    </div>
  `,
});

export const paymentConfirmedEmail = (studentName: string, tutorName: string, amount: number) => ({
  subject: "TUTORERA® — Payment Confirmed",
  html: `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #16a34a;">Payment Confirmed ✅</h2>
      <p style="color: #374151;">Hi ${escapeHtml(studentName)}, we've confirmed your payment of <strong>Rs. ${amount.toLocaleString()}</strong> for your session with ${escapeHtml(tutorName)}.</p>
      <p style="color: #6b7280; font-size: 13px;">Your session is now fully booked. Enjoy learning!</p>
    </div>
  `,
});

export const bookingCancelledEmail = (name: string, otherPartyName: string, subject?: string) => ({
  subject: "TUTORERA® — Booking Cancelled",
  html: `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a2e;">Booking Cancelled</h2>
      <p style="color: #374151;">Hi ${escapeHtml(name)}, your booking with ${escapeHtml(otherPartyName)}${subject ? ` for ${escapeHtml(subject)}` : ""} has been cancelled.</p>
      <p style="color: #6b7280; font-size: 13px;">If you have questions, please contact our support team.</p>
    </div>
  `,
});

export const newBidEmail = (studentName: string, amount: number) => ({
  subject: "TUTORERA® — New Bid Received",
  html: `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a2e;">New Bid Received 📬</h2>
      <p style="color: #374151;">Hi ${escapeHtml(studentName)}, a tutor has placed a bid of <strong>Rs. ${amount.toLocaleString()}</strong> on your tuition request.</p>
      <p style="color: #6b7280; font-size: 13px;">Log in to your dashboard to review and respond.</p>
    </div>
  `,
});

export const directBookingRequestEmail = (tutorName: string, studentName: string, subject: string) => ({
  subject: "TUTORERA® — New Direct Booking Request",
  html: `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a2e;">New Booking Request 📩</h2>
      <p style="color: #374151;">Hi ${escapeHtml(tutorName)}, <strong>${escapeHtml(studentName)}</strong> wants to book a session with you for <strong>${escapeHtml(subject)}</strong>.</p>
      <p style="color: #6b7280; font-size: 13px;">Log in to your dashboard to accept or decline.</p>
    </div>
  `,
});

export const directBookingAcceptedEmail = (
  name: string,
  otherPartyName: string,
  subject: string,
  date?: string,
  startTime?: string,
  endTime?: string,
  paymentInfo?: { amount: number }
) => ({
  subject: "TUTORERA® — Booking Confirmed with Session Details",
  html: `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #16a34a;">Booking Confirmed ✅</h2>
      <p style="color: #374151;">Hi ${escapeHtml(name)}, your session with <strong>${escapeHtml(otherPartyName)}</strong> for <strong>${escapeHtml(subject)}</strong> is confirmed.</p>
      ${date && startTime ? `
      <div style="background: #eff6ff; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="color: #1a1a2e; margin: 0 0 6px; font-weight: 700;">📅 ${escapeHtml(date)}</p>
        <p style="color: #1a1a2e; margin: 0; font-weight: 700;">🕐 ${escapeHtml(startTime)} – ${escapeHtml(endTime)}</p>
      </div>
      ` : ""}
      ${paymentInfo ? `
      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="color: #1a1a2e; margin: 0 0 8px; font-weight: 700;">Payment Required</p>
        <p style="color: #374151; margin: 0; font-size: 14px;">
          Please send Rs. ${escapeHtml(paymentInfo.amount.toLocaleString())} to NayaPay ID: <strong>mentisera@nayapay</strong> and email proof to <strong>billing@tutorera.pk</strong>.
        </p>
      </div>
      ` : ""}
      <p style="color: #6b7280; font-size: 13px;">Log in to your dashboard for full session details.</p>
    </div>
  `,
});

export const directBookingDeclinedEmail = (studentName: string, subject: string) => ({
  subject: "TUTORERA® — Booking Request Declined",
  html: `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a2e;">Booking Request Declined</h2>
      <p style="color: #374151;">Hi ${escapeHtml(studentName)}, the tutor was unable to accept your booking request for <strong>${escapeHtml(subject)}</strong>.</p>
      <p style="color: #6b7280; font-size: 13px;">Don't worry — you can browse other tutors or send a new request anytime.</p>
    </div>
  `,
});