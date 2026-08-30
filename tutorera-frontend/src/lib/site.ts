export const SITE_URL = "https://tutorera.ac.pk";
export const SUPPORT_EMAIL = "support@tutorera.ac.pk";

// Keep fee calculations tied to one authoritative configuration.
export const PLATFORM_FEE_PERCENT = 20;
export const GST_ON_PLATFORM_FEE_PERCENT = 15;
export const GST_EFFECTIVE_PERCENT = (PLATFORM_FEE_PERCENT * GST_ON_PLATFORM_FEE_PERCENT) / 100;
export const TOTAL_FEE_PERCENT = PLATFORM_FEE_PERCENT + GST_EFFECTIVE_PERCENT;
