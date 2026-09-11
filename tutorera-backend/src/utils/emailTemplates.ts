import { renderTransactionalEmail, DetailRow } from "./emailBrand";

export function today(): string {
  return new Date().toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatMoney(amount: number, currency = "PKR"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency || "PKR").toUpperCase(),
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${(currency || "PKR").toUpperCase()} ${amount.toLocaleString()}`;
  }
}

// ── 1. User Onboarding & Authentication ──────────────────────────────────────

export const studentWelcomeEmail = (name: string) => {
  const html = renderTransactionalEmail({
    subject: "Welcome to TUTORERA — Find Your Ideal Tutor",
    emailCategory: "Welcome",
    emailHeading: `Welcome to TUTORERA, ${name}!`,
    emailSubheading: "Your journey to academic excellence starts here.",
    firstName: name,
    openingMessage: "Thank you for joining TUTORERA. Whether you need personalized support mastering complex subjects, preparing for Cambridge/board exams, or building new skills, our network of vetted educators is here to help.",
    mainMessage: `Here is how to get started in 3 simple steps:

1. Post a Tuition Request — Tell us your subject, level, learning mode (online or home), and budget in 2 minutes. It is completely free.
2. Compare Verified Tutors — Receive custom offers from qualified tutors with transparent credentials, student reviews, and verified badges.
3. Learn with Confidence — Book your session backed by TUTORERA's 100% Satisfaction First-Session Guarantee.`,
    cta: { label: "Browse Qualified Tutors", url: "https://tutorera.ac.pk/tutors" },
    additionalInformation: "Need help right away? You can also post a tuition requirement at https://tutorera.ac.pk/post-request.",
    includeSecurityNotice: true,
    deliverability: "This email was sent because you registered for an account on TUTORERA.",
  });
  return { subject: "Welcome to TUTORERA — Find Your Ideal Tutor", html };
};

export const parentWelcomeEmail = (name: string) => {
  const html = renderTransactionalEmail({
    subject: "Welcome to TUTORERA — Trusted Tutoring for Your Child",
    emailCategory: "Welcome",
    emailHeading: `Welcome to TUTORERA, ${name}!`,
    emailSubheading: "Connecting families with verified, high-caliber educators.",
    firstName: name,
    openingMessage: "Thank you for choosing TUTORERA to support your child's education. We understand that safety, quality, and proven results are paramount for parents.",
    mainMessage: `Why thousands of parents trust TUTORERA:

• Rigorous Verification: Every tutor undergoes multi-stage verification including government identity checks (CNIC/Passport) and educational credential verification.
• Home & In-Person Safety: Tutors offering in-home lessons must clear mandatory character & police verification.
• Dedicated Parent Dashboard: Monitor your child's lessons, track scheduled hours, and view tutor notes all in one secure place.`,
    cta: { label: "Find a Tutor for Your Child", url: "https://tutorera.ac.pk/tutors" },
    additionalInformation: "Have questions or specific curriculum needs? Our academic advisory team is available at hello@mentisera.pk.",
    includeSecurityNotice: true,
    deliverability: "This email was sent because you registered as a parent on TUTORERA.",
  });
  return { subject: "Welcome to TUTORERA — Trusted Tutoring for Your Child", html };
};

export const tutorWelcomeApplicationEmail = (name: string, applicationId: string, trackingUrl?: string) => {
  const html = renderTransactionalEmail({
    subject: `Tutor Application Received — ID: ${applicationId}`,
    emailCategory: "Tutor Application",
    emailHeading: `Thanks for applying, ${name}!`,
    emailSubheading: `Your tutor application ${applicationId} has been received.`,
    firstName: name,
    openingMessage: "We have received your application to become an educator on TUTORERA. Our verification team is currently reviewing your profile and credentials.",
    mainMessage: "Once verified, your profile will become visible to thousands of students and parents across the marketplace. You will be able to receive direct booking requests and submit offers on student tuition posts.",
    detailsCard: {
      title: "Application Summary",
      rows: [
        { label: "Application ID", value: applicationId, highlight: true },
        { label: "Review Status", value: "Under Review", isStatus: true, statusVariant: "warning" },
        { label: "Estimated Turnaround", value: "24–48 Hours" },
      ],
    },
    cta: { label: "Track Application Status", url: trackingUrl || "https://tutorera.ac.pk/tutor/application-status" },
    additionalInformation: "Tip: To unlock Home and In-Person tuition opportunities, make sure to submit your police character certificate.",
    includeSecurityNotice: true,
    deliverability: "This notification was sent because you submitted a tutor application on TUTORERA.",
  });
  return { subject: `Tutor Application Received — ID: ${applicationId}`, html };
};

