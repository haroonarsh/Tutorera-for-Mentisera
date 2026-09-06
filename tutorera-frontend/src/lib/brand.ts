export const BRAND_COLORS = {
  navy: "#021550",
  royalBlue: "#0329B2",
  brightBlue: "#016EF8",
  cyan: "#08BFFC",
  purple: "#7C1BEA",
  magenta: "#C81B7F",
  orange: "#F9691A",
  gold: "#FCB208",
} as const;

export const UI_COLORS = {
  primary: BRAND_COLORS.navy,
  accent: BRAND_COLORS.royalBlue,
  accentBright: BRAND_COLORS.brightBlue,
  cyan: BRAND_COLORS.cyan,
  purple: BRAND_COLORS.purple,
  magenta: BRAND_COLORS.magenta,
  orange: BRAND_COLORS.orange,
  gold: BRAND_COLORS.gold,
  gray500: "#64748B",
  gray600: "#475569",
  gray50: "#F5F7FF",
  surface: "#FFFFFF",
  card: "#F8FAFF",
  border: "#E2E8F0",
  accentLight: "#EEF5FF",
  error: "#DC2626",
  warning: BRAND_COLORS.gold,
  success: "#16A34A",
  sidebar: "#010B2C",
  sidebarBorder: "rgba(255, 255, 255, 0.1)",
  shadowCard: "0 8px 30px rgba(2, 21, 80, 0.08)",
  shadowCardHover: "0 12px 40px rgba(2, 21, 80, 0.12)",
  brandGradient: `linear-gradient(135deg, ${BRAND_COLORS.navy} 0%, ${BRAND_COLORS.royalBlue} 42%, ${BRAND_COLORS.brightBlue} 72%, ${BRAND_COLORS.cyan} 100%)`,
  accentGradient: `linear-gradient(135deg, ${BRAND_COLORS.royalBlue}, ${BRAND_COLORS.brightBlue})`,
  fullBrandGradient: `linear-gradient(135deg, ${BRAND_COLORS.navy}, ${BRAND_COLORS.royalBlue}, ${BRAND_COLORS.brightBlue}, ${BRAND_COLORS.cyan}, ${BRAND_COLORS.purple}, ${BRAND_COLORS.magenta}, ${BRAND_COLORS.orange}, ${BRAND_COLORS.gold})`,
} as const;

export const STATUS_COLORS = {
  success: { bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0" },
  warning: { bg: "#FFFBEB", color: "#92400E", border: "#FDE68A" },
  danger: { bg: "#FEF2F2", color: "#B91C1C", border: "#FECACA" },
  info: { bg: "#EEF5FF", color: BRAND_COLORS.royalBlue, border: "#BFDBFE" },
  neutral: { bg: "#F8FAFC", color: "#475569", border: "#E2E8F0" },
  purple: { bg: "#F5F3FF", color: "#6D28D9", border: "#DDD6FE" },
} as const;

export const TEXT_COLORS = {
  primary: "#021550", // Headings & brand text (very high contrast)
  body: "#0f172a", // Slate 900 primary body reading text (>13:1 AAA)
  secondary: "#334155", // Slate 700 readable secondary text (>9:1)
  muted: "#475569", // Slate 600 verified WCAG AA accessible muted text (>4.8:1)
  link: "#0329B2", // Royal blue interactive links (10.7:1)
  success: "#15803D",
  warning: "#92400E",
  danger: "#B91C1C",
} as const;

export const SPACING = {
  space1: "4px",
  space2: "8px",
  space3: "12px",
  space4: "16px",
  space5: "20px",
  space6: "24px",
  space8: "32px",
  space10: "40px",
  space12: "48px",
  space16: "64px",
  space20: "80px",
  space24: "96px",
} as const;

export const CONTAINERS = {
  wide: "1280px",
  default: "1180px",
  reading: "780px",
} as const;

export const TYPOGRAPHY = {
  displayXl: "clamp(2.5rem, 5vw, 4rem)",
  display: "clamp(2rem, 4vw, 3rem)",
  h1: "clamp(1.75rem, 3.5vw, 2.35rem)",
  h2: "clamp(1.35rem, 2.5vw, 1.75rem)",
  h3: "1.25rem",
  h4: "1.1rem",
  bodyLg: "1.125rem",
  body: "1rem",
  bodySm: "0.875rem",
  caption: "0.75rem",
} as const;

