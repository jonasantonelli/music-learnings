import Link from "next/link";
import { Music } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NavLinks } from "@/components/nav-links";
import { SiteSearch } from "@/components/site-search";
import { getSearchIndex } from "@/lib/search-index";
import { defineMessages, localizeHref, type Locale } from "@/lib/i18n";

const messages = defineMessages({
  en: { main: "Main" },
  pt: { main: "Principal" },
  es: { main: "Principal" },
});

export function SiteHeader({ lang }: { lang: Locale }) {
  const searchItems = getSearchIndex(lang);

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur dark:bg-background/80">
      {/* md+: logo · centered nav · search + theme on one row, the outer
          columns sharing the leftover width so the nav sits in the true
          center. Below md the nav drops to its own full-width row. */}
      <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 px-4 sm:px-6 md:h-16 md:grid-cols-[1fr_auto_1fr] md:px-8 dark:md:h-[68px]">
        <Link
          href={localizeHref(lang, "/")}
          className="flex h-14 items-center gap-2.5 justify-self-start font-display text-[15px] md:h-auto dark:text-[17px]"
        >
          <span
            aria-hidden
            className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-accent-9 text-accent-contrast dark:h-[26px] dark:w-[26px] dark:rounded-lg"
          >
            <Music className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          <span className="md:hidden lg:inline">Music Learnings</span>
        </Link>

        <nav
          aria-label={messages[lang].main}
          className="col-span-2 row-start-2 mb-2 flex items-center gap-0.5 rounded-control p-1 md:col-span-1 md:col-start-2 md:row-start-1 md:mb-0 md:justify-self-center dark:border dark:border-border dark:bg-card"
        >
          <NavLinks />
        </nav>

        <div className="flex items-center gap-2 justify-self-end">
          <SiteSearch items={searchItems} />
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