// Legacy alias for student welcome
export const welcomeEmail = (name: string) => studentWelcomeEmail(name);

export const tutorPendingEmail = (name: string) => {
  const html = renderTransactionalEmail({
    subject: "TUTORERA — Your Application is Under Review",
    emailCategory: "Tutor Application",
    emailHeading: "Thanks for applying, " + name + "!",
    emailSubheading: "Your tutor profile is currently pending verification.",
    firstName: name,
    openingMessage: "Our team is reviewing your application and will notify you once approved — usually within 24–48 hours.",
    mainMessage: "You'll be able to receive bookings once approved. In the meantime, you can log in to your dashboard to track your application status.",
    cta: { label: "Track Application", url: "https://tutorera.ac.pk/tutor/application-status" },
    includeSecurityNotice: true,
  });
  return { subject: "TUTORERA — Your Application is Under Review", html };
};

export const passwordResetOtpEmail = (name: string, otp: string) => {
  const html = renderTransactionalEmail({
    subject: "TUTORERA — Password Reset Code",
    emailCategory: "Account Security",
    emailHeading: "Reset Your Password",
    emailSubheading: "Use the 6-digit code below to reset your TUTORERA password.",
    firstName: name,
    openingMessage: "We received a request to reset the password associated with your TUTORERA account.",
    mainMessage: "Please enter the verification code below on the password reset page. This code expires in 10 minutes. If you did not request a password reset, you can safely ignore this email; your account remains completely secure.",
    highlightCode: {
      code: otp,
      label: "Password Reset Code",
      expiresIn: "10 minutes",
    },
    includeSecurityNotice: true,
    deliverability: "This security notification was sent in response to a password reset request on TUTORERA.",
  });
  return { subject: "TUTORERA — Password Reset Code", html };
};

// ── 2. Admin Operational Notifications ───────────────────────────────────────

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
  const location = `${data.city || "Not specified"}${data.country ? `, ${data.country}` : ""}`;
  const authProviderLabel = data.authProvider === "google" ? "Google OAuth" : "Email & Password";

  const rows = [
    { label: "Full Name", value: data.name, highlight: true },
    { label: "Email Address", value: data.email },
    { label: "Account Role", value: roleLabel, isStatus: true, statusVariant: "info" as const },
    { label: "Contact Phone", value: data.phone || "Not provided" },
    { label: "Location", value: location },
    { label: "Signup Method", value: authProviderLabel },
  ];

  if (data.applicationId) {
    rows.push({ label: "Tutor Application ID", value: data.applicationId, highlight: true });
  }

  const html = renderTransactionalEmail({
    subject: `[TUTORERA Admin] New ${roleLabel} Registered: ${data.name}`,
    emailCategory: "Admin Alert",
    emailHeading: `New ${roleLabel} Registered`,
    emailSubheading: `A new ${data.role} has joined the platform.`,
    firstName: "Admin Team",
    openingMessage: "A new user registration event occurred on TUTORERA.",
    mainMessage: "The user has completed account creation and is ready for onboarding or application review.",
    detailsCard: {
      title: "Registration Overview",
      rows,
    },
    cta: {
      label: data.applicationId ? "Review Application" : "Open Admin Panel",
      url: data.applicationId ? `https://tutorera.ac.pk/admin/applications` : "https://tutorera.ac.pk/admin",
    },
    additionalInformation: "Dispatched automatically to mentiserapk@gmail.com.",
    includeSecurityNotice: false, // Internal admin email: no consumer security box
  });

  return { subject: `[TUTORERA Admin] New ${roleLabel} Registered: ${data.name}`, html };
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
  const modeLabel = isHome ? "Home / In-Person" : data.teachingMode === "online" ? "Online" : "Hybrid (Online & Home)";
  const locationLabel = isHome
    ? `${data.city || "N/A"}${data.area ? `, ${data.area}` : ""}, ${data.countryName || "Pakistan"}`
    : `${data.countryName || "Global"} (${data.city || "Online"})`;

  const currency = data.currency || "PKR";
  const formattedBudget = `${formatMoney(data.budget, currency)} / ${data.pricingUnit || "hour"}`;

  const html = renderTransactionalEmail({
    subject: `[TUTORERA Admin] New Tuition Request: ${data.subject} (${data.city || data.countryName || "Global"})`,
    emailCategory: "Admin Alert",
    emailHeading: `New Tuition Requirement Posted`,
    emailSubheading: `${data.subject} · ${data.level} · ${modeLabel}`,
    firstName: "Admin Team",
    openingMessage: "A student has just posted a new tuition requirement on the TUTORERA marketplace.",
    mainMessage: data.description ? `Student Notes: "${data.description}"` : "The request is now live and awaiting tutor offers.",
    detailsCard: {
      title: "Tuition Requirement Details",
      rows: [
        { label: "Subject & Level", value: `${data.subject} (${data.level})`, highlight: true },
        { label: "Curriculum", value: data.curriculum || "Standard" },
        { label: "Learning Mode", value: modeLabel, isStatus: true, statusVariant: isHome ? "warning" : "info" },
        { label: "Target Location", value: locationLabel },
        { label: "Proposed Budget", value: formattedBudget, highlight: true },
        { label: "Preferred Schedule", value: data.schedule || "Flexible" },
        { label: "Student Contact", value: `${data.studentName} (${data.studentEmail}${data.studentPhone ? ` · ${data.studentPhone}` : ""})` },
      ],
    },
    cta: { label: "Review in Marketplace", url: "https://tutorera.ac.pk/browse-requests" },
    additionalInformation: "Dispatched automatically to mentiserapk@gmail.com.",
    includeSecurityNotice: false,
  });

  return { subject: `[TUTORERA Admin] New Tuition Request: ${data.subject} (${data.city || data.countryName || "Global"})`, html };
};

