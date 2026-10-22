"use client";

import { NoteText } from "@/components/note-text";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { noteName, STRING_MIDI, type Spelling } from "@/lib/music";
import {
  chordName,
  identifyChord,
  intervalLabelsForMatch,
  matchExplanation,
  type ChordMatch,
  type Fret,
  type FretInput,
} from "@/lib/chord-identify";
import {
  degreeMarkerStyle,
  roleForDegree,
  type DegreeRole,
} from "@/lib/degree-roles";
import { ChordDiagram } from "./mdx/chord-diagram";
import { defineMessages } from "@/lib/i18n";
import { useLocale, useMessages } from "@/components/locale-provider";

const messages = defineMessages({
  en: {
    spelling: "Spelling",
    spellingGroup: "Accidental spelling",
    flats: "♭ Flats",
    sharps: "♯ Sharps",
    clear: "Clear",
    fretboardLabel:
      "Interactive guitar fretboard. Click a fret to place a note on that string; click the circle at the left of each string to toggle open or muted.",
    stringStatus: (string: string, state: string) =>
      `${string} string: ${state}. Toggle open or muted.`,
    muted: "muted",
    open: "open",
    fret: (n: number) => `fret ${n}`,
    cellTitle: (string: string, fret: number, note: string) =>
      `${string} string, fret ${fret} — ${note}`,
    emptyHint:
      "Click the fretboard to place notes. Use ○ for open strings and × to mute.",
    noChord: "No chord identified",
    addThree: "Add at least three different notes.",
    needThree: (notes: string) =>
      `Played: ${notes}. Need three distinct pitch classes.`,
    noMatch: (notes: string) =>
      `Played: ${notes}. No standard chord matches this set of notes.`,
    mostLikely: "Most likely",
    notes: "Notes",
    intervals: "Intervals",
    otherInterpretations: "Other interpretations",
  },
  pt: {
    spelling: "Acidentes",
    spellingGroup: "Grafia dos acidentes",
    flats: "♭ Bemóis",
    sharps: "♯ Sustenidos",
    clear: "Limpar",
    fretboardLabel:
      "Braço de guitarra interativo. Clique em uma casa para colocar uma nota naquela corda; clique no círculo à esquerda de cada corda para alternar entre solta e abafada.",
    stringStatus: (string: string, state: string) =>
      `Corda ${string}: ${state}. Alternar entre solta e abafada.`,
    muted: "abafada",
    open: "solta",
    fret: (n: number) => `casa ${n}`,
    cellTitle: (string: string, fret: number, note: string) =>
      `Corda ${string}, casa ${fret} — ${note}`,
    emptyHint:
      "Clique no braço para colocar notas. Use ○ para cordas soltas e × para abafar.",
    noChord: "Nenhum acorde identificado",
    addThree: "Adicione pelo menos três notas diferentes.",
    needThree: (notes: string) =>
      `Tocadas: ${notes}. São necessárias três notas distintas.`,
    noMatch: (notes: string) =>
      `Tocadas: ${notes}. Nenhum acorde padrão corresponde a este conjunto de notas.`,
    mostLikely: "Mais provável",
    notes: "Notas",
    intervals: "Intervalos",
    otherInterpretations: "Outras interpretações",
  },
  es: {
    spelling: "Alteraciones",
    spellingGroup: "Grafía de las alteraciones",
    flats: "♭ Bemoles",
    sharps: "♯ Sostenidos",
    clear: "Limpiar",
    fretboardLabel:
      "Mástil de guitarra interactivo. Haz clic en un traste para colocar una nota en esa cuerda; haz clic en el círculo a la izquierda de cada cuerda para alternar entre al aire y apagada.",
    stringStatus: (string: string, state: string) =>
      `Cuerda ${string}: ${state}. Alternar entre al aire y apagada.`,
    muted: "apagada",
    open: "al aire",
    fret: (n: number) => `traste ${n}`,
    cellTitle: (string: string, fret: number, note: string) =>
      `Cuerda ${string}, traste ${fret} — ${note}`,
    emptyHint:
      "Haz clic en el mástil para colocar notas. Usa ○ para cuerdas al aire y × para apagarlas.",
    noChord: "Ningún acorde identificado",
    addThree: "Agrega al menos tres notas diferentes.",
    needThree: (notes: string) =>
      `Tocadas: ${notes}. Se necesitan tres notas distintas.`,
    noMatch: (notes: string) =>
      `Tocadas: ${notes}. Ningún acorde estándar coincide con este conjunto de notas.`,
    mostLikely: "Más probable",
    notes: "Notas",
    intervals: "Intervalos",
    otherInterpretations: "Otras interpretaciones",
  },
});

