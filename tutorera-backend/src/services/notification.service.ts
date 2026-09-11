import { NOTIFICATION_EVENT_REGISTRY, NotificationChannel } from "../utils/notificationRegistry";
import { EMAIL_EVENTS } from "../utils/emailEvents";
import sendEmail from "../utils/sendEmail";
import { sendNotification, ioInstance } from "../utils/socket";
import User from "../models/User.model";
// Import all specific email builders, assuming there's a mapper or we handle it based on templateId.
import * as templates from "../utils/emailTemplates";
import * as trackingTemplates from "../utils/trackingEmails";
import * as recoveryTemplates from "../utils/recoveryEmailTemplates";

export class NotificationService {
  static async publishEvent(userId: string, eventName: string, payload: any = {}): Promise<void> {
    const registryEntry = NOTIFICATION_EVENT_REGISTRY[eventName];
    
    if (!registryEntry) {
      console.warn(`[NotificationService] Event ${eventName} not found in registry.`);
      return;
    }

    try {
      const user = await User.findById(userId).select("email name role");
      if (!user) {
         console.error(`[NotificationService] User ${userId} not found for event ${eventName}.`);
         return;
      }

      // Check channels
      const { channels } = registryEntry;

      // 1. IN-APP CHANNEL
      if (channels.inApp) {
        // We map the payload directly to a notification
        // For standard events, payload should have { title, message, link, type }
        const notificationPayload = {
          title: payload.title || "Notification",
          message: payload.message || registryEntry.description,
          type: payload.type || "general",
          link: payload.link,
        };
        await sendNotification(ioInstance, userId, notificationPayload as any);
      }

      // 2. EMAIL CHANNEL
      if (channels.email) {
        if (registryEntry.templateId) {
          // Find template function from templates files based on templateId mapping.
          // Since the legacy functions are scattered across 3 files, we'll map them manually or generically.
          // For now, let's map commonly used events.
          const emailBuilder = this.getEmailBuilder(registryEntry.templateId);
          if (emailBuilder) {
             const { subject, html } = emailBuilder(user.name, payload);
             await sendEmail({ to: user.email, subject, html, eventType: eventName });
          } else {
             console.warn(`[NotificationService] No email template mapped for ${registryEntry.templateId}`);
          }
        } else {
          // Direct fallback if no explicit templateId but email is true
          if (payload.subject && payload.html) {
             await sendEmail({ to: user.email, subject: payload.subject, html: payload.html, eventType: eventName });
          }
        }
      }

      // 3. PUSH / SMS STUBS
      if (channels.push) {
        console.log(`[NotificationService] Stub: Dispatching Push notification for ${eventName} to user ${userId}`);
      }
      if (channels.sms) {
        console.log(`[NotificationService] Stub: Dispatching SMS notification for ${eventName} to user ${userId}`);
      }

    } catch (err) {
      console.error(`[NotificationService] Failed to publish event ${eventName}:`, err);
    }
  }