// ── 3. Verification & Tutor Lifecycle ────────────────────────────────────────

export const tutorApprovedEmail = (name: string) => {
  const html = renderTransactionalEmail({
    subject: "🎉 Your TUTORERA Profile is Approved!",
    emailCategory: "Tutor Application",
    emailHeading: "Your Tutor Profile is Approved!",
    emailSubheading: "You are now active and visible to students on the marketplace.",
    firstName: name,
    openingMessage: "Congratulations! Your tutor profile has been fully approved by the TUTORERA verification team.",
    mainMessage: "Your profile is now live. You can respond to tuition requests, send offers, and receive direct booking inquiries. To unlock Home & In-Person tuition, ensure your police verification certificate is submitted.",
    detailsCard: {
      title: "Marketplace Status",
      rows: [
        { label: "Verification Status", value: "Verified & Active", isStatus: true, statusVariant: "success" },
        { label: "Direct Bookings", value: "Enabled" },
        { label: "Online Tutoring", value: "Eligible" },
      ],
    },
    cta: { label: "Open Tutor Dashboard", url: "https://tutorera.ac.pk/dashboard" },
    includeSecurityNotice: true,
    deliverability: "This transactional email was sent because your TUTORERA tutor application was approved.",
  });
  return { subject: "🎉 Your TUTORERA Profile is Approved!", html };
};

export const tutorRejectedEmail = (name: string, reason?: string) => {
  const html = renderTransactionalEmail({
    subject: "TUTORERA — Update on Your Tutor Application",
    emailCategory: "Tutor Application",
    emailHeading: "Update on Your Application",
    emailSubheading: "Action is required to complete your verification.",
    firstName: name,
    openingMessage: "Our verification team has reviewed your tutor profile and requires updated information or clearer documentation before approving your application.",
    mainMessage: reason
      ? `Review Feedback: ${reason}`
      : "Some of your submitted documents could not be verified. You can update your profile and resubmit fresh documents anytime from your application tracking page.",
    detailsCard: {
      title: "Review Summary",
      rows: [
        { label: "Application Status", value: "Action Required", isStatus: true, statusVariant: "warning" },
        { label: "Reason", value: reason || "Document re-submission needed" },
      ],
    },
    cta: { label: "Review & Resubmit Documents", url: "https://tutorera.ac.pk/tutor/application-status" },
    additionalInformation: "Need help? Reply directly to this email or contact support at hello@mentisera.pk.",
    includeSecurityNotice: true,
  });
  return { subject: "TUTORERA — Update on Your Tutor Application", html };
};

