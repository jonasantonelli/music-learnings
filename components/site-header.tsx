import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavLinks } from "@/components/nav-links";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-full bg-accent-9"
          />
          <span>
            Music <span className="text-accent-11">Learnings</span>
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          <NavLinks />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
