import { escapeHtml } from "./escapeHtml";
import { renderBrandedEmail } from "./emailBrand";

interface CtaArgs {
  applicationId: string;
  statusUrl?: string;
}

const SITE_URL = "https://tutorera.ac.pk";
const trackingCta = (args: CtaArgs, label = "Track My Application") => `
  <div style="text-align:center;margin:24px 0 0;">
    <a href="${escapeHtml(args.statusUrl || `${SITE_URL}/tutor/application-status`)}" target="_blank"
      style="display:inline-block;background:#1a1a2e;color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;line-height:20px;padding:13px 22px;border-radius:999px;">${escapeHtml(label)}</a>
  </div>
  <p style="color:#6b7280;font-size:12px;margin-top:18px;">Application ID: <strong>${escapeHtml(args.applicationId)}</strong></p>
`;

function wrap(html: string, subject: string, category: string, preheader: string) {
  return renderBrandedEmail({ html, subject, category, preheader });
}

export const applicationSubmittedEmail = (
  tutorName: string,
  args: CtaArgs
) => {
  const subject = `Your application ${args.applicationId} has been received - TUTORERA`;
  const innerHtml = `
    <h2 style="color:#1a1a2e;margin:0 0 12px;">We've received your application ✅</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374151;">Thanks for applying to become a TUTORERA® tutor. Your application is now in our review queue. We will email you whenever your verification status changes.</p>
    <p style="color:#374151;">You can track the status of your application and your marketplace activation at any time using the link below.</p>
    ${trackingCta(args)}
  `;
  return { subject, html: wrap(innerHtml, subject, "Tutor Application", `Your application ${args.applicationId} has been received — check your dashboard for status.`) };
};

export const educationalDocumentsVerifiedEmail = (tutorName: string, args: CtaArgs) => {
  const subject = "Educational documents verified - TUTORERA";
  const innerHtml = `
    <h2 style="color:#16a34a;margin:0 0 12px;">Educational documents verified ✅</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374151;">Your educational documents have been reviewed and verified by our team.</p>
    ${trackingCta(args)}
  `;
  return { subject, html: wrap(innerHtml, subject, "Verification Update", "Your educational documents have been reviewed and verified.") };
};

export const educationalDocumentsRejectedEmail = (tutorName: string, reason: string, args: CtaArgs) => {
  const subject = "Educational documents need attention - TUTORERA";
  const innerHtml = `
    <h2 style="color:#d97706;margin:0 0 12px;">Educational documents need attention</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374151;">Our team could not verify your educational documents and is asking you to re-submit.</p>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;margin:16px 0;">
      <p style="color:#1f2937;margin:0 0 4px;font-weight:700;">Reason</p>
      <p style="color:#374151;margin:0;font-size:14px;">${escapeHtml(reason || "Please upload a clearer copy of your document.")}</p>
    </div>
    ${trackingCta(args, "Upload New Document")}
  `;
  return { subject, html: wrap(innerHtml, subject, "Action Required", "Your educational documents need attention — please re-submit.") };
};

export const cnicVerifiedEmail = (tutorName: string, args: CtaArgs) => {
  const subject = "ID verification complete - TUTORERA";
  const innerHtml = `
    <h2 style="color:#16a34a;margin:0 0 12px;">CNIC verification complete 🛡️</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374151;">Your CNIC has been successfully verified. Your TUTORERA® Verified Badge is now active.</p>
    ${trackingCta(args)}
  `;
  return { subject, html: wrap(innerHtml, subject, "Verification Update", "Your CNIC has been verified and your badge is now active.") };
};

export const cnicRejectedEmail = (tutorName: string, reason: string, args: CtaArgs) => {
  const subject = "ID verification needs attention - TUTORERA";
  const innerHtml = `
    <h2 style="color:#d97706;margin:0 0 12px;">CNIC verification needs attention</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374151;">We were unable to verify your CNIC. Please upload a clearer image.</p>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;margin:16px 0;">
      <p style="color:#1f2937;margin:0 0 4px;font-weight:700;">Reason</p>
      <p style="color:#374151;margin:0;font-size:14px;">${escapeHtml(reason || "Uploaded image was unclear. Please upload a clearer photo of your CNIC.")}</p>
    </div>
    ${trackingCta(args, "Upload New CNIC")}
  `;
  return { subject, html: wrap(innerHtml, subject, "Action Required", "Your CNIC needs attention — please re-upload a clearer image.") };
};

