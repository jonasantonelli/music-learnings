import { NextResponse, type NextRequest } from "next/server";
import {
  LOCALE_COOKIE,
  defaultLocale,
  hasLocale,
  localizeHref,
  locales,
  type Locale,
} from "@/lib/i18n";

// Picks the visitor's locale: an explicit choice saved by the language
// switcher wins, then the browser's Accept-Language preferences in q order.
function getLocale(request: NextRequest): Locale {
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  if (saved && hasLocale(saved)) return saved;

  const preferred = (request.headers.get("accept-language") ?? "")
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag.toLowerCase(), q: q ? Number(q.split("=")[1]) : 1 };
    })
    .filter((l) => l.tag && l.q > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of preferred) {
    const base = tag.split("-")[0];
    if (hasLocale(base)) return base;
  }
  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasPrefix = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (hasPrefix) return;

  request.nextUrl.pathname = localizeHref(getLocale(request), pathname);
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Skip Next internals and anything that looks like a file (favicon, pagefind…).
  matcher: ["/((?!_next|.*\\.[^/]+$).*)"],
};
