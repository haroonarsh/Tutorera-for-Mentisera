import { escapeHtml } from "./escapeHtml";

const SITE_URL = "https://tutorera.ac.pk";
const LOGO_URL = `${SITE_URL}/tutorera-logo-transparent.png`;
const SUPPORT_EMAIL = "hello@mentisera.pk";
const BRAND_NAME = "TUTORERA";
const REG_NAME = "®";
const CURRENT_YEAR = new Date().getFullYear();

const COLORS = {
  background: "#F5F7FF",
  deepNavy: "#021550",
  royalBlue: "#0329B2",
  brightBlue: "#016EF8",
  cyan: "#08BFFC",
  purple: "#7C1BEA",
  magenta: "#C81B7F",
  orange: "#F9691A",
  gold: "#FCB208",
  text: "#1F2937",
  muted: "#64748B",
  body: "#475569",
  border: "#E0E8FF",
  card: "#F8FAFF",
  cardBorder: "#E0E8FF",
  cardDivider: "#E8EDF8",
  preheader: "#94A3B8",
  footerBg: "#F7F9FF",
  footerTopBorder: "#E7ECF7",
  footerDeep: "#021550",
  footerText: "#CBD5E1",
  footerMuted: "#94A3B8",
  securityBg: "#FFF9ED",
  securityBorder: "#FDE5B1",
  securityLeft: "#FCB208",
  securityTitle: "#8A5800",
  securityBody: "#795C23",
  buttonShadow: "rgba(3,41,178,0.20)",
};

const BRAND_GRADIENT = `linear-gradient(90deg,${COLORS.royalBlue} 0%,${COLORS.brightBlue} 20%,${COLORS.cyan} 38%,${COLORS.purple} 58%,${COLORS.magenta} 72%,${COLORS.orange} 87%,${COLORS.gold} 100%)`;

const FOOTER_LINKS = [
  { label: "Website", href: `${SITE_URL}/` },
  { label: "Help", href: `${SITE_URL}/help` },
  { label: "Terms", href: `${SITE_URL}/terms` },
  { label: "Privacy", href: `${SITE_URL}/privacy` },
];

