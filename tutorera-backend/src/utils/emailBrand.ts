import { escapeHtml } from "./escapeHtml";

const SITE_URL = "https://tutorera.ac.pk";
const LOGO_URL = `${SITE_URL}/tutorera-logo-transparent.png`;
const SUPPORT_EMAIL = "hello@mentisera.pk";

const COLORS = {
  deepNavy: "#021550",
  royalBlue: "#0329B2",
  brightBlue: "#016EF8",
  cyan: "#08BFFC",
  purple: "#7C1BEA",
  magenta: "#C81B7F",
  orange: "#F9691A",
  gold: "#FCB208",
  background: "#F5F7FF",
  card: "#F8FAFF",
  text: "#1F2937",
  muted: "#64748B",
  border: "#E0E8FF",
};

function stripHtml(input: string): string {
  return input
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function renderBrandedEmail(options: {
  subject: string;
  html: string;
  preheader?: string;
  category?: string;
}) {
  if (options.html.includes("data-tutorera-branded-email=\"true\"")) {
    return options.html;
  }

  const preheader = escapeHtml(options.preheader || stripHtml(options.html).slice(0, 150) || options.subject);
  const category = escapeHtml(options.category || "TUTORERA Update");
  const subject = escapeHtml(options.subject);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.background};font-family:Arial,Helvetica,sans-serif;color:${COLORS.text};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:${COLORS.background};">
    <tr>
      <td align="center" style="padding:35px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" data-tutorera-branded-email="true" style="width:100%;max-width:640px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 35px rgba(2,21,80,0.10);">
          <tr>
            <td style="height:7px;padding:0;background:linear-gradient(90deg,${COLORS.royalBlue} 0%,${COLORS.brightBlue} 20%,${COLORS.cyan} 38%,${COLORS.purple} 58%,${COLORS.magenta} 72%,${COLORS.orange} 87%,${COLORS.gold} 100%);"></td>
          </tr>
          <tr>
            <td align="center" style="padding:30px 25px 26px;background:${COLORS.deepNavy};">
              <a href="${SITE_URL}/" target="_blank" style="text-decoration:none;color:#ffffff;">
                <img src="${LOGO_URL}" width="210" alt="TUTORERA by MENTISERA" style="display:block;width:210px;max-width:78%;height:auto;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
                <div style="font-size:0;line-height:0;color:${COLORS.deepNavy};">TUTORERA by MENTISERA</div>
                <div style="margin-top:6px;font-size:11px;line-height:16px;font-weight:700;letter-spacing:2px;color:#9ddfff;text-transform:uppercase;">BY MENTISERA</div>
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:30px 35px 8px;">
              <span style="display:inline-block;padding:8px 15px;background:#eef5ff;border:1px solid #d9e8ff;border-radius:50px;color:${COLORS.royalBlue};font-size:11px;line-height:16px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;">${category}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 42px 38px;color:${COLORS.text};font-size:15px;line-height:25px;">
              <div style="background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:16px;padding:24px;">
                ${options.html}
              </div>
              <div style="text-align:center;margin-top:28px;">
                <a href="${SITE_URL}/dashboard" target="_blank" style="display:inline-block;background:${COLORS.royalBlue};color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;line-height:20px;padding:13px 22px;border-radius:999px;">Open TUTORERA</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 35px;background:${COLORS.deepNavy};text-align:center;color:#cbd5e1;font-size:12px;line-height:20px;">
              <p style="margin:0 0 8px;color:#ffffff;font-weight:800;">TUTORERA<span style="color:${COLORS.cyan};">®</span></p>
              <p style="margin:0;">Pakistan's student-led tutoring marketplace.</p>
              <p style="margin:8px 0 0;">Need help? <a href="mailto:${SUPPORT_EMAIL}" style="color:${COLORS.cyan};text-decoration:none;">${SUPPORT_EMAIL}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
