import { renderTransactionalEmail } from "./emailBrand";

function today() {
  return new Date().toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

export const tutorApplicationAbandonedEmail = (name: string, day: 1 | 3 | 7, step?: number) => {
  const subject = day === 1
    ? "Complete your TUTORERA tutor application"
    : day === 3
      ? "Your TUTORERA tutor application is still waiting"
      : "Last reminder: finish your TUTORERA tutor application";

  const html = renderTransactionalEmail({
    subject,
    emailCategory: "Tutor Application Reminder",
    emailHeading: day === 7 ? "Finish your tutor application" : "Continue your tutor application",
    emailSubheading: "Students can only discover approved, completed tutor profiles.",
    firstName: name,
    openingMessage: `You started your TUTORERA tutor application${step ? ` and reached step ${step}` : ""}, but it has not been submitted yet.`,
    mainMessage: "Complete your profile, education, experience, teaching preferences, and verification documents so the review team can process your application.",
    cta: { label: "Continue Application", url: "https://tutorera.ac.pk/onboarding/tutor" },
    includeSecurityNotice: true,
    deliverability: "This reminder was sent because you started a TUTORERA tutor application but have not submitted it yet.",
  });

  return { subject, html };
};

export const studentRequestAbandonedEmail = (name: string, day: 1 | 3 | 7, subjectName?: string) => {
  const subject = day === 1
    ? "Finish your TUTORERA tuition request"
    : day === 3
      ? "Still looking for a tutor?"
      : "Last reminder: post your tuition request";

  const html = renderTransactionalEmail({
    subject,
    emailCategory: "Tuition Request Reminder",
    emailHeading: day === 7 ? "Post your request when you are ready" : "Complete your tuition request",
    emailSubheading: "Verified tutors can only send offers after your request is published.",
    firstName: name,
    openingMessage: `You started a tuition request${subjectName ? ` for ${subjectName}` : ""}, but it has not been published yet.`,
    mainMessage: "Finish the subject, schedule, mode, and proposed PKR rate. Once published, eligible tutors can respond with offers and you can compare them safely.",
    cta: { label: "Continue Request", url: "https://tutorera.ac.pk/dashboard" },
    includeSecurityNotice: true,
    deliverability: "This reminder was sent because you started a TUTORERA tuition request but did not publish it.",
  });

  return { subject, html };
};

export const studentPaymentAbandonedEmail = (name: string, day: 1 | 3 | 7, tutorName?: string, amount?: number) => {
  const subject = day === 1
    ? "Complete payment to confirm your tutor booking"
    : day === 3
      ? "Your selected tutor booking is waiting"
      : "Last reminder: confirm your tutor booking";

  const html = renderTransactionalEmail({
    subject,
    emailCategory: "Booking Payment Reminder",
    emailHeading: "Complete payment to confirm booking",
    emailSubheading: "Your booking is only fully confirmed after payment is verified.",
    firstName: name,
    openingMessage: `You selected${tutorName ? ` ${tutorName}` : " a tutor"} but the booking payment is still pending.`,
    mainMessage: amount
      ? `Please complete the payable amount of PKR ${amount.toLocaleString()} through the available authorized payment method.`
      : "Please complete payment through the available authorized payment method so the tutoring session can be confirmed.",
    transaction: amount ? { referenceId: `PAY-REM-${Date.now()}`, date: today(), status: "Payment pending", amount: `PKR ${amount.toLocaleString()}` } : undefined,
    cta: { label: "View Booking", url: "https://tutorera.ac.pk/dashboard" },
    includeSecurityNotice: true,
    deliverability: "This reminder was sent because a TUTORERA booking payment is still pending.",
  });

  return { subject, html };
};