export const demoVideoApprovedEmail = (tutorName: string, args: CtaArgs) => {
  const subject = "Your demo video has been approved - TUTORERA";
  const innerHtml = `
    <h2 style="color:#16a34a;margin:0 0 12px;">Demo video approved 🎬</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374151;">Great work — your demo video has been reviewed and approved. It is now visible on your public tutor profile.</p>
    ${trackingCta(args)}
  `;
  return { subject, html: wrap(innerHtml, subject, "Verification Update", "Your demo video has been approved and is now live on your profile.") };
};

export const demoVideoRejectedEmail = (tutorName: string, reason: string, args: CtaArgs) => {
  const subject = "Demo video needs to be re-recorded - TUTORERA";
  const innerHtml = `
    <h2 style="color:#d97706;margin:0 0 12px;">Demo video needs to be re-recorded</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374151;">Your demo video was not accepted. Please re-record and re-submit.</p>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;margin:16px 0;">
      <p style="color:#1f2937;margin:0 0 4px;font-weight:700;">Reason</p>
      <p style="color:#374151;margin:0;font-size:14px;">${escapeHtml(reason || "Please record the video in a well-lit environment and clearly introduce the subjects you teach.")}</p>
    </div>
    ${trackingCta(args, "Upload New Demo Video")}
  `;
  return { subject, html: wrap(innerHtml, subject, "Action Required", "Your demo video needs to be re-recorded — please submit a new one.") };
};

export const policeVerifiedEmail = (tutorName: string, args: CtaArgs) => {
  const subject = "Police verification complete - TUTORERA";
  const innerHtml = `
    <h2 style="color:#16a34a;margin:0 0 12px;">Police verification approved 🛡️</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374151;">Your police verification has been approved. You may now offer Home and In-Person Tuition through TUTORERA®.</p>
    ${trackingCta(args)}
  `;
  return { subject, html: wrap(innerHtml, subject, "Verification Update", "Your police verification is complete — home and in-person tuition are now active.") };
};

export const policeRejectedEmail = (tutorName: string, reason: string, args: CtaArgs) => {
  const subject = "Police verification needs attention - TUTORERA";
  const innerHtml = `
    <h2 style="color:#d97706;margin:0 0 12px;">Police verification needs attention</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374151;">We could not approve your police verification. Please submit a fresh certificate.</p>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;margin:16px 0;">
      <p style="color:#1f2937;margin:0 0 4px;font-weight:700;">Reason</p>
      <p style="color:#374151;margin:0;font-size:14px;">${escapeHtml(reason || "Please submit a fresh police verification certificate.")}</p>
    </div>
    ${trackingCta(args, "Submit Police Verification")}
  `;
  return { subject, html: wrap(innerHtml, subject, "Action Required", "Your police verification needs attention — please submit a new certificate.") };
};

export const marketplaceActivatedEmail = (tutorName: string, args: CtaArgs) => {
  const subject = "You're live on the marketplace - TUTORERA";
  const innerHtml = `
    <h2 style="color:#16a34a;margin:0 0 12px;">You're live on the TUTORERA® marketplace 🚀</h2>
    <p style="color:#374151;">Congratulations, ${escapeHtml(tutorName)}! Your tutor profile is now active on the TUTORERA® marketplace. You may now receive tutoring opportunities and submit offers.</p>
    ${trackingCta(args, "View My Public Profile")}
  `;
  return { subject, html: wrap(innerHtml, subject, "Marketplace Update", `Congratulations ${tutorName} — your profile is now live on TUTORERA!`) };
};

