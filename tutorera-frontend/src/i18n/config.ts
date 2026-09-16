/**
 * Public interface locales.  English is the only reviewed and published
 * locale for launch.  Keep RTL direction support below so a reviewed RTL
 * translation can be enabled without a layout rewrite.
 */
export const locales = ["en"] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = "en";
export const rtlLocales = new Set<string>(["ar", "ur"]);
export const directionFor = (locale: string): "rtl" | "ltr" => rtlLocales.has(locale) ? "rtl" : "ltr";

export const isPublishedLocale = (locale: string | undefined | null): locale is Locale =>
  Boolean(locale && locales.includes(locale as Locale));