type Accidental = Extract<Spelling, "flat" | "sharp">;

const STRINGS = 6;
const FRETS_SHOWN = 15;
// index 0 = low E (string 6 visually), index 5 = high e (string 1 visually)
const STRING_NAMES = ["E", "A", "D", "G", "B", "e"];

const NOTE_R = 12.5;
const STATUS_R = 11;

const INLAY_FRETS = [3, 5, 7, 9, 15, 17, 19, 21];
const DOUBLE_INLAY = [12, 24];

type Point = { x: number; y: number };

/**
 * Board geometry for one orientation. Wide containers get the horizontal
 * board (strings as rows, low E at the bottom); phones get a vertical one
 * (strings as columns, low E on the left) so every fret stays visible and
 * the tap targets stay finger-sized.
 */
type BoardLayout = {
  vertical: boolean;
  width: number;
  height: number;
  /** `along` counts frets from the nut (0 = nut); index 0 = low E. */
  at: (along: number, stringIdx: number) => Point;
  /** String name and open/mute button, before the nut. */
  label: (stringIdx: number) => Point;
  status: (stringIdx: number) => Point;
  fretNumber: (fret: number) => Point & { anchor: "middle" | "end" };
};

const H_NUT_X = 66; // string label + open/mute status column, left of the nut
const H_PAD_R = 16;
const H_MIN_CELL_W = 30;

/**
 * Horizontal board stretched to `containerWidth`: only the fret spacing grows,
 * so the board spans the container without getting taller.
 */
function horizontalLayout(containerWidth: number | null): BoardLayout {
  const cellW = containerWidth
    ? Math.max(H_MIN_CELL_W, (containerWidth - H_NUT_X - H_PAD_R) / FRETS_SHOWN)
    : H_MIN_CELL_W;
  const cellH = 34;
  const nutX = H_NUT_X;
  const padY = 22;
  const padR = H_PAD_R;
  const height = padY + cellH * (STRINGS - 1) + 28;
  const rowY = (stringIdx: number) => padY + (STRINGS - 1 - stringIdx) * cellH;
  return {
    vertical: false,
    width: nutX + cellW * FRETS_SHOWN + padR,
    height,
    at: (along, stringIdx) => ({ x: nutX + along * cellW, y: rowY(stringIdx) }),
    label: (stringIdx) => ({ x: 15, y: rowY(stringIdx) }),
    status: (stringIdx) => ({ x: 43, y: rowY(stringIdx) }),
    fretNumber: (fret) => ({
      x: nutX + (fret - 0.5) * cellW,
      y: height - 6,
      anchor: "middle",
    }),
  };
}

const VERTICAL_LAYOUT: BoardLayout = (() => {
  const cellW = 46;
  const cellH = 36;
  const nutY = 66; // string label + open/mute status rows, above the nut
  const padL = 30; // fret numbers
  const padR = 12;
  const colX = (stringIdx: number) => padL + cellW / 2 + stringIdx * cellW;
  return {
    vertical: true,
    width: padL + cellW * STRINGS + padR,
    height: nutY + cellH * FRETS_SHOWN + 12,
    at: (along, stringIdx) => ({ x: colX(stringIdx), y: nutY + along * cellH }),
    label: (stringIdx) => ({ x: colX(stringIdx), y: 15 }),
    status: (stringIdx) => ({ x: colX(stringIdx), y: 43 }),
    fretNumber: (fret) => ({
      x: padL - 6,
      y: nutY + (fret - 0.5) * cellH,
      anchor: "end",
    }),
  };
})();