  private static getEmailBuilder(templateId: string): any {
    // This maps the templateId string from NOTIFICATION_EVENT_REGISTRY to the actual functions.
    // We will expand this as we audit the templates.
    const map: Record<string, Function> = {
      "auth_welcome": (name: string, payload: any) => {
        if (payload.role === "tutor") return templates.tutorWelcomeApplicationEmail(name, payload.applicationId || "TUT-PENDING", payload.trackingUrl);
        if (payload.role === "parent") return templates.parentWelcomeEmail(name);
        return templates.studentWelcomeEmail(name);
      },
      "auth_verify_email": () => { return {subject: "Verify", html: "..."} }, // Placeholder, logic is in auth controller
      "auth_otp_code": () => { return {subject: "OTP", html: "..."} }, // Placeholder
      "password_reset_code": (name: string, payload: any) => templates.passwordResetOtpEmail(name, payload.otp),
      "admin_new_user": (name: string, payload: any) => templates.adminNewUserSignupEmail(payload),
      // Mappings for tracking
      "tutor_approved": (name: string, payload: any) => {
          if (payload.document === "CNIC") return trackingTemplates.cnicVerifiedEmail(name, payload.ctaArgs);
          if (payload.document === "Degree") return trackingTemplates.educationalDocumentsVerifiedEmail(name, payload.ctaArgs);
          if (payload.document === "DemoVideo") return trackingTemplates.demoVideoApprovedEmail(name, payload.ctaArgs);
          if (payload.document === "Police") return trackingTemplates.policeVerifiedEmail(name, payload.ctaArgs);
          if (payload.document === "Marketplace") return trackingTemplates.marketplaceActivatedEmail(name, payload.ctaArgs);
          return trackingTemplates.educationalDocumentsVerifiedEmail(name, payload.ctaArgs); // fallback
      },
      "verification_rejected": (name: string, payload: any) => {
          if (payload.document === "CNIC") return trackingTemplates.cnicRejectedEmail(name, payload.reason, payload.ctaArgs);
          if (payload.document === "Degree") return trackingTemplates.educationalDocumentsRejectedEmail(name, payload.reason, payload.ctaArgs);
          if (payload.document === "DemoVideo") return trackingTemplates.demoVideoRejectedEmail(name, payload.reason, payload.ctaArgs);
          if (payload.document === "Police") return trackingTemplates.policeRejectedEmail(name, payload.reason, payload.ctaArgs);
          if (payload.document === "Marketplace") return trackingTemplates.marketplaceDeactivatedEmail(name, payload.reason, payload.ctaArgs);
          return trackingTemplates.educationalDocumentsRejectedEmail(name, payload.reason, payload.ctaArgs); // fallback
      },
      "home_tuition_approved": (name: string, payload: any) => trackingTemplates.homeTuitionActivatedEmail(name, payload.ctaArgs),
      "payment_receipt": (name: string, payload: any) => templates.paymentConfirmedEmail(name, payload.tutorName || "your tutor", payload.amount, payload),
      "payment_failed": (name: string, payload: any) => templates.paymentFailedEmail(name, payload.tutorName || "your tutor", payload.amount, payload),
      // Tutor side payment failed notification
      "payment_failed_tutor": (name: string, payload: any) => templates.paymentFailedNotifyTutorEmail(name, payload.studentName || "the student", payload.amount, payload),
      
      // Abandoned journey recovery templates
      "tutor_app_abandoned_24h": (name: string, payload: any) => recoveryTemplates.tutorApplicationAbandonedEmail(name, 1, payload.onboardingStep),
      "tutor_app_abandoned_72h": (name: string, payload: any) => recoveryTemplates.tutorApplicationAbandonedEmail(name, 3, payload.onboardingStep),
      "tutor_app_abandoned_168h": (name: string, payload: any) => recoveryTemplates.tutorApplicationAbandonedEmail(name, 7, payload.onboardingStep),
      
      "request_abandoned_6h": (name: string, payload: any) => recoveryTemplates.studentRequestAbandonedEmail(name, 0.25, payload.subjectName),
      "request_abandoned_24h": (name: string, payload: any) => recoveryTemplates.studentRequestAbandonedEmail(name, 1, payload.subjectName),
      "request_abandoned_72h": (name: string, payload: any) => recoveryTemplates.studentRequestAbandonedEmail(name, 3, payload.subjectName),
      "request_abandoned_168h": (name: string, payload: any) => recoveryTemplates.studentRequestAbandonedEmail(name, 7, payload.subjectName),
      
      "payment_abandoned_1h": (name: string, payload: any) => recoveryTemplates.studentPaymentAbandonedEmail(name, 1/24, payload.tutorName, payload.amount),
      "payment_abandoned_24h": (name: string, payload: any) => recoveryTemplates.studentPaymentAbandonedEmail(name, 1, payload.tutorName, payload.amount),
      "payment_abandoned_48h": (name: string, payload: any) => recoveryTemplates.studentPaymentAbandonedEmail(name, 2, payload.tutorName, payload.amount),
      "payment_abandoned_72h": (name: string, payload: any) => recoveryTemplates.studentPaymentAbandonedEmail(name, 3, payload.tutorName, payload.amount),
      "payment_abandoned_168h": (name: string, payload: any) => recoveryTemplates.studentPaymentAbandonedEmail(name, 7, payload.tutorName, payload.amount),
    };
    return map[templateId];
  }
}