// ── 4. Offers & Structured Negotiation ───────────────────────────────────────

export const newBidEmail = (studentName: string, amount: number, currency = "PKR") => {
  const formatted = formatMoney(amount, currency);
  const html = renderTransactionalEmail({
    subject: `New Tutor Offer for Your Tuition Request`,
    emailCategory: "Offer Update",
    emailHeading: "New Tutor Offer Received",
    emailSubheading: `A verified tutor sent an offer of ${formatted}.`,
    firstName: studentName,
    openingMessage: `A verified tutor has submitted an offer on your tuition requirement.`,
    mainMessage: "Log in to your dashboard to review the tutor's credentials, bio, proposed schedule, and message. You can accept the offer, propose a counter-offer, or decline directly from your Offers page.",
    detailsCard: {
      title: "Offer Summary",
      rows: [
        { label: "Proposed Rate", value: formatted, highlight: true },
        { label: "Status", value: "Pending Your Review", isStatus: true, statusVariant: "info" },
        { label: "Received Date", value: today() },
      ],
    },
    cta: { label: "Review Offer", url: "https://tutorera.ac.pk/offers" },
    includeSecurityNotice: true,
  });
  return { subject: `New Tutor Offer for Your Tuition Request`, html };
};

export const bidAcceptedEmail = (tutorName: string, studentName: string, amount: number, currency = "PKR") => {
  const formatted = formatMoney(amount, currency);
  const html = renderTransactionalEmail({
    subject: "Your Tutor Offer Was Accepted",
    emailCategory: "Offer Update",
    emailHeading: "Your Offer Was Accepted!",
    emailSubheading: "Great news — the student confirmed your proposed rate.",
    firstName: tutorName,
    openingMessage: `${studentName} has accepted your tutor offer. A booking has been initialized.`,
    mainMessage: "The student will now complete payment. Once payment is verified by TUTORERA, the session will be fully confirmed on your calendar.",
    detailsCard: {
      title: "Offer Details",
      rows: [
        { label: "Agreed Rate", value: formatted, highlight: true },
        { label: "Student Name", value: studentName },
        { label: "Booking Status", value: "Awaiting Payment", isStatus: true, statusVariant: "warning" },
      ],
    },
    cta: { label: "View My Offers", url: "https://tutorera.ac.pk/offers" },
    includeSecurityNotice: true,
    deliverability: "This transactional notification was sent because a student accepted your offer on TUTORERA.",
  });
  return { subject: "Your Tutor Offer Was Accepted", html };
};

export const offerCounterReceivedEmail = (data: {
  recipientName: string;
  senderName: string;
  subject: string;
  counterRate: number;
  currency?: string;
  isSenderTutor: boolean;
}) => {
  const currency = data.currency || "PKR";
  const formatted = formatMoney(data.counterRate, currency);
  const subjectLine = data.isSenderTutor
    ? `${data.senderName} Sent You a Counter-Offer`
    : `Student Sent a Counter-Offer for ${data.subject}`;

  const html = renderTransactionalEmail({
    subject: subjectLine,
    emailCategory: "Negotiation Update",
    emailHeading: "Counter-Offer Received",
    emailSubheading: `${data.senderName} proposed a new rate for ${data.subject}.`,
    firstName: data.recipientName,
    openingMessage: `${data.senderName} has submitted a counter-proposal on the tuition offer.`,
    mainMessage: "Please review the updated terms. You can accept the counter-offer to proceed with booking or respond with your own proposal.",
    detailsCard: {
      title: "Counter-Offer Summary",
      rows: [
        { label: "Subject", value: data.subject, highlight: true },
        { label: "Proposed Rate", value: formatted, highlight: true },
        { label: "Status", value: "Awaiting Your Response", isStatus: true, statusVariant: "warning" },
      ],
    },
    cta: { label: "Review Counter-Offer", url: "https://tutorera.ac.pk/offers" },
    includeSecurityNotice: true,
  });

  return { subject: subjectLine, html };
};

// ── 5. Bookings & Sessions ───────────────────────────────────────────────────

interface BookingSessionDetails {
  bookingId: string;
  subject?: string;
  schedule?: string;
  teachingMode?: string;
  sessionCount?: number;
  currency?: string;
}