function stripHtml(input: string): string {
  return input
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface BrandedEmailOptions {
  subject: string;
  html: string;
  preheader?: string;
  category?: string;
}

export interface TransactionalEmailFields {
  emailCategory: string;
  emailHeading: string;
  emailSubheading?: string;
  firstName?: string;
  openingMessage: string;
  mainMessage: string;
  transaction?: {
    referenceId: string;
    date: string;
    status: string;
    amount: string;
  };
  cta?: {
    label: string;
    url: string;
  };
  additionalInformation?: string;
  includeSecurityNotice?: boolean;
  preheader?: string;
  subject: string;
  deliverability?: string;
}

function buildSecurityNotice(): string {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
      style="width:100%;margin-top:18px;background:${COLORS.securityBg};border:1px solid ${COLORS.securityBorder};border-left:4px solid ${COLORS.securityLeft};border-radius:9px;">
      <tr>
        <td style="padding:16px 18px;">
          <div style="margin-bottom:5px;color:${COLORS.securityTitle};font-size:13px;font-weight:800;">Security Reminder</div>
          <div style="color:${COLORS.securityBody};font-size:12px;line-height:20px;">
            TUTORERA will never ask you to share your password,
            OTP, PIN, card details, banking password or other
            confidential account credentials by email, WhatsApp
            or telephone.
          </div>
        </td>
      </tr>
    </table>`;
}

function buildHeader(): string {
  return `
    <tr>
      <td style="height:7px;padding:0;background:${BRAND_GRADIENT};"></td>
    </tr>
    <tr>
      <td align="center" style="padding:32px 25px 28px;background:${COLORS.deepNavy};">
        <a href="${SITE_URL}/" target="_blank" style="text-decoration:none;">
          <img src="${LOGO_URL}" width="210" alt="${BRAND_NAME} by MENTISERA" style="display:block;width:210px;max-width:78%;height:auto;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
          <div style="font-size:0;line-height:0;color:${COLORS.deepNavy};">${BRAND_NAME} by MENTISERA</div>
          <div style="margin-top:6px;font-size:11px;line-height:16px;font-weight:600;letter-spacing:2px;color:#9ddfff;text-transform:uppercase;">BY MENTISERA</div>
        </a>
      </td>
    </tr>`;
}

function buildCategory(category: string): string {
  return `
    <tr>
      <td align="center" style="padding:30px 35px 8px;">
        <span style="display:inline-block;padding:8px 15px;background:#eef5ff;border:1px solid #d9e8ff;border-radius:50px;color:${COLORS.royalBlue};font-size:11px;line-height:16px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;">${escapeHtml(category)}</span>
      </td>
    </tr>`;
}

function buildHelpRow(): string {
  return `
    <tr>
      <td style="padding:23px 35px;background:${COLORS.footerBg};border-top:1px solid ${COLORS.footerTopBorder};text-align:center;">
        <p style="margin:0 0 5px;color:${COLORS.muted};font-size:12px;line-height:20px;">Questions or need assistance?</p>
        <a href="mailto:${SUPPORT_EMAIL}" style="color:${COLORS.royalBlue};text-decoration:none;font-size:13px;font-weight:700;">${SUPPORT_EMAIL}</a>
      </td>
    </tr>`;
}

function buildFooter(): string {
  const links = FOOTER_LINKS.map((l, i) =>
    `<a href="${l.href}" style="color:${COLORS.cyan};text-decoration:none;">${l.label}</a>${i < FOOTER_LINKS.length - 1 ? `<span style="color:#64748b;"> &nbsp;•&nbsp; </span>` : ""}`
  ).join("");

  return `
    <tr>
      <td style="padding:30px 35px;background:${COLORS.footerDeep};text-align:center;">
        <div style="margin-bottom:5px;color:#ffffff;font-size:19px;font-weight:800;letter-spacing:0.8px;">${BRAND_NAME}<span style="color:${COLORS.cyan};">${REG_NAME}</span></div>
        <div style="margin-bottom:18px;color:#8edcff;font-size:10px;font-weight:600;letter-spacing:1.7px;text-transform:uppercase;">BY MENTISERA</div>
        <p style="margin:0 auto 17px;max-width:480px;color:${COLORS.footerText};font-size:11px;line-height:19px;">
          Pakistan's student-led digital tutoring marketplace connecting
          students and parents with qualified tutors for online and
          in-person educational support.
        </p>
        <p style="margin:0 0 15px;font-size:11px;line-height:20px;">${links}</p>
        <p style="margin:0;color:${COLORS.footerMuted};font-size:10px;line-height:17px;">
          TUTORERA${REG_NAME} is a digital tutoring marketplace operated by
          MENTISERA (SMC-Private) Limited.
        </p>
        <p style="margin:7px 0 0;color:${COLORS.footerMuted};font-size:10px;line-height:17px;">
          © ${CURRENT_YEAR} MENTISERA (SMC-Private) Limited.
          ${BRAND_NAME}${REG_NAME}. All rights reserved.
        </p>
      </td>
    </tr>
    <tr>
      <td style="height:5px;padding:0;background:${BRAND_GRADIENT};"></td>
    </tr>`;
}

function buildDeliverability(text: string): string {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;">
      <tr>
        <td align="center" style="padding:18px 25px;">
          <p style="margin:0;color:${COLORS.preheader};font-size:10px;line-height:17px;">${escapeHtml(text)}</p>
        </td>
      </tr>
    </table>`;
}

function buildShell({
  subject,
  preheader,
  innerContent,
  deliverability,
}: {
  subject: string;
  preheader: string;
  innerContent: string;
  deliverability: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.background};font-family:Arial, Helvetica, sans-serif;color:${COLORS.text};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:${COLORS.background};">
    <tr>
      <td align="center" style="padding:35px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 35px rgba(2,21,80,0.10);">
          ${innerContent}
        </table>
        ${buildDeliverability(deliverability)}
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const DEFAULT_DELIVERABILITY = "This transactional notification was sent because of activity associated with your TUTORERA account, tutoring request, offer, booking or payment.";

export function renderBrandedEmail(options: BrandedEmailOptions): string {
  if (options.html.includes("data-tutorera-branded-email=\"true\"")) {
    return options.html;
  }

  const preheader = options.preheader || stripHtml(options.html).slice(0, 150) || options.subject;
  const category = options.category || "TUTORERA Update";

  const innerContent = `
    ${buildHeader()}
    ${buildCategory(category)}
    <tr>
      <td style="padding:10px 42px 38px;color:${COLORS.text};font-size:15px;line-height:25px;">
        <div style="background:${COLORS.card};border:1px solid ${COLORS.cardBorder};border-radius:16px;padding:24px;">
          ${options.html}
        </div>
        <div style="text-align:center;margin-top:28px;">
          <a href="${SITE_URL}/dashboard" target="_blank" style="display:inline-block;background:${COLORS.royalBlue};color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;line-height:20px;padding:13px 22px;border-radius:999px;">Open TUTORERA</a>
        </div>
      </td>
    </tr>
    ${buildHelpRow()}
    ${buildFooter()}`;

  return buildShell({
    subject: options.subject,
    preheader,
    innerContent,
    deliverability: DEFAULT_DELIVERABILITY,
  });
}

export function renderTransactionalEmail(fields: TransactionalEmailFields): string {
  const preheader = fields.preheader || `${fields.emailHeading}. ${stripHtml(fields.openingMessage)}`.slice(0, 150);

  const heading = `<h1 style="margin:10px 0 10px;padding:0;color:${COLORS.deepNavy};font-size:27px;line-height:36px;font-weight:800;text-align:center;">${escapeHtml(fields.emailHeading)}</h1>`;
  const subheading = fields.emailSubheading
    ? `<p style="margin:0 0 28px;color:${COLORS.muted};font-size:14px;line-height:22px;text-align:center;">${escapeHtml(fields.emailSubheading)}</p>`
    : "";

  const greeting = fields.firstName
    ? `<p style="margin:0 0 18px;color:${COLORS.text};font-size:15px;line-height:25px;">Hello <strong style="color:${COLORS.deepNavy};">${escapeHtml(fields.firstName)}</strong>,</p>`
    : "";

  const txBlock = fields.transaction
    ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:5px 0 28px;background:${COLORS.card};border:1px solid ${COLORS.cardBorder};border-radius:14px;">
        <tr>
          <td style="padding:23px 24px;">
            <div style="margin-bottom:17px;color:${COLORS.deepNavy};font-size:13px;line-height:20px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;">Transaction Details</div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="padding:9px 0;border-bottom:1px solid ${COLORS.cardDivider};color:${COLORS.muted};font-size:13px;">Reference ID</td>
                <td align="right" style="padding:9px 0;border-bottom:1px solid ${COLORS.cardDivider};color:${COLORS.deepNavy};font-size:13px;font-weight:700;">${escapeHtml(fields.transaction.referenceId)}</td>
              </tr>
              <tr>
                <td style="padding:9px 0;border-bottom:1px solid ${COLORS.cardDivider};color:${COLORS.muted};font-size:13px;">Date</td>
                <td align="right" style="padding:9px 0;border-bottom:1px solid ${COLORS.cardDivider};color:#334155;font-size:13px;font-weight:600;">${escapeHtml(fields.transaction.date)}</td>
              </tr>
              <tr>
                <td style="padding:9px 0;border-bottom:1px solid ${COLORS.cardDivider};color:${COLORS.muted};font-size:13px;">Status</td>
                <td align="right" style="padding:9px 0;border-bottom:1px solid ${COLORS.cardDivider};color:${COLORS.royalBlue};font-size:13px;font-weight:700;">${escapeHtml(fields.transaction.status)}</td>
              </tr>
              <tr>
                <td style="padding:11px 0 0;color:${COLORS.muted};font-size:13px;">Amount</td>
                <td align="right" style="padding:11px 0 0;color:${COLORS.deepNavy};font-size:17px;font-weight:800;">${escapeHtml(fields.transaction.amount)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`
    : "";

  const ctaBlock = fields.cta
    ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td align="center" style="padding:2px 0 27px;">
            <a href="${escapeHtml(fields.cta.url)}" target="_blank" style="display:inline-block;padding:15px 32px;background:${COLORS.royalBlue};border-radius:9px;color:#ffffff;font-size:15px;line-height:20px;font-weight:700;text-decoration:none;box-shadow:0 6px 16px ${COLORS.buttonShadow};">${escapeHtml(fields.cta.label)} →</a>
          </td>
        </tr>
      </table>`
    : "";

  const additionalBlock = fields.additionalInformation
    ? `<p style="margin:0 0 22px;color:${COLORS.muted};font-size:13px;line-height:22px;">${escapeHtml(fields.additionalInformation)}</p>`
    : "";

  const security = fields.includeSecurityNotice ? buildSecurityNotice() : "";

  const body = `
    <tr>
      <td style="padding:10px 42px 38px;">
        ${heading}
        ${subheading}
        ${greeting}
        <p style="margin:0 0 18px;color:${COLORS.body};font-size:15px;line-height:25px;">${escapeHtml(fields.openingMessage)}</p>
        <p style="margin:0 0 26px;color:${COLORS.body};font-size:15px;line-height:25px;">${escapeHtml(fields.mainMessage)}</p>
        ${txBlock}
        ${ctaBlock}
        ${additionalBlock}
        ${security}
        <p style="margin:30px 0 0;color:#334155;font-size:14px;line-height:23px;">
          Regards,<br>
          <strong style="color:${COLORS.deepNavy};font-size:15px;">TUTORERA Team</strong><br>
          <span style="color:${COLORS.brightBlue};font-size:13px;font-weight:600;">A New Era of Tutoring</span>
        </p>
      </td>
    </tr>`;

  const innerContent = `
    ${buildHeader()}
    ${buildCategory(fields.emailCategory)}
    ${body}
    ${buildHelpRow()}
    ${buildFooter()}`;

  return buildShell({
    subject: fields.subject,
    preheader,
    innerContent,
    deliverability: fields.deliverability || DEFAULT_DELIVERABILITY,
  });
}