/** Axis-aligned rect spanning two neck points, whatever the orientation. */
function boardRect(a: Point, b: Point) {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  };
}

function freshFrets(): Fret[] {
  return ["x", "x", "x", "x", "x", "x"];
}

/** Degree role of each sounding string relative to the match's root. */
function rolesForMatch(
  frets: Fret[],
  match: ChordMatch,
  pitchClasses: number[],
): (DegreeRole | null)[] {
  // degreeLabels follow the played intervals from the root, sorted upward.
  const intervals = [
    ...new Set(pitchClasses.map((pc) => (pc - match.rootPc + 12) % 12)),
  ].sort((a, b) => a - b);
  const labelOf = new Map(intervals.map((iv, i) => [iv, match.degreeLabels[i]]));
  return frets.map((f, i) => {
    if (typeof f !== "number") return null;
    const interval = (STRING_MIDI[i] + f - match.rootPc + 120) % 12;
    return roleForDegree(labelOf.get(interval) ?? "");
  });
}

export function ChordIdentifier() {
  const [frets, setFrets] = useState<Fret[]>(freshFrets);
  const [accidental, setAccidental] = useState<Accidental>("flat");

  // Toggle a string between muted and open; a fretted string mutes first.
  const onStringToggle = useCallback((stringIdx: number) => {
    setFrets((prev) => {
      const next = prev.slice();
      next[stringIdx] = prev[stringIdx] === "x" ? 0 : "x";
      return next;
    });
  }, []);

  const onCellClick = useCallback((stringIdx: number, fret: number) => {
    setFrets((prev) => {
      const next = prev.slice();
      next[stringIdx] = prev[stringIdx] === fret ? "x" : fret;
      return next;
    });
  }, []);

  const result = useMemo(() => identifyChord(frets as FretInput), [frets]);
  const roles = useMemo(
    () =>
      result.matches[0]
        ? rolesForMatch(frets, result.matches[0], result.pitchClasses)
        : undefined,
    [frets, result],
  );

  const onClear = () => setFrets(freshFrets());

  return (
    <div className="w-full">
      <Toolbar
        accidental={accidental}
        onAccidentalChange={setAccidental}
        onClear={onClear}
      />

      <FretboardInput
        frets={frets}
        roles={roles}
        spelling={accidental}
        onCellClick={onCellClick}
        onStringToggle={onStringToggle}
      />

      <ResultPanel
        result={result}
        frets={frets}
        roles={roles}
        spelling={accidental}
      />
    </div>
  );
}

