import { tutorApplicationCompletionReminderEmail } from "../utils/recoveryEmailTemplates";
import { bookingConfirmedEmail } from "../utils/emailTemplates";

describe("Email Templates Formatting and Rendering Suite", () => {
  it("renders tutorApplicationCompletionReminderEmail as structured HTML without escaping tags", () => {
    const missingItems = [
      { label: "Qualification and educational document", href: "/onboarding/tutor?step=2" },
      { label: "Submit teaching subjects and levels for admin approval", href: "/onboarding/tutor?step=3" },
      { label: "Profile, hourly rate, and availability", href: "/onboarding/tutor?step=4" },
      { label: "Background and safety document for Home Tuition", href: "/onboarding/tutor?step=5" },
    ];

    const { subject, html } = tutorApplicationCompletionReminderEmail("Shahid Hussain Soomro", missingItems);

    expect(subject).toBe("Complete your tutor application - TUTORERA");

    // CRITICAL BUG VERIFICATION: The HTML must NEVER contain escaped raw HTML tags
    expect(html).not.toContain("&lt;ul");
    expect(html).not.toContain("&lt;li");
    expect(html).not.toContain("&lt;a");
    expect(html).not.toContain("&gt;");

    // Must contain greeting and personal name
    expect(html).toContain("Shahid Hussain Soomro");

    // Must contain structured action card and action links
    expect(html).toContain("Pending Application Items");
    expect(html).toContain("Qualification and educational document");
    expect(html).toContain("Submit teaching subjects and levels for admin approval");
    expect(html).toContain("https://tutorera.ac.pk/onboarding/tutor?step=2");
    expect(html).toContain("https://tutorera.ac.pk/onboarding/tutor?step=3");
    expect(html).toContain("Complete &rarr;");

    // Must contain branded CTA button
    expect(html).toContain("Continue Application");
  });

  it("bookingConfirmedEmail contains correct copy without typos", () => {
    const { html } = bookingConfirmedEmail("Ali Student", "Usman Tutor", 2500, "USD");
    expect(html).toContain("TUTORERA verifies payment server-side");
    expect(html).not.toContain(". verifies payment server-side");
  });
});
