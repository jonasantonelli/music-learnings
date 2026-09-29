"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/lessons", label: "Lessons", match: "/lessons" },
  { href: "/songs", label: "Songs", match: "/songs" },
  { href: "/chord-id", label: "Chord ID", match: "/chord-id" },
  { href: "/practice", label: "Practice", match: "/practice" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {links.map(({ href, label, match }) => {
        const active = pathname.startsWith(match);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-control px-2.5 py-1.5 text-sm transition-colors sm:px-3",
              active
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </>
  );
}