function Toolbar({
  accidental,
  onAccidentalChange,
  onClear,
}: {
  accidental: Accidental;
  onAccidentalChange: (v: Accidental) => void;
  onClear: () => void;
}) {
  const t = useMessages(messages);
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t.spelling}</span>
        <div
          role="group"
          aria-label={t.spellingGroup}
          className="inline-flex rounded-md border border-border bg-muted overflow-hidden"
        >
          {(
            [
              ["flat", t.flats],
              ["sharp", t.sharps],
            ] as const
          ).map(([value, label], i) => (
            <button
              key={value}
              type="button"
              aria-pressed={accidental === value}
              onClick={() => onAccidentalChange(value)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium transition-colors",
                i > 0 && "border-l border-border",
                accidental === value
                  ? "bg-accent-9 text-accent-contrast"
                  : "text-muted-foreground hover:text-foreground hover:bg-card-hover",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={onClear}
        className="ml-auto rounded-md border border-border px-3 py-1.5 text-sm hover:bg-card-hover"
      >
        {t.clear}
      </button>
    </div>
  );
}

function FretboardInput({
  frets,
  roles,
  spelling,
  onCellClick,
  onStringToggle,
}: {
  frets: Fret[];
  roles?: (DegreeRole | null)[];
  spelling: Spelling;
  onCellClick: (stringIdx: number, fret: number) => void;
  onStringToggle: (stringIdx: number) => void;
}) {
  const props = { frets, roles, spelling, onCellClick, onStringToggle };
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const horizontal = useMemo(() => horizontalLayout(containerWidth), [containerWidth]);

  return (
    <div ref={containerRef} className="@container">
      <div className="hidden @min-[480px]:block">
        <FretboardSvg layout={horizontal} {...props} />
      </div>
      <div className="@min-[480px]:hidden">
        <FretboardSvg layout={VERTICAL_LAYOUT} {...props} />
      </div>
    </div>
  );
}

/** Note name at a given string + fret, respecting the ♭/♯ preference. */
function noteAt(stringIdx: number, fret: number, spelling: Spelling): string {
  return noteName((STRING_MIDI[stringIdx] + fret) % 12, spelling);
}

function FretboardSvg({
  layout,
  frets,
  roles,
  spelling,
  onCellClick,
  onStringToggle,
}: {
  layout: BoardLayout;
  frets: Fret[];
  roles?: (DegreeRole | null)[];
  spelling: Spelling;
  onCellClick: (stringIdx: number, fret: number) => void;
  onStringToggle: (stringIdx: number) => void;
}) {
  const t = useMessages(messages);
  const { at } = layout;
  const shadowId = layout.vertical ? "noteShadowV" : "noteShadowH";
  const surface = boardRect(at(0, -0.5), at(FRETS_SHOWN, STRINGS - 0.5));

  return (
    <svg
      role="img"
      aria-label={t.fretboardLabel}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      className={cn(
        "block w-full h-auto text-foreground select-none",
        layout.vertical && "mx-auto",
      )}
      style={{ maxWidth: layout.vertical ? layout.width * 1.15 : layout.width }}
    >
      <defs>
        <filter id={shadowId} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow
            dx="0"
            dy="1"
            stdDeviation="1.2"
            floodColor="#000"
            floodOpacity="0.28"
          />
        </filter>
      </defs>

      {/* Fretboard surface */}
      <rect {...surface} rx={4} fill="var(--card)" />

      {/* Inlays */}
      {INLAY_FRETS.filter((f) => f <= FRETS_SHOWN).map((f) => {
        const p = at(f - 0.5, (STRINGS - 1) / 2);
        return (
          <circle
            key={`inlay-${f}`}
            cx={p.x}
            cy={p.y}
            r={4.5}
            fill="currentColor"
            opacity={0.1}
          />
        );
      })}
      {DOUBLE_INLAY.filter((f) => f <= FRETS_SHOWN).map((f) => {
        const a = at(f - 0.5, STRINGS - 2);
        const b = at(f - 0.5, 1);
        return (
          <g key={`dinlay-${f}`} fill="currentColor" opacity={0.1}>
            <circle cx={a.x} cy={a.y} r={4.5} />
            <circle cx={b.x} cy={b.y} r={4.5} />
          </g>
        );
      })}

      {/* Frets (fret 0 = the nut) */}
      {Array.from({ length: FRETS_SHOWN + 1 }).map((_, i) => {
        const a = at(i, -0.47);
        const b = at(i, STRINGS - 0.53);
        return (
          <line
            key={`f-${i}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={i === 0 ? "currentColor" : "var(--border)"}
            strokeWidth={i === 0 ? 4 : 1.25}
            strokeLinecap="round"
            opacity={i === 0 ? 0.85 : 1}
          />
        );
      })}

      {/* Strings — thinner (high e) to thicker (low E) */}
      {Array.from({ length: STRINGS }).map((_, stringIdx) => {
        const a = at(0, stringIdx);
        const b = at(FRETS_SHOWN, stringIdx);
        return (
          <line
            key={`s-${stringIdx}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="currentColor"
            strokeWidth={0.7 + (5 - stringIdx) * 0.18}
            opacity={0.28}
          />
        );
      })}

      {/* Fret numbers */}
      {Array.from({ length: FRETS_SHOWN }).map((_, i) => {
        const fret = i + 1;
        const p = layout.fretNumber(fret);
        return (
          <text
            key={`fn-${fret}`}
            x={p.x}
            y={p.y}
            textAnchor={p.anchor}
            dominantBaseline={layout.vertical ? "central" : undefined}
            fontSize={9}
            fontWeight={INLAY_FRETS.includes(fret) ? 700 : 400}
            fill="currentColor"
            opacity={INLAY_FRETS.includes(fret) ? 0.55 : 0.35}
          >
            {fret}
          </text>
        );
      })}

      {/* Per-string open / mute status + label, before the nut */}
      {Array.from({ length: STRINGS }).map((_, stringIdx) => {
        const label = layout.label(stringIdx);
        const { x: cx, y: cy } = layout.status(stringIdx);
        const state = frets[stringIdx];
        const muted = state === "x";
        const open = state === 0;
        const fretted = typeof state === "number" && state > 0;
        return (
          <g key={`status-${stringIdx}`}>
            <text
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={12}
              fontWeight={600}
              fill="currentColor"
              opacity={0.5}
            >
              {STRING_NAMES[stringIdx]}
            </text>
            <g
              className="fret-status"
              role="button"
              tabIndex={0}
              aria-label={t.stringStatus(
                STRING_NAMES[stringIdx],
                muted ? t.muted : open ? t.open : t.fret(state as number),
              )}
              onClick={() => onStringToggle(stringIdx)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onStringToggle(stringIdx);
                }
              }}
            >
              <circle className="status-bg" cx={cx} cy={cy} r={STATUS_R + 3} />
              {/* Persistent ring — the always-visible string button. Grey
                  when muted, lime when open. */}
              {!fretted && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={STATUS_R - 3}
                  fill="none"
                  stroke={open ? "var(--accent-9)" : "var(--muted-foreground)"}
                  strokeWidth={open ? 2 : 1.5}
                  strokeOpacity={open ? 1 : 0.4}
                />
              )}
              {/* Fretted string sounds — a filled marker. */}
              {fretted && <circle cx={cx} cy={cy} r={4} fill="var(--accent-9)" />}
              {/* The "×" only reveals inside the ring on hover of a muted
                  string (see .status-x in globals.css). */}
              {muted && (
                <g
                  className="status-x"
                  stroke="var(--muted-foreground)"
                  strokeWidth={1.3}
                  strokeLinecap="round"
                >
                  <line x1={cx - 3.2} y1={cy - 3.2} x2={cx + 3.2} y2={cy + 3.2} />
                  <line x1={cx + 3.2} y1={cy - 3.2} x2={cx - 3.2} y2={cy + 3.2} />
                </g>
              )}
            </g>
          </g>
        );
      })}

      {/* Interactive cells: hover ghost + placed notes */}
      {Array.from({ length: STRINGS }).flatMap((_, stringIdx) =>
        Array.from({ length: FRETS_SHOWN }).map((__, i) => {
          const fret = i + 1;
          const { x: cx, y: cy } = at(fret - 0.5, stringIdx);
          const isActive = frets[stringIdx] === fret;
          const name = noteAt(stringIdx, fret, spelling);
          // Until a chord is recognised, placed notes keep the accent fill.
          const role = isActive ? roles?.[stringIdx] : null;
          const style = role ? degreeMarkerStyle(role) : null;
          return (
            <g key={`cell-${stringIdx}-${fret}`} className="fret-cell">
              <rect
                {...boardRect(at(fret - 1, stringIdx - 0.5), at(fret, stringIdx + 0.5))}
                fill="transparent"
                onClick={() => onCellClick(stringIdx, fret)}
              >
                <title>{t.cellTitle(STRING_NAMES[stringIdx], fret, name)}</title>
              </rect>

              {isActive ? (
                <g className="pointer-events-none">
                  <circle
                    cx={cx}
                    cy={cy}
                    r={NOTE_R}
                    fill={style?.color ?? "var(--accent-9)"}
                    stroke={style?.stroke}
                    strokeWidth={style?.stroke ? 1.5 : undefined}
                    filter={`url(#${shadowId})`}
                  />
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={name.length > 1 ? 9.5 : 11}
                    fontWeight={700}
                    fill={style?.labelColor ?? "var(--accent-contrast)"}
                  >
                    <NoteText svg text={name} />
                  </text>
                </g>
              ) : (
                <g className="ghost pointer-events-none">
                  <circle
                    cx={cx}
                    cy={cy}
                    r={NOTE_R}
                    fill="var(--muted-foreground)"
                    fillOpacity={0.13}
                    stroke="var(--muted-foreground)"
                    strokeOpacity={0.4}
                    strokeWidth={1}
                  />
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={name.length > 1 ? 9.5 : 11}
                    fontWeight={700}
                    fill="var(--muted-foreground)"
                  >
                    <NoteText svg text={name} />
                  </text>
                </g>
              )}
            </g>
          );
        }),
      )}
    </svg>
  );
}