export const bookingConfirmedEmail = (studentName: string, tutorName: string, amount: number, currency = "PKR") => {
  const formatted = formatMoney(amount, currency);
  const html = renderTransactionalEmail({
    subject: "Your TUTORERA Booking Is Confirmed",
    emailCategory: "Booking Confirmation",
    emailHeading: "Booking Confirmed",
    emailSubheading: `Your session with ${tutorName} is confirmed.`,
    firstName: studentName,
    openingMessage: `Your booking with ${tutorName} has been confirmed on the calendar.`,
    mainMessage: "Please ensure payment is completed through our secure gateway so your session slot is locked in. TUTORERA verifies payment server-side before treating a session as confirmed.",
    detailsCard: {
      title: "Booking Summary",
      rows: [
        { label: "Reference ID", value: `BOOK-${Date.now()}`, highlight: true },
        { label: "Tutor", value: tutorName },
        { label: "Date", value: today() },
        { label: "Total Payable", value: formatted, highlight: true },
        { label: "Status", value: "Confirmed", isStatus: true, statusVariant: "success" },
      ],
    },
    cta: { label: "View Booking Details", url: "https://tutorera.ac.pk/dashboard" },
    includeSecurityNotice: true,
    deliverability: "This transactional notification was sent because of activity associated with your TUTORERA booking.",
  });
  return { subject: "Your TUTORERA Booking Is Confirmed", html };
};

export const directBookingRequestEmail = (tutorName: string, studentName: string, subject: string) => {
  const html = renderTransactionalEmail({
    subject: `New Direct Booking Request from ${studentName}`,
    emailCategory: "Booking Request",
    emailHeading: "New Booking Request",
    emailSubheading: `${studentName} wants to book a session for ${subject}.`,
    firstName: tutorName,
    openingMessage: `${studentName} has sent you a direct booking request for ${subject}.`,
    mainMessage: "Log in to your dashboard to review the proposed schedule and accept or decline. Tutors who respond within 2 hours maintain a 98% booking conversion rate.",
    detailsCard: {
      title: "Request Summary",
      rows: [
        { label: "Student", value: studentName, highlight: true },
        { label: "Subject", value: subject },
        { label: "Status", value: "Pending Tutor Response", isStatus: true, statusVariant: "warning" },
      ],
    },
    cta: { label: "Review Booking Request", url: "https://tutorera.ac.pk/dashboard" },
    includeSecurityNotice: true,
  });
  return { subject: `New Direct Booking Request from ${studentName}`, html };
};

export const directBookingAcceptedEmail = (
  name: string,
  otherPartyName: string,
  subject: string,
  date?: string,
  startTime?: string,
  endTime?: string,
  paymentInfo?: { amount: number; currency?: string }
) => {
  const rows: DetailRow[] = [
    { label: "Subject", value: subject, highlight: true },
    { label: "With", value: otherPartyName },
  ];

  if (date) rows.push({ label: "Date", value: date });
  if (startTime && endTime) rows.push({ label: "Time", value: `${startTime} – ${endTime}` });

  if (paymentInfo) {
    const formatted = formatMoney(paymentInfo.amount, paymentInfo.currency || "PKR");
    rows.push({ label: "Total Amount", value: formatted, highlight: true });
    rows.push({ label: "Payment Status", value: "Awaiting Payment", isStatus: true, statusVariant: "warning" as const });
  }

  const html = renderTransactionalEmail({
    subject: `Booking Confirmed: ${subject} with ${otherPartyName}`,
    emailCategory: "Booking Confirmation",
    emailHeading: "Booking Confirmed",
    emailSubheading: `Your session for ${subject} is on the calendar.`,
    firstName: name,
    openingMessage: `Your tutoring session with ${otherPartyName} for ${subject} is confirmed.`,
    mainMessage: "Please join the lesson a few minutes before the scheduled start time. You can view session links and chat directly with your tutor from your dashboard.",
    detailsCard: {
      title: "Session Schedule",
      rows,
    },
    cta: { label: "View Booking", url: "https://tutorera.ac.pk/dashboard" },
    includeSecurityNotice: true,
  });
  return { subject: `Booking Confirmed: ${subject} with ${otherPartyName}`, html };
};

