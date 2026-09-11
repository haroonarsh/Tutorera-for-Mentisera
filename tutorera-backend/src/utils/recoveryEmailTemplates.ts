import { renderTransactionalEmail, DetailRow } from "./emailBrand";
import { formatMoney, today } from "./emailTemplates";

export const tutorApplicationAbandonedEmail = (name: string, stage: number, step?: number) => {
  const isFinal = stage >= 7;
  const isSecond = stage === 3 || stage === 2;

  const subject = isFinal
    ? "Continue Your TUTORERA Tutor Application When Ready"
    : isSecond
      ? "Your TUTORERA Tutor Application Is Waiting"
      : "Finish Your TUTORERA Tutor Application";

  const html = renderTransactionalEmail({
    subject,
    emailCategory: "Tutor Application",
    emailHeading: isFinal ? "Resume Your Tutor Application" : "Continue Your Application",
    emailSubheading: "Students can only discover approved, verified tutor profiles.",
    firstName: name,
    openingMessage: `You started your TUTORERA tutor application${step ? ` and reached step ${step}` : ""}, but have not submitted it for review yet.`,
    mainMessage: "Complete your profile, educational credentials, and teaching preferences so our verification team can review your profile and activate your marketplace listing.",
    detailsCard: {
      title: "What You'll Unlock Once Approved",
      rows: [
        { label: "Marketplace Visibility", value: "Verified Profile", isStatus: true, statusVariant: "success" },
        { label: "Student Inquiries", value: "Direct Bookings" },
        { label: "Tuition Posts", value: "Submit Custom Offers" },
        { label: "Earnings Payouts", value: "Direct Bank Transfer" },
      ],
    },
    cta: { label: "Resume Application", url: "https://tutorera.ac.pk/onboarding/tutor" },
    additionalInformation: "Need assistance with document uploads? Reply directly to this email or reach us at hello@mentisera.pk.",
    includeSecurityNotice: false, // Recovery emails should not display alarming fraud boxes
    deliverability: "This reminder was sent because you started a TUTORERA tutor application.",
  });

  return { subject, html };
};

export const studentRequestAbandonedEmail = (name: string, stage: number, subjectName?: string) => {
  const subjectDisplay = subjectName ? `for ${subjectName}` : "";
  const isFinal = stage >= 7 || stage === 3;
  const isSecond = stage === 2 || stage === 3;

  const subject = isFinal
    ? "Your Tutor Search Is Waiting — Continue When Ready"
    : isSecond
      ? `Still Looking for a ${subjectName || "Qualified"} Tutor?`
      : `Finish Your ${subjectName || "Tuition"} Request`;

  const html = renderTransactionalEmail({
    subject,
    emailCategory: "Tuition Requirement",
    emailHeading: isFinal ? "Your Tutor Search Is Waiting" : "Complete Your Tuition Request",
    emailSubheading: "Verified tutors can only send offers after your request is live.",
    firstName: name,
    openingMessage: `You started a tuition request ${subjectDisplay}, but it has not been published to the marketplace yet.`,
    mainMessage: "Finish specifying your subject, preferred schedule, and hourly budget in just 2 minutes. Once published, qualified tutors will send personalized offers for you to compare safely.",
    detailsCard: {
      title: "Why Post on TUTORERA",
      rows: [
        { label: "Cost to Post", value: "100% Free", isStatus: true, statusVariant: "success" },
        { label: "Tutor Vetting", value: "Identity & Credential Verified" },
        { label: "Student Guarantee", value: "First-Session Satisfaction Guarantee" },
      ],
    },
    cta: { label: "Continue Request", url: "https://tutorera.ac.pk/dashboard" },
    additionalInformation: "It only takes 2 minutes to publish your requirements and start receiving proposals.",
    includeSecurityNotice: false,
    deliverability: "This reminder was sent because you have an unpublished tuition request draft on TUTORERA.",
  });

  return { subject, html };
};

export const studentPaymentAbandonedEmail = (
  name: string,
  stage: number,
  tutorName?: string,
  amount?: number,
  currency = "PKR"
) => {
  const isFinal = stage >= 3;
  const isFirst = stage === 1;
  const formatted = amount ? formatMoney(amount, currency) : undefined;

  const subject = isFirst
    ? `Complete Payment to Confirm ${tutorName || "Your Tutor Booking"}`
    : isFinal
      ? "Your Booking Will Expire Soon"
      : "Your Selected Tutor Is Waiting for Confirmation";

  const rows: DetailRow[] = [
    { label: "Tutor", value: tutorName || "Selected Educator", highlight: true },
  ];
  if (formatted) {
    rows.push({ label: "Payable Amount", value: formatted, highlight: true });
  }
  rows.push({ label: "Payment Status", value: "Pending Confirmation", isStatus: true, statusVariant: "warning" });

  const html = renderTransactionalEmail({
    subject,
    emailCategory: "Booking Payment",
    emailHeading: "Complete Payment to Lock In Your Slot",
    emailSubheading: "Your tutor session slot is reserved pending payment.",
    firstName: name,
    openingMessage: `You selected${tutorName ? ` ${tutorName}` : " an educator"} on TUTORERA, but your booking payment has not been completed yet.`,
    mainMessage: formatted
      ? `Please complete your payment of ${formatted} through our secure gateway. Once completed, the session is locked into both calendars.`
      : "Please complete your payment through the authorized payment method to confirm your session.",
    detailsCard: {
      title: "Booking Summary",
      rows,
    },
    cta: { label: "Complete Payment Now", url: "https://tutorera.ac.pk/dashboard" },
    includeSecurityNotice: true, // Keep security notice for financial payment reminders
    deliverability: "This transactional reminder was sent because a TUTORERA booking payment is pending.",
  });

  return { subject, html };
};
