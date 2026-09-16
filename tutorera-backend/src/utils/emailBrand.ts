import { escapeHtml } from "./escapeHtml";

const SITE_URL = "https://tutorera.ac.pk";
const LOGO_URL = `${SITE_URL}/tutorera-logo-transparent.png`;
const SUPPORT_EMAIL = "hello@mentisera.pk";
const BRAND_NAME = "TUTORERA";
const REG_NAME = "®";
const CURRENT_YEAR = new Date().getFullYear();

export const COLORS = {
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
  body: "#334155",
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

export function formatEmailText(text: string): string {
  if (!text) return "";
  return escapeHtml(text).replace(/\n/g, "<br>");
}

export interface DetailRow {
  label: string;
  value: string;
  highlight?: boolean;
  isStatus?: boolean;
  statusVariant?: "success" | "warning" | "info" | "neutral" | "danger";
}

export interface DetailsCard {
  title: string;
  badge?: string;
  rows: DetailRow[];
}

export interface HighlightCodeConfig {
  code: string;
  label?: string;
  expiresIn?: string;
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
  highlightCode?: HighlightCodeConfig;
  detailsCard?: DetailsCard;
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
      style="width:100%;margin-top:20px;background:${COLORS.securityBg};border:1px solid ${COLORS.securityBorder};border-left:4px solid ${COLORS.securityLeft};border-radius:10px;">
      <tr>
        <td style="padding:14px 18px;">
          <div style="margin-bottom:4px;color:${COLORS.securityTitle};font-size:12px;font-weight:800;letter-spacing:0.3px;text-transform:uppercase;">Security Reminder</div>
          <div style="color:${COLORS.securityBody};font-size:12px;line-height:19px;">
            TUTORERA will never ask you to share your password,
            OTP, PIN, card details, or sensitive banking credentials by email,
            WhatsApp, or phone.
          </div>
        </td>
      </tr>
    </table>`;
}

function buildHeader(): string {
  return `
    <tr>
      <td style="height:5px;padding:0;background:${BRAND_GRADIENT};"></td>
    </tr>
    <tr>
      <td align="center" style="padding:22px 25px 18px;background:${COLORS.deepNavy};">
        <a href="${SITE_URL}/" target="_blank" style="text-decoration:none;display:inline-block;">
          <img src="${LOGO_URL}" width="140" height="42" alt="${BRAND_NAME}" style="display:block;width:auto;height:42px;max-height:46px;max-width:160px;margin:0 auto 6px;border:0;outline:none;text-decoration:none;">
          <div style="font-size:10px;line-height:14px;font-weight:700;letter-spacing:2px;color:#9ddfff;text-transform:uppercase;">BY MENTISERA</div>
        </a>
      </td>
    </tr>`;
}

function buildCategory(category: string): string {
  return `
    <tr>
      <td align="center" style="padding:26px 35px 6px;">
        <span style="display:inline-block;padding:6px 14px;background:#eef5ff;border:1px solid #d9e8ff;border-radius:50px;color:${COLORS.royalBlue};font-size:11px;line-height:16px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;">${escapeHtml(category)}</span>
      </td>
    </tr>`;
}

function buildHelpRow(): string {
  return `
    <tr>
      <td style="padding:22px 35px;background:${COLORS.footerBg};border-top:1px solid ${COLORS.footerTopBorder};text-align:center;">
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
      <td style="padding:28px 35px;background:${COLORS.footerDeep};text-align:center;">
        <div style="margin-bottom:4px;color:#ffffff;font-size:18px;font-weight:800;letter-spacing:0.8px;">${BRAND_NAME}<span style="color:${COLORS.cyan};">${REG_NAME}</span></div>
        <div style="margin-bottom:16px;color:#8edcff;font-size:10px;font-weight:600;letter-spacing:1.7px;text-transform:uppercase;">BY MENTISERA</div>
        <p style="margin:0 auto 16px;max-width:480px;color:${COLORS.footerText};font-size:11px;line-height:19px;">
          A global student-led digital tutoring marketplace connecting
          students and parents with qualified tutors for online learning
          and local in-person educational support where available.
        </p>
        <p style="margin:0 0 14px;font-size:11px;line-height:20px;">${links}</p>
        <p style="margin:0;color:${COLORS.footerMuted};font-size:10px;line-height:17px;">
          TUTORERA${REG_NAME} is a digital tutoring marketplace operated by
          MENTISERA (SMC-Private) Limited.
        </p>
        <p style="margin:6px 0 0;color:${COLORS.footerMuted};font-size:10px;line-height:17px;">
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
        <td align="center" style="padding:16px 25px;">
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
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" data-tutorera-branded-email="true" style="width:100%;max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(2,21,80,0.08);">
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
      <td style="padding:10px 38px 36px;color:${COLORS.text};font-size:15px;line-height:25px;">
        <div style="background:${COLORS.card};border:1px solid ${COLORS.cardBorder};border-radius:14px;padding:22px;">
          ${options.html}
        </div>
        <div style="text-align:center;margin-top:26px;">
          <a href="${SITE_URL}/dashboard" target="_blank" style="display:inline-block;background:${COLORS.royalBlue};color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;line-height:20px;padding:12px 24px;border-radius:999px;">Open TUTORERA</a>
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

function renderStatusBadge(status: string, variant?: "success" | "warning" | "info" | "neutral" | "danger"): string {
  const styles: Record<string, string> = {
    success: "background:#ecfdf5;color:#15803d;border:1px solid #bbf7d0;",
    warning: "background:#fffbeb;color:#b45309;border:1px solid #fde68a;",
    info: "background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;",
    neutral: "background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;",
    danger: "background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;",
  };
  const chosenStyle = styles[variant || "info"] || styles.info;
  return `<span style="display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700;line-height:16px;${chosenStyle}">${escapeHtml(status)}</span>`;
}

function buildDetailsCard(card: DetailsCard): string {
  if (!card.rows || card.rows.length === 0) return "";

  const rowsHtml = card.rows.map((row, idx) => {
    const isLast = idx === card.rows.length - 1;
    const borderBottom = isLast ? "" : `border-bottom:1px solid ${COLORS.cardDivider};`;

    let valueHtml = escapeHtml(row.value);
    if (row.isStatus || row.statusVariant) {
      valueHtml = renderStatusBadge(row.value, row.statusVariant);
    } else if (row.highlight) {
      valueHtml = `<strong style="color:${COLORS.deepNavy};font-size:14px;">${escapeHtml(row.value)}</strong>`;
    }

    return `
      <tr>
        <td style="padding:10px 0;${borderBottom}color:${COLORS.muted};font-size:13px;line-height:18px;vertical-align:top;width:40%;">${escapeHtml(row.label)}</td>
        <td align="right" style="padding:10px 0;${borderBottom}color:#1e293b;font-size:13px;line-height:18px;font-weight:600;vertical-align:top;width:60%;">${valueHtml}</td>
      </tr>`;
  }).join("");

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:14px 0 24px;background:${COLORS.card};border:1px solid ${COLORS.cardBorder};border-radius:14px;">
      <tr>
        <td style="padding:20px 22px;">
          <div style="margin-bottom:14px;color:${COLORS.deepNavy};font-size:13px;line-height:18px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;">${escapeHtml(card.title)}</div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            ${rowsHtml}
          </table>
        </td>
      </tr>
    </table>`;
}

function buildHighlightCode(config: HighlightCodeConfig): string {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:18px 0 22px;">
      <tr>
        <td align="center">
          <div style="display:inline-block;padding:18px 28px;background:#eff6ff;border:2px dashed #bfdbfe;border-radius:12px;text-align:center;">
            ${config.label ? `<div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${COLORS.muted};margin-bottom:6px;">${escapeHtml(config.label)}</div>` : ""}
            <div style="font-size:32px;font-weight:800;letter-spacing:8px;color:${COLORS.deepNavy};line-height:36px;font-family:Consolas, Monaco, 'Courier New', monospace;">${escapeHtml(config.code)}</div>
            ${config.expiresIn ? `<div style="font-size:11px;color:${COLORS.muted};margin-top:6px;">Expires in ${escapeHtml(config.expiresIn)}</div>` : ""}
          </div>
        </td>
      </tr>
    </table>`;
}

export function renderTransactionalEmail(fields: TransactionalEmailFields): string {
  const preheader = fields.preheader || `${fields.emailHeading}. ${stripHtml(fields.openingMessage)}`.slice(0, 150);

  const heading = `<h1 style="margin:8px 0 10px;padding:0;color:${COLORS.deepNavy};font-size:25px;line-height:34px;font-weight:800;text-align:center;">${escapeHtml(fields.emailHeading)}</h1>`;
  const subheading = fields.emailSubheading
    ? `<p style="margin:0 0 24px;color:${COLORS.muted};font-size:14px;line-height:22px;text-align:center;">${escapeHtml(fields.emailSubheading)}</p>`
    : "";

  const greeting = fields.firstName
    ? `<p style="margin:0 0 16px;color:${COLORS.text};font-size:15px;line-height:24px;">Hello <strong style="color:${COLORS.deepNavy};">${escapeHtml(fields.firstName)}</strong>,</p>`
    : "";

  // Details card: use explicit detailsCard if provided, or translate legacy transaction object
  let detailsCardHtml = "";
  if (fields.detailsCard) {
    detailsCardHtml = buildDetailsCard(fields.detailsCard);
  } else if (fields.transaction) {
    detailsCardHtml = buildDetailsCard({
      title: "Transaction Details",
      rows: [
        { label: "Reference ID", value: fields.transaction.referenceId, highlight: true },
        { label: "Date", value: fields.transaction.date },
        { label: "Status", value: fields.transaction.status, isStatus: true, statusVariant: "info" },
        { label: "Amount", value: fields.transaction.amount, highlight: true },
      ],
    });
  }

  const highlightCodeHtml = fields.highlightCode ? buildHighlightCode(fields.highlightCode) : "";

  const ctaBlock = fields.cta
    ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td align="center" style="padding:4px 0 24px;">
            <a href="${escapeHtml(fields.cta.url)}" target="_blank" style="display:inline-block;padding:14px 30px;background:${COLORS.royalBlue};border-radius:8px;color:#ffffff;font-size:14px;line-height:20px;font-weight:700;text-decoration:none;box-shadow:0 6px 16px ${COLORS.buttonShadow};">${escapeHtml(fields.cta.label)} →</a>
          </td>
        </tr>
      </table>`
    : "";

  const additionalBlock = fields.additionalInformation
    ? `<p style="margin:0 0 20px;color:${COLORS.muted};font-size:13px;line-height:21px;">${formatEmailText(fields.additionalInformation)}</p>`
    : "";

  const security = fields.includeSecurityNotice ? buildSecurityNotice() : "";

  const body = `
    <tr>
      <td style="padding:8px 38px 36px;">
        ${heading}
        ${subheading}
        ${greeting}
        <p style="margin:0 0 16px;color:${COLORS.body};font-size:15px;line-height:24px;">${formatEmailText(fields.openingMessage)}</p>
        <p style="margin:0 0 20px;color:${COLORS.body};font-size:15px;line-height:24px;">${formatEmailText(fields.mainMessage)}</p>
        ${highlightCodeHtml}
        ${detailsCardHtml}
        ${ctaBlock}
        ${additionalBlock}
        ${security}
        <p style="margin:26px 0 0;color:#334155;font-size:14px;line-height:22px;">
          Regards,<br>
          <strong style="color:${COLORS.deepNavy};font-size:14px;">TUTORERA Team</strong><br>
          <span style="color:${COLORS.brightBlue};font-size:12px;font-weight:600;">A New Era of Tutoring</span>
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
