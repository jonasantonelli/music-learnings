import Link from "next/link";
import { Music } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavLinks } from "@/components/nav-links";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur dark:bg-background/80">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-display text-[15px] dark:text-base"
        >
          <span
            aria-hidden
            className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-accent-9 text-accent-contrast"
          >
            <Music className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          <span className="hidden sm:inline">Music Learnings</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-0.5 rounded-control p-1 dark:border dark:border-border dark:bg-card">
            <NavLinks />
          </div>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