export const directBookingDeclinedEmail = (studentName: string, subject: string) => {
  const html = renderTransactionalEmail({
    subject: `Update on Your Booking Request for ${subject}`,
    emailCategory: "Booking Update",
    emailHeading: "Booking Request Update",
    emailSubheading: `The tutor was unavailable for ${subject}.`,
    firstName: studentName,
    openingMessage: `The tutor was unable to accept your booking request for ${subject} at this time.`,
    mainMessage: "Don't worry — we have many verified tutors available across every subject. You can browse other tutors or post a tuition requirement so qualified tutors can apply to you.",
    cta: { label: "Browse Other Tutors", url: "https://tutorera.ac.pk/tutors" },
    includeSecurityNotice: true,
  });
  return { subject: `Update on Your Booking Request for ${subject}`, html };
};

export const bookingCancelledEmail = (name: string, otherPartyName: string, subject?: string) => {
  const html = renderTransactionalEmail({
    subject: "Your Tutoring Session Was Cancelled",
    emailCategory: "Booking Update",
    emailHeading: "Booking Cancelled",
    emailSubheading: subject ? `Session: ${subject}` : "Tutoring session cancelled.",
    firstName: name,
    openingMessage: `Your booking with ${otherPartyName}${subject ? ` for ${subject}` : ""} has been cancelled.`,
    mainMessage: "If you have questions regarding cancellation policies or refunds, our support team is available 24/7. Where eligible, refunds are processed automatically back to your payment method within 3–5 business days.",
    cta: { label: "Contact Support", url: "mailto:hello@mentisera.pk" },
    includeSecurityNotice: true,
  });
  return { subject: "Your Tutoring Session Was Cancelled", html };
};

export const reviewRequestEmail = (studentName: string, tutorName: string, subject: string, bookingId: string) => {
  const html = renderTransactionalEmail({
    subject: `How Was Your ${subject} Session with ${tutorName}?`,
    emailCategory: "Review Request",
    emailHeading: "How Was Your Session?",
    emailSubheading: `Your session with ${tutorName} is completed.`,
    firstName: studentName,
    openingMessage: `Your ${subject} session with ${tutorName} has concluded. We hope it was an engaging and productive learning experience!`,
    mainMessage: "Your feedback helps maintain exceptional teaching standards on TUTORERA and guides other students finding the right mentor. It takes less than 2 minutes to leave a review.",
    cta: { label: "Leave a Review", url: `https://tutorera.ac.pk/reviews/${bookingId}` },
    includeSecurityNotice: true,
    deliverability: "This notification was sent because you completed a tutoring lesson on TUTORERA.",
  });
  return { subject: `How Was Your ${subject} Session with ${tutorName}?`, html };
};

// ── 6. Payments & Financial Transactions ─────────────────────────────────────

export const paymentConfirmedEmail = (
  studentName: string,
  tutorName: string,
  amount: number,
  details?: BookingSessionDetails
) => {
  const currency = details?.currency || "PKR";
  const formatted = formatMoney(amount, currency);
  const bookingId = details?.bookingId || `PAY-${Date.now()}`;
  const subjectPart = details?.subject ? ` — ${details.subject}` : "";

  const rows = [
    { label: "Receipt ID", value: bookingId, highlight: true },
    { label: "Tutor", value: tutorName },
    { label: "Amount Paid", value: formatted, highlight: true },
    { label: "Payment Status", value: "Confirmed", isStatus: true, statusVariant: "success" as const },
    { label: "Date", value: today() },
  ];

  if (details?.schedule) rows.push({ label: "Schedule", value: details.schedule });
  if (details?.teachingMode) rows.push({ label: "Mode", value: details.teachingMode });

  const html = renderTransactionalEmail({
    subject: `Payment Confirmed — Booking ${bookingId}`,
    emailCategory: "Payment Receipt",
    emailHeading: "Payment Confirmed",
    emailSubheading: `Your session with ${tutorName} is fully booked.`,
    firstName: studentName,
    openingMessage: `We have confirmed your payment of ${formatted} for your${subjectPart} tutoring session with ${tutorName}.`,
    mainMessage: "Your booking is locked in. Please join the lesson a few minutes before the scheduled start time. A full receipt is detailed below for your records.",
    detailsCard: {
      title: "Payment Receipt",
      rows,
    },
    cta: { label: "View Booking & Lesson Link", url: "https://tutorera.ac.pk/dashboard" },
    includeSecurityNotice: true,
    deliverability: "This transactional notification was sent because of payment activity on your TUTORERA account.",
  });
  return { subject: `Payment Confirmed — Booking ${bookingId}`, html };
};

