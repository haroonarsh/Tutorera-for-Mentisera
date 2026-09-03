import { escapeHtml } from "./escapeHtml";

interface CtaArgs {
  applicationId: string;
  statusUrl?: string;
}

const trackingCta = (args: CtaArgs, label = "Track My Application") => `
  <div style="text-align:center;margin:24px 0 0;">
    <a href="${escapeHtml(args.statusUrl || "https://tutorera.ac.pk/tutor/application-status")}" target="_blank"
      style="display:inline-block;background:#1a1a2e;color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;line-height:20px;padding:13px 22px;border-radius:999px;">${escapeHtml(label)}</a>
  </div>
  <p style="color:#6b7280;font-size:12px;margin-top:18px;">Application ID: <strong>${escapeHtml(args.applicationId)}</strong></p>
`;

export const applicationSubmittedEmail = (
  tutorName: string,
  args: CtaArgs
) => ({
  subject: `TUTORERA® — Your application ${args.applicationId} has been received`,
  html: `
    <h2 style="color:#1a1a2e;margin:0 0 12px;">We've received your application ✅</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374151;">Thanks for applying to become a TUTORERA® tutor. Your application is now in our review queue. We will email you whenever your verification status changes.</p>
    <p style="color:#374151;">You can track the status of your application and your marketplace activation at any time using the link below.</p>
    ${trackingCta(args)}
  `,
});

export const educationalDocumentsVerifiedEmail = (tutorName: string, args: CtaArgs) => ({
  subject: "TUTORERA® — Educational documents verified",
  html: `
    <h2 style="color:#16a34a;margin:0 0 12px;">Educational documents verified ✅</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374151;">Your educational documents have been reviewed and verified by our team.</p>
    ${trackingCta(args)}
  `,
});

export const educationalDocumentsRejectedEmail = (tutorName: string, reason: string, args: CtaArgs) => ({
  subject: "TUTORERA® — Educational documents need attention",
  html: `
    <h2 style="color:#d97706;margin:0 0 12px;">Educational documents need attention</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374151;">Our team could not verify your educational documents and is asking you to re-submit.</p>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;margin:16px 0;">
      <p style="color:#1f2937;margin:0 0 4px;font-weight:700;">Reason</p>
      <p style="color:#374151;margin:0;font-size:14px;">${escapeHtml(reason || "Please upload a clearer copy of your document.")}</p>
    </div>
    ${trackingCta(args, "Upload New Document")}
  `,
});

export const cnicVerifiedEmail = (tutorName: string, args: CtaArgs) => ({
  subject: "TUTORERA® — ID verification complete",
  html: `
    <h2 style="color:#16a34a;margin:0 0 12px;">CNIC verification complete 🛡️</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374151;">Your CNIC has been successfully verified. Your TUTORERA® Verified Badge is now active.</p>
    ${trackingCta(args)}
  `,
});

export const cnicRejectedEmail = (tutorName: string, reason: string, args: CtaArgs) => ({
  subject: "TUTORERA® — ID verification needs attention",
  html: `
    <h2 style="color:#d97706;margin:0 0 12px;">CNIC verification needs attention</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374151;">We were unable to verify your CNIC. Please upload a clearer image.</p>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;margin:16px 0;">
      <p style="color:#1f2937;margin:0 0 4px;font-weight:700;">Reason</p>
      <p style="color:#374151;margin:0;font-size:14px;">${escapeHtml(reason || "Uploaded image was unclear. Please upload a clearer photo of your CNIC.")}</p>
    </div>
    ${trackingCta(args, "Upload New CNIC")}
  `,
});

export const demoVideoApprovedEmail = (tutorName: string, args: CtaArgs) => ({
  subject: "TUTORERA® — Your demo video has been approved",
  html: `
    <h2 style="color:#16a34a;margin:0 0 12px;">Demo video approved 🎬</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374151;">Great work — your demo video has been reviewed and approved. It is now visible on your public tutor profile.</p>
    ${trackingCta(args)}
  `,
});

export const demoVideoRejectedEmail = (tutorName: string, reason: string, args: CtaArgs) => ({
  subject: "TUTORERA® — Demo video needs to be re-recorded",
  html: `
    <h2 style="color:#d97706;margin:0 0 12px;">Demo video needs to be re-recorded</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374151;">Your demo video was not accepted. Please re-record and re-submit.</p>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;margin:16px 0;">
      <p style="color:#1f2937;margin:0 0 4px;font-weight:700;">Reason</p>
      <p style="color:#374151;margin:0;font-size:14px;">${escapeHtml(reason || "Please record the video in a well-lit environment and clearly introduce the subjects you teach.")}</p>
    </div>
    ${trackingCta(args, "Upload New Demo Video")}
  `,
});

