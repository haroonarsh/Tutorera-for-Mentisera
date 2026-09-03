import { Resend } from "resend";
import { renderBrandedEmail } from "./emailBrand";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  preheader?: string;
  category?: string;
}

const sendEmail = async (options: EmailOptions): Promise<void> => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: "TUTORERA® <noreply@tutorera.ac.pk>",
    to: options.to,
    subject: options.subject,
    html: renderBrandedEmail({
      subject: options.subject,
      html: options.html,
      preheader: options.preheader,
      category: options.category,
    }),
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

export default sendEmail;