export const paymentFailedEmail = (
  studentName: string,
  tutorName: string,
  amount: number,
  details?: BookingSessionDetails
) => {
  const currency = details?.currency || "PKR";
  const formatted = formatMoney(amount, currency);
  const bookingId = details?.bookingId || `PAY-${Date.now()}`;

  const html = renderTransactionalEmail({
    subject: "Payment Failed — Please Try Again",
    emailCategory: "Payment Alert",
    emailHeading: "Payment Unsuccessful",
    emailSubheading: "We couldn't process your payment for this session.",
    firstName: studentName,
    openingMessage: `We were unable to complete the payment of ${formatted} for your session with ${tutorName}.`,
    mainMessage: "This could be due to insufficient funds, 3D Secure verification timeout, or temporary gateway connectivity. Please retry your payment to keep your reserved session slot active.",
    detailsCard: {
      title: "Payment Summary",
      rows: [
        { label: "Reference ID", value: bookingId, highlight: true },
        { label: "Tutor", value: tutorName },
        { label: "Attempted Amount", value: formatted },
        { label: "Transaction Status", value: "Failed", isStatus: true, statusVariant: "danger" },
      ],
    },
    cta: { label: "Retry Payment Now", url: "https://tutorera.ac.pk/dashboard" },
    additionalInformation: "If the issue persists, try an alternative card or contact hello@mentisera.pk.",
    includeSecurityNotice: true,
  });
  return { subject: "Payment Failed — Please Try Again", html };
};

export const paymentFailedNotifyTutorEmail = (
  tutorName: string,
  studentName: string,
  amount: number,
  details?: BookingSessionDetails
) => {
  const currency = details?.currency || "PKR";
  const formatted = formatMoney(amount, currency);

  const html = renderTransactionalEmail({
    subject: `Student Payment Delayed for Booking with ${studentName}`,
    emailCategory: "Booking Update",
    emailHeading: "Student Payment Delayed",
    emailSubheading: `A payment attempt from ${studentName} was unsuccessful.`,
    firstName: tutorName,
    openingMessage: `The student's payment of ${formatted} for your session could not be processed.`,
    mainMessage: "We have notified the student with instructions to retry payment. The booking slot will be confirmed automatically once payment settles. No action is required from you at this time.",
    detailsCard: {
      title: "Booking Details",
      rows: [
        { label: "Student", value: studentName, highlight: true },
        { label: "Amount Pending", value: formatted },
        { label: "Status", value: "Awaiting Settlement", isStatus: true, statusVariant: "warning" },
      ],
    },
    cta: { label: "View Booking", url: "https://tutorera.ac.pk/dashboard" },
    includeSecurityNotice: false,
  });
  return { subject: `Student Payment Delayed for Booking with ${studentName}`, html };
};

// ── 7. Tutor Payouts ─────────────────────────────────────────────────────────

export const payoutRequestedEmail = (tutorName: string, amount: number, bookingId: string, currency = "PKR") => {
  const formatted = formatMoney(amount, currency);
  const html = renderTransactionalEmail({
    subject: "Payout Request Received",
    emailCategory: "Payout Update",
    emailHeading: "Payout Request Received",
    emailSubheading: "Your earnings withdrawal request is under review.",
    firstName: tutorName,
    openingMessage: `We have received your payout request for ${formatted}.`,
    mainMessage: "Our finance department reviews all payout requests to ensure lesson completion and compliance. We will notify you once funds are dispatched to your bank account.",
    detailsCard: {
      title: "Payout Details",
      rows: [
        { label: "Reference ID", value: bookingId, highlight: true },
        { label: "Requested Amount", value: formatted, highlight: true },
        { label: "Date", value: today() },
        { label: "Status", value: "Under Review", isStatus: true, statusVariant: "info" },
      ],
    },
    cta: { label: "Track Payout Status", url: "https://tutorera.ac.pk/earnings" },
    includeSecurityNotice: true,
  });
  return { subject: "Payout Request Received", html };
};

