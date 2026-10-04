"use client";

import { createContext, useCallback, useContext } from "react";
import { defaultLocale, localizeHref, type Locale } from "@/lib/i18n";

const LocaleContext = createContext<Locale>(defaultLocale);

export function LocaleProvider({
  lang,
  children,
}: {
  lang: Locale;
  children: React.ReactNode;
}) {
  return <LocaleContext value={lang}>{children}</LocaleContext>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** Picks the current locale's strings from a `defineMessages` table. */
export function useMessages<T>(messages: Record<Locale, T>): T {
  return messages[useLocale()];
}

/** Returns a function that prefixes internal paths with the current locale. */
export function useLocalizedHref(): (href: string) => string {
  const lang = useLocale();
  return useCallback((href: string) => localizeHref(lang, href), [lang]);
}
