"use client";

import * as React from "react";
import { defineMessages } from "@/lib/i18n";
import { useMessages } from "@/components/locale-provider";
import type { FretSpot } from "@/lib/licks/fingering";

const messages = defineMessages({
  en: {
    staff: "Lick in standard notation and tablature",
    loading: "Loading notation…",
    failed: "Couldn't draw the notation.",
  },
  pt: {
    staff: "Lick em partitura e tablatura",
    loading: "Carregando partitura…",
    failed: "Não foi possível desenhar a partitura.",
  },
  es: {
    staff: "Lick en partitura y tablatura",
    loading: "Cargando partitura…",
    failed: "No se pudo dibujar la partitura.",
  },
});

/** Where each lick note is played; `tied` marks the continuation of a tie. */
export type TabNote = (FretSpot & { tied: boolean }) | null;

type Props = {
  /** ABC for the lick, with a line break every `barsPerLine` bars. */
  abc: (barsPerLine: number) => string;
  /** One entry per lick note (rests are null). */
  tab: TabNote[];
  /** Note index to highlight (rests included, matching the lick's notes). */
  active: number | null;
  onSelect?: (index: number) => void;
};

const SVG_NS = "http://www.w3.org/2000/svg";
// Baseline offset of a 15px tab number below its string line, as abcjs draws it.
const TAB_TEXT_OFFSET = 5.2;

/**
 * Renders a lick as a classic staff + tablature pair with abcjs. abcjs lays
 * out both staves and picks its own frets, so after rendering each tab
 * number is moved to the string and fret of the chosen fingering. abcjs
 * touches the DOM, so it is loaded on the client only.
 */
export function LickStaff({ abc, tab, active, onSelect }: Props) {
  const t = useMessages(messages);
  const ref = React.useRef<HTMLDivElement>(null);
  // Per lick note: its staff element and its tab number (if any).
  const notesRef = React.useRef<Element[][]>([]);
  const [width, setWidth] = React.useState(0);
  const [ready, setReady] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.round(entry.contentRect.width / 40) * 40),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || width === 0) return;
    let cancelled = false;
    import("abcjs").then((abcjs) => {
      if (cancelled) return;
      // One bar per line on phones (tab numbers would collide), up to four on desktop.
      abcjs.renderAbc(el, abc(width < 440 ? 1 : width < 760 ? 2 : 4), {
        add_classes: true,
        jazzchords: true,
        foregroundColor: "currentColor",
        responsive: "resize",
        staffwidth: Math.max(300, width - 20),
        paddingleft: 0,
        paddingright: 0,
        paddingtop: 8,
        paddingbottom: 8,
        ariaLabel: t.staff,
        tablature: [{ instrument: "guitar", label: "" }],
        // abcjs's own click selection paints notes red; ours highlights instead.
        selectTypes: false,
      });
      notesRef.current = applyFingering(el, tab);
      setReady(true);
    }).catch((error) => {
      console.error(error);
      if (!cancelled) setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [abc, tab, width, t.staff]);

  React.useEffect(() => {
    notesRef.current.forEach((els, i) =>
      els.forEach((e) => e.classList.toggle("lick-note-active", i === active)),
    );
  }, [active, ready, abc, tab, width]);

  // Picks the note (staff or tab) nearest the click, so a click just beside
  // a small notehead or tab number still lands.
  const onClick = (e: React.MouseEvent) => {
    let best = -1;
    let bestDistance = 28;
    notesRef.current.forEach((els, i) =>
      els.forEach((el) => {
        if (el.classList.contains("abcjs-rest")) return;
        const r = el.getBoundingClientRect();
        const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
        const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
        const distance = Math.hypot(dx, dy);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = i;
        }
      }),
    );
    if (best >= 0) onSelect?.(best);
  };

  return (
    <div className="lick-staff relative">
      <div
        ref={ref}
        onClick={onClick}
        className="w-full overflow-hidden [&_.abcjs-note]:cursor-pointer"
      />
      {!ready && (
        <p className="py-8 text-center text-sm opacity-60">{failed ? t.failed : t.loading}</p>
      )}
    </div>
  );
}

/**
 * Rewrites abcjs's tab numbers with the chosen fingering and returns, per
 * lick note, the elements to highlight (staff note and tab number).
 */
function applyFingering(root: HTMLElement, tab: TabNote[]): Element[][] {
  // Staff notes and rests come in document order, one per lick note.
  const staff = Array.from(root.querySelectorAll(".abcjs-note:not(.abcjs-tabNumber), .abcjs-rest"));
  const groups = Array.from(root.querySelectorAll(".abcjs-tabNumber"));
  const pitched = tab.flatMap((n, i) => (n ? [i] : []));
  // abcjs may or may not print a number for the second note of a tie.
  const owners = groups.length === pitched.length ? pitched : pitched.filter((i) => !tab[i]!.tied);

  // String line heights of each system's tab staff (string 1 = top line).
  const lines = new Map<string, number[]>();
  root.querySelectorAll("g.abcjs-staff.abcjs-v1").forEach((g) => {
    const line = g.getAttribute("class")!.match(/abcjs-l(\d+)/)?.[1] ?? "0";
    const ys = Array.from(g.querySelectorAll(":scope > path"))
      .map((p) => Number(p.getAttribute("d")?.match(/^M\s*[\d.]+\s+([\d.]+)/)?.[1]))
      .filter((y) => !Number.isNaN(y))
      .sort((a, b) => a - b);
    lines.set(line, ys);
  });

  const elements: Element[][] = tab.map((_, i) => (staff[i] ? [staff[i]] : []));
  groups.forEach((group, k) => {
    const i = owners[k];
    const spot = i === undefined ? null : tab[i];
    const text = group.querySelector("text");
    if (!spot || !text) return;
    const line = group.getAttribute("class")!.match(/abcjs-l(\d+)/)?.[1] ?? "0";
    const y = lines.get(line)?.[spot.string - 1];
    if (y === undefined) return;
    const label = spot.tied ? `(${spot.fret})` : String(spot.fret);
    text.textContent = label;
    text.setAttribute("y", String(y + TAB_TEXT_OFFSET));
    // Break the string line behind the number, as printed tab does.
    const x = Number(text.getAttribute("x"));
    const w = label.length * 8.5 + 4;
    const bg = document.createElementNS(SVG_NS, "rect");
    bg.setAttribute("x", String(x - w / 2));
    bg.setAttribute("y", String(y - 7));
    bg.setAttribute("width", String(w));
    bg.setAttribute("height", "14");
    bg.setAttribute("rx", "3");
    bg.setAttribute("class", "lick-tab-bg");
    group.insertBefore(bg, text);
    elements[i!].push(group);
  });
  return elements;
}
