import { defaultLocale, Locale } from "./config";
import { en } from "./messages/en";

const resources = { en } as const;
export function messages(locale: Locale = defaultLocale) { return resources[locale]; }
