"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { TreeNode } from "@/lib/content";
import { TONE_DOTS, TONE_TEXT, sectionTone } from "@/lib/tones";
import { defineMessages } from "@/lib/i18n";
import { useMessages } from "@/components/locale-provider";

const messages = defineMessages({
  en: {
    lessons: "Lessons",
    menu: "Lessons menu",
    openMenu: "Open lessons menu",
    closeMenu: "Close lessons menu",
    close: "Close",
    navigation: "Lessons navigation",
  },
  pt: {
    lessons: "Lições",
    menu: "Menu de lições",
    openMenu: "Abrir menu de lições",
    closeMenu: "Fechar menu de lições",
    close: "Fechar",
    navigation: "Navegação das lições",
  },
  es: {
    lessons: "Lecciones",
    menu: "Menú de lecciones",
    openMenu: "Abrir menú de lecciones",
    closeMenu: "Cerrar menú de lecciones",
    close: "Cerrar",
    navigation: "Navegación de lecciones",
  },
});

function renderNode(
  node: TreeNode,
  depth: number,
  pathname: string,
  onNavigate: () => void,
): React.ReactNode {
  if (node.kind === "lesson") {
    const active = pathname === node.lesson.href;
    return (
      <li key={node.lesson.href}>
        <Link
          href={node.lesson.href}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex items-center justify-between gap-2 rounded-control px-3 py-1.5 text-sm transition-colors",
            active
              ? "bg-muted font-medium text-foreground dark:bg-accent-3 dark:text-accent-11"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
          )}
        >
          {node.lesson.frontmatter.title}
          {active && (
            <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-dot" />
          )}
        </Link>
      </li>
    );
  }

  const tone = sectionTone(node.slug.join("/"));
  return (
    <li key={node.slug.join("/")}>
      {depth === 0 ? (
        <div
          className={cn(
            "mt-5 mb-1.5 flex items-center gap-2 px-3 font-mono text-[11px] uppercase tracking-[0.08em]",
            TONE_TEXT[tone],
          )}
        >
          <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", TONE_DOTS[tone])} />
          {node.title}
        </div>
      ) : (
        <div className="mt-2 mb-1 px-3 text-[13px] font-medium text-foreground">
          {node.title}
        </div>
      )}
      <ul className="pl-2">
        {node.children.map((c) => renderNode(c, depth + 1, pathname, onNavigate))}
      </ul>
    </li>
  );
}

export function SidebarClient({ tree }: { tree: TreeNode[] }) {
  const pathname = usePathname();
  const t = useMessages(messages);
  const [open, setOpen] = useState(false);

  // Lock body scroll while drawer open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Two-way sticky for the desktop nav. Its sticky `top` shifts by each scroll
  // delta, clamped between "bottom of nav at bottom of viewport" and "just
  // under the header". Scrolling down it follows the page until its last item
  // shows, then stops; scrolling up it follows back at once, revealing the top.
  // A nav shorter than the viewport simply sticks under the header.
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const header = document.querySelector("header");
    let top = header?.offsetHeight ?? 0;
    let lastY = window.scrollY;

    const apply = (delta: number) => {
      const maxTop = header?.offsetHeight ?? 0;
      const minTop = Math.min(maxTop, window.innerHeight - nav.offsetHeight);
      top = Math.min(maxTop, Math.max(minTop, top - delta));
      nav.style.top = `${top}px`;
    };
    const onScroll = () => {
      const y = window.scrollY;
      apply(y - lastY);
      lastY = y;
    };
    const onResize = () => apply(0);

    apply(0);
    const observer = new ResizeObserver(onResize);
    observer.observe(nav);
    if (header) observer.observe(header);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const close = () => setOpen(false);

  const list = (
    <ul>{tree.map((n) => renderNode(n, 0, pathname, close))}</ul>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden inline-flex items-center gap-2 rounded-control border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:border-accent-7 transition-colors mx-4 sm:mx-6 mt-4"
        aria-label={t.openMenu}
        aria-expanded={open}
      >
        <span aria-hidden className="flex flex-col gap-[3px]">
          <span className="block h-0.5 w-4 bg-current" />
          <span className="block h-0.5 w-4 bg-current" />
          <span className="block h-0.5 w-4 bg-current" />
        </span>
        {t.menu}
      </button>

      {/* Desktop sidebar — the column keeps the border full height while the
          nav follows the scroll and stops once its end is visible. */}
      <div className="hidden md:block w-64 shrink-0 border-r border-border bg-card dark:bg-background">
        <nav
          ref={navRef}
          className="sticky top-16 px-3 py-4 dark:top-[68px]"
          aria-label={t.navigation}
        >
          {list}
        </nav>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-30">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={close}
            aria-hidden
          />
          <nav
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-border bg-background px-4 py-6 overflow-y-auto shadow-xl"
            aria-label={t.navigation}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-accent-11">
                {t.lessons}
              </span>
              <button
                type="button"
                onClick={close}
                className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:border-accent-7 transition-colors"
                aria-label={t.closeMenu}
              >
                {t.close}
              </button>
            </div>
            {list}
          </nav>
        </div>
      )}
    </>
  );
}
