// src/i18n/index.ts
// Central i18n message loader — returns typed locale messages

import { defaultLocale, Locale } from "./config";
import { en } from "./messages/en";

const resources: Record<Locale, typeof en> = {
  en,
};

export function messages(locale: Locale = defaultLocale): typeof en {
  return resources[locale] ?? resources[defaultLocale];
}

export type { Messages } from "./messages/en";
