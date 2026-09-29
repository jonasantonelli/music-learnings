"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchItem } from "@/lib/search-index";
import { TONE_DOTS } from "@/lib/tones";

const MAX_RESULTS = 12;

// Accidentals and case shouldn't matter: "f#", "F♯" and "f sharp" all match.
function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/♯/g, "#")
    .replace(/♭/g, "b")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function score(item: SearchItem, terms: string[]): number {
  const title = normalize(item.title);
  const rest = normalize(
    `${item.context} ${item.description ?? ""} ${item.keywords}`,
  );
  let total = 0;
  for (const t of terms) {
    if (title.startsWith(t)) total += 4;
    else if (title.includes(t)) total += 3;
    else if (rest.includes(t)) total += 1;
    else return 0;
  }
  return total;
}

export function SiteSearch({ items }: { items: SearchItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    if (terms.length === 0) return items.slice(0, MAX_RESULTS);
    return items
      .map((item) => ({ item, s: score(item, terms) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, MAX_RESULTS)
      .map((r) => r.item);
  }, [items, query]);

  const show = () => {
    setQuery("");
    setActive(0);
    setOpen(true);
  };

  // ⌘K / Ctrl+K toggles the palette from anywhere.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQuery("");
        setActive(0);
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (item: SearchItem | undefined) => {
    if (!item) return;
    setOpen(false);
    router.push(item.href);
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-label="Search lessons and songs"
        className={cn(
          "inline-flex h-9 shrink-0 items-center gap-2 rounded-control border border-border bg-background text-sm text-muted-foreground transition-colors hover:border-accent-7 hover:text-foreground",
          // Studio: a wide field with a ⌘K hint. Nocturne: a round icon button.
          "w-9 justify-center lg:w-60 lg:justify-start lg:pl-3 lg:pr-2",
          "dark:bg-card dark:text-foreground dark:lg:w-9 dark:lg:justify-center dark:lg:px-0",
        )}
      >
        <Search className="h-3.5 w-3.5 shrink-0 dark:h-4 dark:w-4" />
        <span className="hidden flex-1 text-left text-[13px] lg:inline dark:lg:hidden">
          Search lessons…
        </span>
        <kbd className="hidden rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[11px] leading-none lg:inline dark:lg:hidden">
          ⌘K
        </kbd>
      </button>

      {/* Portalled: the header's backdrop-blur would otherwise become the
          containing block for this fixed overlay. */}
      {open &&
        createPortal(
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-[12vh] backdrop-blur-sm dark:bg-black/60"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            className="w-full max-w-xl overflow-hidden rounded-card border border-border bg-card shadow-2xl dark:rounded-[20px]"
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onInputKey}
                placeholder="Search lessons and songs…"
                aria-label="Search lessons and songs"
                aria-controls="site-search-results"
                aria-activedescendant={
                  results[active] ? `site-search-${active}` : undefined
                }
                className="h-12 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
              />
              <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                Esc
              </kbd>
            </div>

            <ul
              ref={listRef}
              id="site-search-results"
              role="listbox"
              className="max-h-[min(60vh,420px)] overflow-y-auto p-2"
            >
              {results.length === 0 && (
                <li className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No lessons or songs match “{query}”.
                </li>
              )}
              {results.map((item, i) => (
                <li
                  key={item.href}
                  id={`site-search-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={i === active}
                  onMouseMove={() => setActive(i)}
                  onClick={() => go(item)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2.5",
                    i === active && "bg-muted",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn("h-2 w-2 shrink-0 rounded-full", TONE_DOTS[item.tone])}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {item.title}
                    </span>
                    <span className="block truncate font-mono text-[11px] text-muted-foreground">
                      {item.context}
                    </span>
                  </span>
                  {i === active && (
                    <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}
