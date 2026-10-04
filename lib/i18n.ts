export const locales = ["en", "pt", "es"] as const;
export type Locale = (typeof locales)[number];

// English is the source language: content missing in another locale falls
// back to it, and visitors whose browser asks for none of the supported
// languages land on it.
export const defaultLocale: Locale = "en";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export const localeNames: Record<Locale, string> = {
  en: "English",
  pt: "Português",
  es: "Español",
};

export function hasLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Prefixes an app-internal path with the locale: ("pt", "/songs") → "/pt/songs". */
export function localizeHref(lang: Locale, href: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  return href === "/" ? `/${lang}` : `/${lang}${href}`;
}

/** Swaps the locale segment of a localized pathname: ("/en/songs", "es") → "/es/songs". */
export function switchLocalePath(pathname: string, lang: Locale): string {
  const [, first, ...rest] = pathname.split("/");
  const tail = hasLocale(first ?? "") ? rest : [first, ...rest].filter(Boolean);
  return localizeHref(lang, "/" + tail.join("/"));
}

/**
 * Declares one component's UI strings in every locale. English defines the
 * shape; the other locales must match it, so a missing key is a type error.
 * Values may be functions for strings with interpolation or plurals.
 */
export function defineMessages<T>(messages: {
  en: T;
  pt: NoInfer<T>;
  es: NoInfer<T>;
}): Record<Locale, T> {
  return messages;
}

/** BCP 47 tag for Intl APIs and the <html lang> attribute. */
export const htmlLang: Record<Locale, string> = {
  en: "en",
  pt: "pt-BR",
  es: "es",
};