function ResultPanel({
  result,
  frets,
  roles,
  spelling,
}: {
  result: ReturnType<typeof identifyChord>;
  frets: Fret[];
  roles?: (DegreeRole | null)[];
  spelling: Spelling;
}) {
  const t = useMessages(messages);
  const lang = useLocale();
  if (result.midi.length === 0) {
    return (
      <div className="mt-8 rounded-card border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        {t.emptyHint}
      </div>
    );
  }

  if (result.matches.length === 0) {
    const notes = result.midi.map((m) => noteName(m % 12, spelling)).join(" ");
    return (
      <div className="mt-8 rounded-card border border-border bg-card p-5 sm:p-6">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          {t.noChord}
        </p>
        <p className="mt-3 text-base">
          {result.midi.length < 2
            ? t.addThree
            : result.pitchClasses.length < 3
              ? t.needThree(notes)
              : t.noMatch(notes)}
        </p>
      </div>
    );
  }

  const [primary, ...alternates] = result.matches;
  const primaryName = chordName(primary, spelling);
  const notesLowToHigh = result.midi
    .map((m) => noteName(m % 12, spelling))
    .join(" ");
  const intervalLabels = intervalLabelsForMatch(primary).join(" ");

  // Build a clean ChordDiagram input (replace null → "x" — though we use no nulls)
  const diagramFrets: Array<number | "x"> = frets.map((f) =>
    f === "x" ? "x" : f,
  );

  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-[1fr_auto] items-start">
      <div className="rounded-card border border-border bg-card p-5 sm:p-6">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          {t.mostLikely}
        </p>
        <p className="mt-2 text-5xl sm:text-6xl font-bold text-accent-11 tracking-tight">
          {primaryName}
        </p>
        {matchExplanation(primary, spelling, lang) && (
          <p className="mt-2 text-sm text-muted-foreground">
            {matchExplanation(primary, spelling, lang)}
          </p>
        )}

        <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">{t.notes}</dt>
          <dd className="font-mono">{notesLowToHigh}</dd>
          <dt className="text-muted-foreground">{t.intervals}</dt>
          <dd className="font-mono">{intervalLabels}</dd>
        </dl>

        {alternates.length > 0 && (
          <div className="mt-6">
            <p className="text-sm uppercase tracking-widest text-muted-foreground mb-2">
              {t.otherInterpretations}
            </p>
            <ul className="space-y-1.5">
              {alternates.slice(0, 6).map((m, i) => {
                const name = chordName(m, spelling);
                const why = matchExplanation(m, spelling, lang);
                return (
                  <li
                    key={`${name}-${i}`}
                    className="flex items-baseline gap-3 text-sm"
                  >
                    <span className="font-medium min-w-[5ch]"><NoteText text={name} /></span>
                    {why && (
                      <span className="text-muted-foreground">— {why}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <div className="justify-self-start sm:justify-self-end">
        <ChordDiagram name={primaryName} frets={diagramFrets} roles={roles} />
      </div>
    </div>
  );
}
