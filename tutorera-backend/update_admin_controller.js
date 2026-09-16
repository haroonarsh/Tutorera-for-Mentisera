const fs = require('fs');
let content = fs.readFileSync('src/controllers/admin.controller.ts', 'utf8');

// Replace import
content = content.replace('import sendEmail from "../utils/sendEmail";', 'import { NotificationService } from "../services/notification.service";');

// Replace verifyTutor tutorApprovedEmail/tutorRejectedEmail
content = content.replace(
  /const \{ subject, html \} = status === "approved"\s*\n\s*\? tutorApprovedEmail\(tutorUser\.name\)\s*\n\s*: tutorRejectedEmail\(tutorUser\.name, reason\);\s*\n\s*await sendEmail\(\{ to: tutorUser\.email, subject, html \}\);/g,
  `if (status === "approved") {
      await NotificationService.publishEvent(tutorUser._id.toString(), "verification.approved", { document: "All", ctaArgs: { applicationId: tutorUser.applicationId || "TUT-PENDING" } });
    } else {
      await NotificationService.publishEvent(tutorUser._id.toString(), "verification.rejected", { reason: reason || "", ctaArgs: { applicationId: tutorUser.applicationId || "TUT-PENDING" } });
    }`
);

// Replace marketplaceActivatedEmail
content = content.replace(
  /const \{ subject, html \} = marketplaceActivatedEmail\(tutorUser\.name, cta\);\s*\n\s*await sendEmail\(\{ to: tutorUser\.email, subject, html \}\);/g,
  `await NotificationService.publishEvent(tutorUser._id.toString(), "verification.approved", { document: "Marketplace", ctaArgs: cta });`
);

// Replace marketplaceDeactivatedEmail
content = content.replace(
  /const \{ subject, html \} = marketplaceDeactivatedEmail\(tutorUser\.name, "Your marketplace access was paused because a verification requirement is no longer met\.", cta\);\s*\n\s*await sendEmail\(\{ to: tutorUser\.email, subject, html \}\);/g,
  `await NotificationService.publishEvent(tutorUser._id.toString(), "verification.rejected", { document: "Marketplace", reason: "Your marketplace access was paused because a verification requirement is no longer met.", ctaArgs: cta });`
);

// Replace homeTuitionActivatedEmail
content = content.replace(
  /const \{ subject, html \} = homeTuitionActivatedEmail\(tutorUser\.name, cta\);\s*\n\s*await sendEmail\(\{ to: tutorUser\.email, subject, html \}\);/g,
  `await NotificationService.publishEvent(tutorUser._id.toString(), "home_tuition_approved", { ctaArgs: cta });`
);

// Replace homeTuitionDeactivatedEmail
content = content.replace(
  /const \{ subject, html \} = homeTuitionDeactivatedEmail\(tutorUser\.name, "Your home tuition access was paused because a verification requirement is no longer met\.", cta\);\s*\n\s*await sendEmail\(\{ to: tutorUser\.email, subject, html \}\);/g,
  `await NotificationService.publishEvent(tutorUser._id.toString(), "verification.rejected", { document: "HomeTuition", reason: "Your home tuition access was paused because a verification requirement is no longer met.", ctaArgs: cta });`
);

// Replace paymentConfirmedEmail
content = content.replace(
  /const \{ subject, html \} = paymentConfirmedEmail\(studentUser\.name, "your tutor", Number\(amount\), \{\}\);\s*\n\s*await sendEmail\(\{ to: studentUser\.email, subject, html \}\);/g,
  `await NotificationService.publishEvent(studentUser._id.toString(), "payment_receipt", { tutorName: "your tutor", amount: Number(amount) });`
);

// Replace reviewRequestEmail
content = content.replace(
  /const reviewMail = reviewRequestEmail\(studentUser\.name, booking\.tutor\.name, booking\.subject\);\s*\n\s*await sendEmail\(\{ to: studentUser\.email, subject: reviewMail\.subject, html: reviewMail\.html, eventType: "review_requested", relatedEntityType: "Booking", relatedEntityId: booking\._id\.toString\(\) \}\);/g,
  `await NotificationService.publishEvent(studentUser._id.toString(), "review_requested", { tutorName: booking.tutor.name, subject: booking.subject });`
);

fs.writeFileSync('src/controllers/admin.controller.ts', content);
console.log('Replacements complete');