export const policeVerifiedEmail = (tutorName: string, args: CtaArgs) => ({
  subject: "TUTORERA® — Police verification complete",
  html: `
    <h2 style="color:#16a34a;margin:0 0 12px;">Police verification approved 🛡️</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374151;">Your police verification has been approved. You may now offer Home and In-Person Tuition through TUTORERA®.</p>
    ${trackingCta(args)}
  `,
});

export const policeRejectedEmail = (tutorName: string, reason: string, args: CtaArgs) => ({
  subject: "TUTORERA® — Police verification needs attention",
  html: `
    <h2 style="color:#d97706;margin:0 0 12px;">Police verification needs attention</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374151;">We could not approve your police verification. Please submit a fresh certificate.</p>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;margin:16px 0;">
      <p style="color:#1f2937;margin:0 0 4px;font-weight:700;">Reason</p>
      <p style="color:#374151;margin:0;font-size:14px;">${escapeHtml(reason || "Please submit a fresh police verification certificate.")}</p>
    </div>
    ${trackingCta(args, "Submit Police Verification")}
  `,
});

export const marketplaceActivatedEmail = (tutorName: string, args: CtaArgs) => ({
  subject: "🎉 You're live on the TUTORERA® marketplace",
  html: `
    <h2 style="color:#16a34a;margin:0 0 12px;">You're live on the TUTORERA® marketplace 🚀</h2>
    <p style="color:#374151;">Congratulations, ${escapeHtml(tutorName)}! Your tutor profile is now active on the TUTORERA® marketplace. You may now receive tutoring opportunities and submit offers.</p>
    ${trackingCta(args, "View My Public Profile")}
  `,
});

export const marketplaceDeactivatedEmail = (tutorName: string, reason: string, args: CtaArgs) => ({
  subject: "TUTORERA® — Marketplace visibility paused",
  html: `
    <h2 style="color:#d97706;margin:0 0 12px;">Marketplace visibility paused</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374151;">Your marketplace visibility has been temporarily paused.</p>
    ${reason ? `<p style="color:#374151;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ""}
    ${trackingCta(args)}
  `,
});

export const homeTuitionActivatedEmail = (tutorName: string, args: CtaArgs) => ({
  subject: "TUTORERA® — Home tuition cleared",
  html: `
    <h2 style="color:#16a34a;margin:0 0 12px;">Home tuition approved 🏠</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374151;">Your police verification has been approved. You are now eligible to respond to Home and In-Person Tuition opportunities on TUTORERA®.</p>
    ${trackingCta(args)}
  `,
});

export const homeTuitionDeactivatedEmail = (tutorName: string, reason: string, args: CtaArgs) => ({
  subject: "TUTORERA® — Home tuition paused",
  html: `
    <h2 style="color:#d97706;margin:0 0 12px;">Home tuition paused</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374151;">Your home tuition access has been temporarily paused.</p>
    ${reason ? `<p style="color:#374151;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ""}
    ${trackingCta(args)}
  `,
});

export const profileSuspendedEmail = (tutorName: string, reason: string, args: CtaArgs) => ({
  subject: "TUTORERA® — Your profile has been suspended",
  html: `
    <h2 style="color:#dc2626;margin:0 0 12px;">Your profile has been suspended</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374151;">Your tutor profile has been temporarily suspended while we resolve an issue.</p>
    ${reason ? `<p style="color:#374151;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ""}
    ${trackingCta(args)}
  `,
});

export const reVerificationRequiredEmail = (tutorName: string, reason: string, args: CtaArgs) => ({
  subject: "TUTORERA® — Re-verification required",
  html: `
    <h2 style="color:#d97706;margin:0 0 12px;">Re-verification required</h2>
    <p style="color:#374151;">Hi ${escapeHtml(tutorName)},</p>
    <p style="color:#374151;">We need you to re-submit some of your verification documents.</p>
    ${reason ? `<p style="color:#374151;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ""}
    ${trackingCta(args, "Complete Verification")}
  `,
});

export const trackingWelcomeEmail = (
  tutorName: string,
  args: CtaArgs & { trackingUrl: string }
) => ({
  subject: `TUTORERA® — Your tutor application ${args.applicationId} is being tracked`,
  html: `
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
  `,
});
