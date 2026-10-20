"use client";

import * as React from "react";
import { defineMessages } from "@/lib/i18n";
import { useMessages } from "@/components/locale-provider";

const messages = defineMessages({
  en: { staff: "Lick in standard notation", loading: "Loading notation…" },
  pt: { staff: "Lick em partitura", loading: "Carregando partitura…" },
  es: { staff: "Lick en partitura", loading: "Cargando partitura…" },
});

type Props = {
  abc: string;
  /** Note index to highlight (rests included, matching the lick's notes). */
  active: number | null;
  onSelect?: (index: number) => void;
};

/**
 * Renders a lick on a treble staff with abcjs. abcjs touches the DOM, so it is
 * loaded on the client only. Notes are matched to the lick by order, which
 * holds because every lick is a single voice.
 */
export function LickStaff({ abc, active, onSelect }: Props) {
  const t = useMessages(messages);
  const ref = React.useRef<HTMLDivElement>(null);
  const notesRef = React.useRef<Element[]>([]);
  const [width, setWidth] = React.useState(0);
  const [ready, setReady] = React.useState(false);

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
      // Phones get two bars per line, wider screens up to four.
      const barsPerLine = width < 520 ? 2 : 4;
      abcjs.renderAbc(el, abc, {
        add_classes: true,
        jazzchords: true,
        foregroundColor: "currentColor",
        responsive: "resize",
        staffwidth: Math.max(300, width - 20),
        paddingleft: 0,
        paddingright: 0,
        paddingtop: 8,
        paddingbottom: 8,
        wrap: { preferredMeasuresPerLine: barsPerLine, minSpacing: 1.6, maxSpacing: 2.8 },
        ariaLabel: t.staff,
      });
      // With add_classes, every note and rest is an element in document
      // order, one per lick note (ties included), so indexes line up.
      notesRef.current = Array.from(el.querySelectorAll(".abcjs-note, .abcjs-rest"));
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [abc, width, t.staff]);

  React.useEffect(() => {
    notesRef.current.forEach((e, i) => e.classList.toggle("lick-note-active", i === active));
  }, [active, ready, abc, width]);

  const onClick = (e: React.MouseEvent) => {
    const note = (e.target as Element).closest(".abcjs-note");
    const index = note ? notesRef.current.indexOf(note) : -1;
    if (index >= 0) onSelect?.(index);
  };

  return (
    <div className="lick-staff relative text-foreground">
      <div
        ref={ref}
        onClick={onClick}
        className="w-full overflow-hidden [&_.abcjs-note]:cursor-pointer"
      />
      {!ready && (
        <p className="py-8 text-center text-sm text-muted-foreground">{t.loading}</p>
      )}
    </div>
  );
}
