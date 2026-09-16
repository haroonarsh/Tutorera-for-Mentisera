"use client";

import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { I18nProvider } from "@/i18n/I18nProvider";
import { defaultLocale, isPublishedLocale } from "@/i18n/config";

/**
 * Applies a signed-in user's saved language preference to the existing i18n
 * provider. English remains the only published locale for launch; this bridge
 * keeps direction and locale state ready for a reviewed RTL locale later.
 */
export default function LocaleBridge({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // Do not expose an incomplete or unreviewed translation because a saved
  // market/profile preference happens to contain that language.  The saved
  // value remains intact for the forthcoming reviewed locale release.
  const locale = isPublishedLocale(user?.preferredLanguage)
    ? user!.preferredLanguage
    : defaultLocale;
  return <I18nProvider locale={locale}>{children}</I18nProvider>;
}
