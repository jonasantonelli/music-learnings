import Link from "next/link";
import { Music } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavLinks } from "@/components/nav-links";
import { SiteSearch } from "@/components/site-search";
import { getSearchIndex } from "@/lib/search-index";

export function SiteHeader() {
  const searchItems = getSearchIndex();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur dark:bg-background/80">
      {/* Logo · centered nav · search + theme. The outer columns share the
          leftover width equally so the nav sits in the true center. */}
      <div className="grid h-16 grid-cols-[auto_1fr_auto] items-center gap-2 px-4 sm:gap-3 sm:px-6 md:grid-cols-[1fr_auto_1fr] md:px-8 dark:h-[68px]">
        <Link
          href="/"
          className="flex items-center gap-2.5 justify-self-start font-display text-[15px] dark:text-[17px]"
        >
          <span
            aria-hidden
            className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-accent-9 text-accent-contrast dark:h-[26px] dark:w-[26px] dark:rounded-lg"
          >
            <Music className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          <span className="hidden lg:inline">Music Learnings</span>
        </Link>

        <nav
          aria-label="Main"
          className="flex min-w-0 max-w-full items-center gap-0.5 justify-self-start overflow-x-auto rounded-control p-1 [scrollbar-width:none] md:justify-self-center dark:border dark:border-border dark:bg-card"
        >
          <NavLinks />
        </nav>

        <div className="flex items-center gap-2 justify-self-end">
          <SiteSearch items={searchItems} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