export const marketplaceDeactivatedEmail = (tutorName: string, reason: string, args: CtaArgs) => {
  const subject = "Marketplace visibility paused - TUTORERA";
  const innerHtml = `
    <h2 style="color:#d97706;margin:0 0 12px;">Marketplace visibility paused</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374151;">Your marketplace visibility has been temporarily paused.</p>
    ${reason ? `<p style="color:#374151;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ""}
    ${trackingCta(args)}
  `;
  return { subject, html: wrap(innerHtml, subject, "Marketplace Update", "Your marketplace visibility has been paused — check your dashboard for details.") };
};

export const homeTuitionActivatedEmail = (tutorName: string, args: CtaArgs) => {
  const subject = "Home tuition cleared - TUTORERA";
  const innerHtml = `
    <h2 style="color:#16a34a;margin:0 0 12px;">Home tuition approved 🏠</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374151;">Your police verification has been approved. You are now eligible to respond to Home and In-Person Tuition opportunities on TUTORERA®.</p>
    ${trackingCta(args)}
  `;
  return { subject, html: wrap(innerHtml, subject, "Verification Update", "Home tuition access has been approved — you're now eligible for in-person requests.") };
};

export const homeTuitionDeactivatedEmail = (tutorName: string, reason: string, args: CtaArgs) => {
  const subject = "Home tuition paused - TUTORERA";
  const innerHtml = `
    <h2 style="color:#d97706;margin:0 0 12px;">Home tuition paused</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374151;">Your home tuition access has been temporarily paused.</p>
    ${reason ? `<p style="color:#374151;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ""}
    ${trackingCta(args)}
  `;
  return { subject, html: wrap(innerHtml, subject, "Marketplace Update", "Your home tuition access has been paused — check your dashboard for details.") };
};

export const profileSuspendedEmail = (tutorName: string, reason: string, args: CtaArgs) => {
  const subject = "Your profile has been suspended - TUTORERA";
  const innerHtml = `
    <h2 style="color:#dc2626;margin:0 0 12px;">Your profile has been suspended</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374151;">Your tutor profile has been temporarily suspended while we resolve an issue.</p>
    ${reason ? `<p style="color:#374151;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ""}
    ${trackingCta(args)}
  `;
  return { subject, html: wrap(innerHtml, subject, "Profile Alert", "Your TUTORERA profile has been suspended — action may be required.") };
};

export const reVerificationRequiredEmail = (tutorName: string, reason: string, args: CtaArgs) => {
  const subject = "Re-verification required - TUTORERA";
  const innerHtml = `
    <h2 style="color:#d97706;margin:0 0 12px;">Re-verification required</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374151;">We need you to re-submit some of your verification documents.</p>
    ${reason ? `<p style="color:#374151;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ""}
    ${trackingCta(args, "Complete Verification")}
  `;
  return { subject, html: wrap(innerHtml, subject, "Action Required", "Re-verification is required — please complete your document re-submission.") };
};

export const trackingWelcomeEmail = (
  tutorName: string,
  args: CtaArgs & { trackingUrl: string }
) => {
  const subject = `Your tutor application ${args.applicationId} is being tracked - TUTORERA`;
  const innerHtml = `
    <h2 style="color:#1a1a2e;margin:0 0 12px;">Application received ✅</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374171;">Your Tutorera tutor application has been received.</p>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 16px;margin:16px 0;">
      <p style="color:#1f2937;margin:0 0 4px;font-weight:700;">Application ID</p>
      <p style="color:#1a1a2e;margin:0;font-size:18px;font-weight:800;letter-spacing:0.04em;">${escapeHtml(args.applicationId)}</p>
    </div>
    <p style="color:#374151;">You can track your verification and marketplace activation status at any time using the secure link below.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${escapeHtml(args.trackingUrl)}" target="_blank"
        style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;line-height:20px;padding:13px 22px;border-radius:999px;">Track Application</a>
    </div>
    <p style="color:#6b7280;font-size:12px;">You are signed in to your account, so you can also view your application status at any time from your Tutorera dashboard.</p>
  `;
  return { subject, html: wrap(innerHtml, subject, "Tutor Application", `Your application ${args.applicationId} is being tracked — view your status now.`) };
};

export const documentResubmittedEmail = (tutorName: string, documentType: string, args: CtaArgs) => {
  const subject = `${documentType} re-submitted for review - TUTORERA`;
  const innerHtml = `
    <h2 style="color:#1a1a2e;margin:0 0 12px;">${documentType} re-submitted ✅</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374151;">We have received your updated ${documentType}. Our team will review it shortly and update your verification status.</p>
    <p style="color:#374151;">You can track the status of your application at any time using the link below.</p>
    ${trackingCta(args)}
  `;
  return { subject, html: wrap(innerHtml, subject, "Verification Update", `Your ${documentType} has been received and is under review.`) };
};
