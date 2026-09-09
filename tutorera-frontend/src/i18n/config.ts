export const locales = ["en", "ar"] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = "en";
export const rtlLocales = new Set<string>(["ar", "ur"]);
export const directionFor = (locale: string): "rtl" | "ltr" => rtlLocales.has(locale) ? "rtl" : "ltr";