export const payoutProcessedEmail = (tutorName: string, amount: number, bookingId: string, currency = "PKR") => {
  const formatted = formatMoney(amount, currency);
  const html = renderTransactionalEmail({
    subject: "Your TUTORERA Payout Has Been Sent",
    emailCategory: "Payout Update",
    emailHeading: "Payout Processed",
    emailSubheading: "Your earnings have been dispatched.",
    firstName: tutorName,
    openingMessage: `We've processed your payout of ${formatted} for completed tutoring sessions.`,
    mainMessage: "The funds have been transferred to your registered bank account according to your standard settlement timeline. You can view all past payouts and transaction statements on your dashboard.",
    detailsCard: {
      title: "Settlement Summary",
      rows: [
        { label: "Reference ID", value: bookingId, highlight: true },
        { label: "Settled Amount", value: formatted, highlight: true },
        { label: "Status", value: "Transferred", isStatus: true, statusVariant: "success" },
        { label: "Processed Date", value: today() },
      ],
    },
    cta: { label: "View Earnings Statement", url: "https://tutorera.ac.pk/earnings" },
    includeSecurityNotice: true,
  });
  return { subject: "Your TUTORERA Payout Has Been Sent", html };
};

export const payoutFailedEmail = (tutorName: string, amount: number, bookingId: string, reason: string, currency = "PKR") => {
  const formatted = formatMoney(amount, currency);
  const html = renderTransactionalEmail({
    subject: "Action Required: We Couldn’t Complete Your Payout",
    emailCategory: "Payout Alert",
    emailHeading: "Payout Update Required",
    emailSubheading: "We encountered an issue processing your earnings transfer.",
    firstName: tutorName,
    openingMessage: `We attempted to transfer ${formatted} to your bank account but the transaction was returned by the banking gateway.`,
    mainMessage: `Bank Response: "${reason}". Please verify your IBAN/account number and bank branch details on your earnings page, or contact our finance team.`,
    detailsCard: {
      title: "Failed Payout Details",
      rows: [
        { label: "Reference ID", value: bookingId, highlight: true },
        { label: "Amount", value: formatted },
        { label: "Reason", value: reason },
        { label: "Status", value: "Action Required", isStatus: true, statusVariant: "danger" },
      ],
    },
    cta: { label: "Update Bank Details", url: "https://tutorera.ac.pk/earnings" },
    additionalInformation: "Need assistance? Reply to this email or reach us at hello@mentisera.pk.",
    includeSecurityNotice: true,
  });
  return { subject: "Action Required: We Couldn’t Complete Your Payout", html };
};

// ── 8. Marketplace Search & Lifecycle Alerts ────────────────────────────────

export const requestZeroOfferEmail = (studentName: string, subject: string) => {
  const html = renderTransactionalEmail({
    subject: `We’re Expanding the Search for Your ${subject} Tutor`,
    emailCategory: "Marketplace Update",
    emailHeading: `Expanding Search for ${subject}`,
    emailSubheading: "We're reaching out to top educators for your requirement.",
    firstName: studentName,
    openingMessage: `We noticed that you haven't received tutor offers on your ${subject} request yet.`,
    mainMessage: "To ensure you find the right educator, our matching team has broadened the notification radius to premier tutors matching your curriculum. You can also adjust your preferred budget or schedule anytime to attract more candidates.",
    cta: { label: "Review & Adjust Request", url: "https://tutorera.ac.pk/dashboard" },
    includeSecurityNotice: false,
  });
  return { subject: `We’re Expanding the Search for Your ${subject} Tutor`, html };
};

export const requestExpiringEmail = (studentName: string, subject: string) => {
  const html = renderTransactionalEmail({
    subject: `Your ${subject} Tuition Request Expires Soon`,
    emailCategory: "Request Alert",
    emailHeading: "Tuition Request Expiring",
    emailSubheading: `Your request for ${subject} will expire in 48 hours.`,
    firstName: studentName,
    openingMessage: `Your tuition requirement for ${subject} is scheduled to expire in 48 hours.`,
    mainMessage: "If you're still looking for an educator, you can keep your request active with a single click so tutors can continue sending proposals.",
    cta: { label: "Keep Request Active", url: "https://tutorera.ac.pk/dashboard" },
    includeSecurityNotice: false,
  });
  return { subject: `Your ${subject} Tuition Request Expires Soon`, html };
};
