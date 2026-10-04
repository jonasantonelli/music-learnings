"use client";

import { usePathname } from "next/navigation";
import { Languages } from "lucide-react";
import {
  LOCALE_COOKIE,
  defineMessages,
  localeNames,
  locales,
  switchLocalePath,
  type Locale,
} from "@/lib/i18n";
import { useLocale, useMessages } from "@/components/locale-provider";

const messages = defineMessages({
  en: { label: "Language" },
  pt: { label: "Idioma" },
  es: { label: "Idioma" },
});

export function LanguageSwitcher() {
  const lang = useLocale();
  const t = useMessages(messages);
  const pathname = usePathname();

  const change = (next: Locale) => {
    // Remember the choice so the proxy sends unprefixed URLs here next time.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    // Full navigation, not router.push: [lang] is the root layout segment, and
    // remounting it client-side re-renders next-themes' inline <script>, which
    // React refuses to run (and warns about). A reload also resets <html lang>.
    window.location.assign(
      switchLocalePath(pathname, next) + window.location.search + window.location.hash,
    );
  };

  return (
    <label className="relative inline-flex h-9 shrink-0 items-center rounded-control border border-border bg-card text-foreground transition-colors hover:bg-muted">
      <span className="sr-only">{t.label}</span>
      <Languages
        aria-hidden
        className="pointer-events-none absolute left-2.5 h-4 w-4 text-muted-foreground"
      />
      <select
        value={lang}
        onChange={(e) => change(e.target.value as Locale)}
        className="h-full cursor-pointer appearance-none bg-transparent pl-8 pr-2.5 text-[13px] outline-none"
      >
        {locales.map((l) => (
          <option key={l} value={l} lang={l}>
            {localeNames[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
