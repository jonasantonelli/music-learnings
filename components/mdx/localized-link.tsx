import Link from "next/link";
import type { ComponentProps } from "react";
import { localizeHref, type Locale } from "@/lib/i18n";

/**
 * MDX `a` override: content links to plain paths like `/lessons/...`, and
 * this prefixes them with the page's locale so readers stay in their language.
 */
export function localizedAnchor(lang: Locale) {
  return function LocalizedAnchor({ href = "", ...props }: ComponentProps<"a">) {
    if (href.startsWith("/") && !href.startsWith("//")) {
      return <Link href={localizeHref(lang, href)} {...props} />;
    }
    return <a href={href} {...props} />;
  };
}
