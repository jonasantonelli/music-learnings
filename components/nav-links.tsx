"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/lessons", label: "Lessons", match: "/lessons" },
  { href: "/songs", label: "Songs", match: "/songs" },
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
            className={cn(
              "text-sm transition-colors",
              active
                ? "text-accent-11 font-medium"
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
