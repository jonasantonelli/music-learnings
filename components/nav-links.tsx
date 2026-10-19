"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { defineMessages } from "@/lib/i18n";
import { useLocalizedHref, useMessages } from "@/components/locale-provider";

const messages = defineMessages({
  en: { lessons: "Lessons", songs: "Songs", practice: "Practice", chordId: "Chord ID", chordIdShort: "Chord ID" },
  pt: { lessons: "Lições", songs: "Músicas", practice: "Prática", chordId: "Identificar acorde", chordIdShort: "Acordes" },
  es: { lessons: "Lecciones", songs: "Canciones", practice: "Práctica", chordId: "Identificar acorde", chordIdShort: "Acordes" },
});

// `short` is shown below sm, where the four links share one phone-width row.
const links = [
  { path: "/lessons", key: "lessons" },
  { path: "/songs", key: "songs" },
  { path: "/practice", key: "practice" },
  { path: "/chord-id", key: "chordId", short: "chordIdShort" },
] as const;

export function NavLinks() {
  const pathname = usePathname();
  const t = useMessages(messages);
  const localize = useLocalizedHref();

  return (
    <>
      {links.map((link) => {
        const href = localize(link.path);
        const label = t[link.key];
        const short = "short" in link ? t[link.short] : null;
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              // Below md the links share the full-width row equally.
              "flex-1 whitespace-nowrap rounded-control px-1.5 py-1.5 text-center text-sm transition-colors sm:px-3 md:flex-none dark:sm:px-3.5",
              active
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {short ? (
              <>
                <span className="sm:hidden">{short}</span>
                <span className="hidden sm:inline">{label}</span>
              </>
            ) : (
              label
            )}
          </Link>
        );
      })}
    </>
  );
}
