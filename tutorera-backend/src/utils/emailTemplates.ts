import { renderTransactionalEmail } from "./emailBrand";

function today() {
  return new Date().toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

export const bookingConfirmedEmail = (studentName: string, tutorName: string, amount: number) => {
  const html = renderTransactionalEmail({
    subject: "TUTORERA® — Booking Confirmed",
    emailCategory: "Booking Confirmation",
    emailHeading: "Booking Confirmed",
    emailSubheading: "Your tutor session is confirmed and on the calendar.",
    firstName: studentName,
    openingMessage: `Your booking with ${tutorName} has been confirmed.`,
    mainMessage: "Please review the final payable PKR amount and complete payment through the available authorized payment method. TUTORERA verifies payment server-side before treating a booking as paid.",
    transaction: {
      referenceId: `BOOK-${Date.now()}`,
      date: today(),
      status: "Confirmed",
      amount: `PKR ${amount.toLocaleString()}`,
    },
    cta: { label: "View Booking", url: "https://tutorera.ac.pk/dashboard" },
    additionalInformation: "Support: hello@mentisera.pk",
    includeSecurityNotice: true,
    deliverability: "This transactional notification was sent because of activity associated with your TUTORERA booking.",
  });
  return { subject: "TUTORERA® — Booking Confirmed", html };
};

export const bidAcceptedEmail = (tutorName: string, studentName: string, amount: number) => {
  const html = renderTransactionalEmail({
    subject: "TUTORERA® — Your Offer Was Accepted!",
    emailCategory: "Offer Update",
    emailHeading: "Your Offer Was Accepted",
    emailSubheading: "Great work — the student has confirmed your rate.",
    firstName: tutorName,
    openingMessage: `${studentName} has accepted your tutor offer. A booking has been created.`,
    mainMessage: "The student will now complete payment through the authorized payment method. You'll receive another notification once payment is confirmed and the session is fully booked.",
    transaction: {
      referenceId: `OFFER-${Date.now()}`,
      date: today(),
      status: "Accepted",
      amount: `PKR ${amount.toLocaleString()}`,
    },
    cta: { label: "View My Offers", url: "https://tutorera.ac.pk/offers" },
    includeSecurityNotice: true,
    deliverability: "This transactional notification was sent because a student accepted a tutor offer on TUTORERA.",
  });
  return { subject: "TUTORERA® — Your Offer Was Accepted!", html };
};

export const welcomeEmail = (name: string) => {
  const html = renderTransactionalEmail({
    subject: "Welcome to TUTORERA®!",
    emailCategory: "Welcome",
    emailHeading: "Welcome to TUTORERA®",
    emailSubheading: "Pakistan's student-led tutoring marketplace.",
    firstName: name,
    openingMessage: "Thanks for joining TUTORERA®.",
    mainMessage: "You can now browse tutors, book sessions, and start learning. If you have any questions, our support team is here to help.",
    cta: { label: "Browse Tutors", url: "https://tutorera.ac.pk/tutors" },
    includeSecurityNotice: true,
  });
  return { subject: "Welcome to TUTORERA®!", html };
};

export const tutorPendingEmail = (name: string) => {
  const html = renderTransactionalEmail({
    subject: "TUTORERA® — Your Application is Under Review",
    emailCategory: "Tutor Application",
    emailHeading: "Thanks for applying, " + name + "!",
    emailSubheading: "Your tutor profile is currently pending verification.",
    firstName: name,
    openingMessage: "Our team is reviewing your application and will notify you once approved — usually within 24–48 hours.",
    mainMessage: "You'll be able to receive bookings once approved. In the meantime, you can log in to your dashboard to track your application status.",
    cta: { label: "Track Application", url: "https://tutorera.ac.pk/tutor/application-status" },
    includeSecurityNotice: true,
  });
  return { subject: "TUTORERA® — Your Application is Under Review", html };
};

export const tutorApprovedEmail = (name: string) => {
  const html = renderTransactionalEmail({
    subject: "🎉 Your TUTORERA® Profile is Approved!",
    emailCategory: "Tutor Application",
    emailHeading: "Your TUTORERA® Profile is Approved!",
    emailSubheading: "You are now visible to students on the marketplace.",
    firstName: name,
    openingMessage: "Congratulations! Your tutor profile has been approved.",
    mainMessage: "Log in to your dashboard to complete your profile and start receiving requests. To unlock Home and In-Person Tuition, submit your police verification certificate.",
    cta: { label: "Open Dashboard", url: "https://tutorera.ac.pk/dashboard" },
    includeSecurityNotice: true,
  });
  return { subject: "🎉 Your TUTORERA® Profile is Approved!", html };
};

export const tutorRejectedEmail = (name: string, reason?: string) => {
  const html = renderTransactionalEmail({
    subject: "TUTORERA® — Update on Your Application",
    emailCategory: "Tutor Application",
    emailHeading: "Update on Your Application",
    emailSubheading: "We were unable to approve your tutor profile at this time.",
    firstName: name,
    openingMessage: "After review, we were unable to approve your tutor profile at this time.",
    mainMessage: reason
      ? `Reason: ${reason}.`
      : "Please contact support if you'd like more information or wish to reapply.",
    additionalInformation: "Contact support if you'd like more information or wish to reapply.",
    cta: { label: "Contact Support", url: "mailto:hello@mentisera.pk" },
    includeSecurityNotice: true,
  });
  return { subject: "TUTORERA® — Update on Your Application", html };
};

export const planUpgradedEmail = (name: string, plan: string) => {
  const html = renderTransactionalEmail({
    subject: `TUTORERA® — Your Plan is Now ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
    emailCategory: "Plan Update",
    emailHeading: "Plan Upgraded",
    emailSubheading: "Your TUTORERA® plan has been updated.",
    firstName: name,
    openingMessage: `Your TUTORERA® plan has been upgraded to ${plan}.`,
    mainMessage: "Log in to your dashboard to see your new limits and features. Plan upgrades take effect immediately and your new bidding / request limits are now active.",
    cta: { label: "View Dashboard", url: "https://tutorera.ac.pk/dashboard" },
    includeSecurityNotice: true,
  });
  return { subject: `TUTORERA® — Your Plan is Now ${plan.charAt(0).toUpperCase() + plan.slice(1)}`, html };
};

export const paymentConfirmedEmail = (studentName: string, tutorName: string, amount: number) => {
  const html = renderTransactionalEmail({
    subject: "TUTORERA® — Payment Confirmed",
    emailCategory: "Payment Confirmation",
    emailHeading: "Payment Confirmed",
    emailSubheading: "Your session is now fully booked.",
    firstName: studentName,
    openingMessage: `We've confirmed your payment of PKR ${amount.toLocaleString()} for your session with ${tutorName}.`,
    mainMessage: "Your session is now fully booked. Please join the lesson a few minutes before the scheduled start time. Enjoy learning!",
    transaction: {
      referenceId: `PAY-${Date.now()}`,
      date: today(),
      status: "Confirmed",
      amount: `PKR ${amount.toLocaleString()}`,
    },
    cta: { label: "View Booking", url: "https://tutorera.ac.pk/dashboard" },
    includeSecurityNotice: true,
    deliverability: "This transactional notification was sent because of payment activity on your TUTORERA account.",
  });
  return { subject: "TUTORERA® — Payment Confirmed", html };
};

export const paymentFailedEmail = (studentName: string, tutorName: string, amount: number) => {
  const html = renderTransactionalEmail({
    subject: "TUTORERA® — Payment Could Not Be Processed",
    emailCategory: "Payment Update",
    emailHeading: "Payment Not Completed",
    emailSubheading: "We couldn't process your payment for this session.",
    firstName: studentName,
    openingMessage: `We were unable to complete the payment of PKR ${amount.toLocaleString()} for your session with ${tutorName}.`,
    mainMessage: "This could be due to insufficient funds, an expired card, or a network issue. Please try again using the same or a different payment method. If the problem persists, contact your bank or our support team.",
    transaction: {
      referenceId: `PAY-${Date.now()}`,
      date: today(),
      status: "Failed",
      amount: `PKR ${amount.toLocaleString()}`,
    },
    cta: { label: "Retry Payment", url: "https://tutorera.ac.pk/dashboard" },
    additionalInformation: "If you believe this was an error or need assistance, please reply to this email or contact hello@mentisera.pk.",
    includeSecurityNotice: true,
    deliverability: "This transactional notification was sent because a payment attempt on your TUTORERA booking was not successful.",
  });
  return { subject: "TUTORERA® — Payment Could Not Be Processed", html };
};

export const bookingCancelledEmail = (name: string, otherPartyName: string, subject?: string) => {
  const html = renderTransactionalEmail({
    subject: "TUTORERA® — Booking Cancelled",
    emailCategory: "Booking Update",
    emailHeading: "Booking Cancelled",
    emailSubheading: subject ? `Session: ${subject}` : undefined,
    firstName: name,
    openingMessage: `Your booking with ${otherPartyName}${subject ? ` for ${subject}` : ""} has been cancelled.`,
    mainMessage: "If you have questions, please contact our support team. Refunds, where applicable, are processed automatically to the original payment method within 3–5 business days.",
    cta: { label: "Contact Support", url: "mailto:hello@mentisera.pk" },
    includeSecurityNotice: true,
  });
  return { subject: "TUTORERA® — Booking Cancelled", html };
};

export const newBidEmail = (studentName: string, amount: number) => {
  const html = renderTransactionalEmail({
    subject: "TUTORERA® — New Offer Received",
    emailCategory: "Offer Update",
    emailHeading: "New Offer Received",
    emailSubheading: "A verified tutor sent an offer on your tuition request.",
    firstName: studentName,
    openingMessage: `A verified tutor sent an offer of PKR ${amount.toLocaleString()} on your tuition request.`,
    mainMessage: "Log in to your dashboard to review the tutor's profile, message, and proposed rate. You can accept, counter, or decline the offer directly from your Offers page.",
    transaction: {
      referenceId: `BID-${Date.now()}`,
      date: today(),
      status: "Submitted",
      amount: `PKR ${amount.toLocaleString()}`,
    },
    cta: { label: "Review Offer", url: "https://tutorera.ac.pk/offers" },
    includeSecurityNotice: true,
  });
  return { subject: "TUTORERA® — New Offer Received", html };
};

export const directBookingRequestEmail = (tutorName: string, studentName: string, subject: string) => {
  const html = renderTransactionalEmail({
    subject: "TUTORERA® — New Direct Booking Request",
    emailCategory: "Booking Request",
    emailHeading: "New Booking Request",
    emailSubheading: `${studentName} wants to book a session for ${subject}.`,
    firstName: tutorName,
    openingMessage: `${studentName} wants to book a session with you for ${subject}.`,
    mainMessage: "Log in to your dashboard to review the request and accept or decline. The student has already pre-confirmed the proposed schedule.",
    cta: { label: "Review Request", url: "https://tutorera.ac.pk/dashboard" },
    includeSecurityNotice: true,
  });
  return { subject: "TUTORERA® — New Direct Booking Request", html };
};

export const directBookingAcceptedEmail = (
  name: string,
  otherPartyName: string,
  subject: string,
  date?: string,
  startTime?: string,
  endTime?: string,
  paymentInfo?: { amount: number }
) => {
  const schedule = date && startTime ? `📅 ${date}\n🕐 ${startTime} – ${endTime}` : "";
  const html = renderTransactionalEmail({
    subject: "TUTORERA® — Booking Confirmed with Session Details",
    emailCategory: "Booking Confirmation",
    emailHeading: "Booking Confirmed",
    emailSubheading: `Your session with ${otherPartyName} for ${subject} is confirmed.`,
    firstName: name,
    openingMessage: `Your session with ${otherPartyName} for ${subject} is confirmed.`,
    mainMessage: schedule
      ? `Scheduled:\n${schedule}\n\nPlease join the lesson a few minutes before the start time.`
      : "Please join the lesson a few minutes before the scheduled start time.",
    ...(paymentInfo
      ? {
          transaction: {
            referenceId: `BOOK-${Date.now()}`,
            date: today(),
            status: "Awaiting payment",
            amount: `PKR ${paymentInfo.amount.toLocaleString()}`,
          },
        }
      : {}),
    cta: { label: "View Booking", url: "https://tutorera.ac.pk/dashboard" },
    additionalInformation: paymentInfo
      ? `Please review the final payable amount of PKR ${paymentInfo.amount.toLocaleString()} and complete payment through the available authorized payment method. TUTORERA verifies payment server-side before treating the booking as paid.`
      : "Log in to your dashboard for full session details.",
    includeSecurityNotice: true,
  });
  return { subject: "TUTORERA® — Booking Confirmed with Session Details", html };
};

export const directBookingDeclinedEmail = (studentName: string, subject: string) => {
  const html = renderTransactionalEmail({
    subject: "TUTORERA® — Booking Request Declined",
    emailCategory: "Booking Update",
    emailHeading: "Booking Request Declined",
    emailSubheading: `Session: ${subject}`,
    firstName: studentName,
    openingMessage: `The tutor was unable to accept your booking request for ${subject}.`,
    mainMessage: "Don't worry — you can browse other tutors or send a new request anytime. TUTORERA has many qualified tutors available across every subject and level.",
    cta: { label: "Browse Tutors", url: "https://tutorera.ac.pk/tutors" },
    includeSecurityNotice: true,
  });
  return { subject: "TUTORERA® — Booking Request Declined", html };
};

export const reviewRequestEmail = (studentName: string, tutorName: string, subject: string, bookingId: string) => {
  const html = renderTransactionalEmail({
    subject: "TUTORERA® — How Was Your Session?",
    emailCategory: "Review Request",
    emailHeading: "How Was Your Session?",
    emailSubheading: `Your session with ${tutorName} has been completed.`,
    firstName: studentName,
    openingMessage: `Your ${subject} session with ${tutorName} has been marked as completed. We hope you had a great learning experience!`,
    mainMessage: "Your feedback helps other students make informed decisions and helps tutors improve their teaching. It only takes 2 minutes to share your experience.",
    cta: { label: "Leave a Review", url: `https://tutorera.ac.pk/reviews/${bookingId}` },
    additionalInformation: "Reviews are public and must follow our community guidelines. Thank you for being part of the TUTORERA community.",
    includeSecurityNotice: true,
    deliverability: "This transactional notification was sent because you completed a tutoring session on TUTORERA.",
  });
  return { subject: "TUTORERA® — How Was Your Session?", html };
};

export const adminNewUserSignupEmail = (data: {
  name: string;
  email: string;
  role: string;
  phone?: string;
  city?: string;
  country?: string;
  authProvider?: string;
  applicationId?: string;
}) => {
  const roleLabel = (data.role || "user").toUpperCase();
  const html = renderTransactionalEmail({
    subject: `[TUTORERA Admin] New ${roleLabel} Sign Up: ${data.name}`,
    emailCategory: "Platform Alert",
    emailHeading: `New ${roleLabel} Registered`,
    emailSubheading: `A new ${data.role} has joined TUTORERA.`,
    firstName: "Admin Team",
    openingMessage: `A new user registration event occurred on the TUTORERA platform.`,
    mainMessage: `User Details:
• Name: ${data.name}
• Email: ${data.email}
• Role: ${roleLabel}
• Phone: ${data.phone || "Not provided"}
• Location: ${data.city || "Not specified"}${data.country ? `, ${data.country}` : ""}
• Signup Method: ${data.authProvider === "google" ? "Google OAuth" : "Email & Password"}
${data.applicationId ? `• Tutor Application ID: ${data.applicationId}` : ""}`,
    transaction: {
      referenceId: data.applicationId || `USR-${Date.now()}`,
      date: today(),
      status: "Registered",
      amount: roleLabel,
    },
    cta: { label: "Open Admin Panel", url: "https://tutorera.ac.pk/admin" },
    additionalInformation: "Notification dispatched automatically to mentiserapk@gmail.com.",
    includeSecurityNotice: true,
  });
  return { subject: `[TUTORERA Admin] New ${roleLabel} Sign Up: ${data.name}`, html };
};

export const adminNewTuitionRequestEmail = (data: {
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  subject: string;
  level: string;
  teachingMode: string;
  countryName?: string;
  countryCode?: string;
  city?: string;
  area?: string;
  budget: number;
  currency: string;
  budgetPKR: number;
  pricingUnit: string;
  schedule?: string;
  description?: string;
  curriculum?: string;
}) => {
  const isHome = data.teachingMode === "in-person";
  const modeLabel = isHome ? "Home / In-Person Tuition" : data.teachingMode === "online" ? "Online Tuition" : "Hybrid (Online & Home)";
  const locationLabel = isHome
    ? `${data.city || "City N/A"}, ${data.area ? data.area + ", " : ""}${data.countryName || "Pakistan"}`
    : `${data.countryName || "Global"} (${data.city || "Online"})`;

  const budgetDisplay = data.currency !== "PKR"
    ? `${data.currency} ${data.budget.toLocaleString()} / ${data.pricingUnit} (~PKR ${data.budgetPKR.toLocaleString()} / ${data.pricingUnit})`
    : `PKR ${data.budget.toLocaleString()} / ${data.pricingUnit}`;

  const html = renderTransactionalEmail({
    subject: `[TUTORERA Alert] New ${isHome ? "🏠 Home Tuition" : "🌐 Tuition"} Request: ${data.subject} (${data.city || data.countryName || "Global"})`,
    emailCategory: "Tuition Request Alert",
    emailHeading: `New ${isHome ? "Home Tuition" : "Tuition"} Request Posted`,
    emailSubheading: `${data.subject} · ${data.level} · ${modeLabel}`,
    firstName: "Admin Team",
    openingMessage: `A student has just posted a new tuition requirement on TUTORERA.`,
    mainMessage: `Tuition Requirement Summary:
• Subject: ${data.subject}
• Academic Level: ${data.level}
• Curriculum: ${data.curriculum || "Standard"}
• Learning Mode: ${modeLabel}
• Target Location: ${locationLabel}
• Proposed Budget: ${budgetDisplay} (Charged in PKR)
• Preferred Schedule: ${data.schedule || "Flexible"}
• Student: ${data.studentName} (${data.studentEmail} · ${data.studentPhone || "No phone"})
${data.description ? `• Details: "${data.description}"` : ""}`,
    transaction: {
      referenceId: `REQ-${Date.now()}`,
      date: today(),
      status: "Published",
      amount: `PKR ${data.budgetPKR.toLocaleString()}`,
    },
    cta: { label: "Review in Marketplace", url: "https://tutorera.ac.pk/browse-requests" },
  additionalInformation: "Notification dispatched automatically to mentiserapk@gmail.com.",
  includeSecurityNotice: true,
});
return { subject: `[TUTORERA Alert] New ${isHome ? "🏠 Home Tuition" : "🌐 Tuition"} Request: ${data.subject} (${data.city || data.countryName || "Global"})`, html };
};

export const payoutProcessedEmail = (tutorName: string, amount: number, bookingId: string) => {
  const html = renderTransactionalEmail({
    subject: "TUTORERA® — Payout Processed",
    emailCategory: "Payout",
    emailHeading: "Payout Processed",
    emailSubheading: "Your earnings have been released.",
    firstName: tutorName,
    openingMessage: `We've processed a payout of PKR ${amount.toLocaleString()} for a completed session.`,
    mainMessage: "The funds have been released and will be transferred to your registered payment method according to your payout schedule. You can track your earnings and payout history from your dashboard.",
    transaction: {
      referenceId: bookingId,
      date: today(),
      status: "Paid",
      amount: `PKR ${amount.toLocaleString()}`,
    },
    cta: { label: "View Earnings", url: "https://tutorera.ac.pk/earnings" },
    includeSecurityNotice: true,
    deliverability: "This transactional notification was sent because a payout was processed for your TUTORERA tutoring session.",
  });
  return { subject: "TUTORERA® — Payout Processed", html };
};

export const payoutFailedEmail = (tutorName: string, amount: number, bookingId: string, reason: string) => {
  const html = renderTransactionalEmail({
    subject: "TUTORERA® — Payout Update Required",
    emailCategory: "Payout",
    emailHeading: "Payout Update Required",
    emailSubheading: "We need your attention regarding a payout.",
    firstName: tutorName,
    openingMessage: `We attempted to process a payout of PKR ${amount.toLocaleString()} but encountered an issue.`,
    mainMessage: `Reason: ${reason}. Please update your payout details in your dashboard or contact support to resolve this.`,
    transaction: {
      referenceId: bookingId,
      date: today(),
      status: "Action Required",
      amount: `PKR ${amount.toLocaleString()}`,
    },
    cta: { label: "Update Payout Details", url: "https://tutorera.ac.pk/earnings" },
    additionalInformation: "If you believe this was an error, please reply to this email or contact hello@mentisera.pk.",
    includeSecurityNotice: true,
    deliverability: "This transactional notification was sent because a payout for your TUTORERA tutoring session requires attention.",
  });
  return { subject: "TUTORERA® — Payout Update Required", html };
};
