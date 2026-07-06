"use client";

import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { noteName, STRING_MIDI, type Spelling } from "@/lib/music";
import {
  chordName,
  identifyChord,
  intervalLabelsForMatch,
  matchExplanation,
  type Fret,
  type FretInput,
} from "@/lib/chord-identify";
import { ChordDiagram } from "./mdx/chord-diagram";

type Accidental = Extract<Spelling, "flat" | "sharp">;

const STRINGS = 6;
const FRETS_SHOWN = 15;
// index 0 = low E (string 6 visually), index 5 = high e (string 1 visually)
const STRING_NAMES = ["E", "A", "D", "G", "B", "e"];

const CELL_W = 30;
const CELL_H = 34;
const GUTTER = 66; // string label + open/mute status column, left of the nut
const PAD_Y = 22;
const PAD_R = 16; // right padding
const NUT_X = GUTTER;
const SVG_W = GUTTER + CELL_W * FRETS_SHOWN + PAD_R;
const SVG_H = PAD_Y + CELL_H * (STRINGS - 1) + 28;
const NOTE_R = 12.5;
const LABEL_X = 15;
const STATUS_CX = 43;
const STATUS_R = 11;

const INLAY_FRETS = [3, 5, 7, 9, 15, 17, 19, 21];
const DOUBLE_INLAY = [12, 24];

const rowY = (row: number) => PAD_Y + row * CELL_H;
const fretX = (fret: number) => NUT_X + (fret - 0.5) * CELL_W;

function freshFrets(): Fret[] {
  return ["x", "x", "x", "x", "x", "x"];
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
        spelling={accidental}
        onCellClick={onCellClick}
        onStringToggle={onStringToggle}
      />

      <ResultPanel result={result} frets={frets} spelling={accidental} />
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
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Spelling</span>
        <div
          role="group"
          aria-label="Accidental spelling"
          className="inline-flex rounded-md border border-border bg-muted overflow-hidden"
        >
          {(
            [
              ["flat", "♭ Flats"],
              ["sharp", "♯ Sharps"],
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
        Clear
      </button>
    </div>
  );
}

function FretboardInput({
  frets,
  spelling,
  onCellClick,
  onStringToggle,
}: {
  frets: Fret[];
  spelling: Spelling;
  onCellClick: (stringIdx: number, fret: number) => void;
  onStringToggle: (stringIdx: number) => void;
}) {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
      <div className="min-w-fit">
        <FretboardSvg
          frets={frets}
          spelling={spelling}
          onCellClick={onCellClick}
          onStringToggle={onStringToggle}
        />
      </div>
    </div>
  );
}

/** Note name at a given string + fret, respecting the ♭/♯ preference. */
function noteAt(stringIdx: number, fret: number, spelling: Spelling): string {
  return noteName((STRING_MIDI[stringIdx] + fret) % 12, spelling);
}

function FretboardSvg({
  frets,
  spelling,
  onCellClick,
  onStringToggle,
}: {
  frets: Fret[];
  spelling: Spelling;
  onCellClick: (stringIdx: number, fret: number) => void;
  onStringToggle: (stringIdx: number) => void;
}) {
  const boardTop = rowY(0);
  const boardBottom = rowY(STRINGS - 1);

  return (
    <svg
      role="img"
      aria-label="Interactive guitar fretboard. Click a fret to place a note on that string; click the circle at the left of each string to toggle open or muted."
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      width={SVG_W}
      height={SVG_H}
      className="text-foreground select-none"
    >
      <defs>
        <filter id="noteShadow" x="-40%" y="-40%" width="180%" height="180%">
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
      <rect
        x={NUT_X}
        y={boardTop - CELL_H / 2}
        width={CELL_W * FRETS_SHOWN}
        height={CELL_H * (STRINGS - 1) + CELL_H}
        rx={4}
        fill="var(--card)"
      />

      {/* Inlays */}
      {INLAY_FRETS.filter((f) => f <= FRETS_SHOWN).map((f) => (
        <circle
          key={`inlay-${f}`}
          cx={fretX(f)}
          cy={(boardTop + boardBottom) / 2}
          r={4.5}
          fill="currentColor"
          opacity={0.1}
        />
      ))}
      {DOUBLE_INLAY.filter((f) => f <= FRETS_SHOWN).map((f) => (
        <g key={`dinlay-${f}`} fill="currentColor" opacity={0.1}>
          <circle cx={fretX(f)} cy={rowY(1)} r={4.5} />
          <circle cx={fretX(f)} cy={rowY(STRINGS - 2)} r={4.5} />
        </g>
      ))}

      {/* Frets (fret 0 = the nut) */}
      {Array.from({ length: FRETS_SHOWN + 1 }).map((_, i) => (
        <line
          key={`f-${i}`}
          x1={NUT_X + i * CELL_W}
          y1={boardTop - CELL_H / 2 + 1}
          x2={NUT_X + i * CELL_W}
          y2={boardBottom + CELL_H / 2 - 1}
          stroke={i === 0 ? "currentColor" : "var(--border)"}
          strokeWidth={i === 0 ? 4 : 1.25}
          strokeLinecap="round"
          opacity={i === 0 ? 0.85 : 1}
        />
      ))}

      {/* Strings — thinner (high e) to thicker (low E) */}
      {Array.from({ length: STRINGS }).map((_, row) => {
        const stringIdx = STRINGS - 1 - row;
        return (
          <line
            key={`s-${row}`}
            x1={NUT_X}
            y1={rowY(row)}
            x2={NUT_X + CELL_W * FRETS_SHOWN}
            y2={rowY(row)}
            stroke="currentColor"
            strokeWidth={0.7 + (5 - stringIdx) * 0.18}
            opacity={0.28}
          />
        );
      })}

      {/* Fret numbers below */}
      {Array.from({ length: FRETS_SHOWN }).map((_, i) => {
        const fret = i + 1;
        return (
          <text
            key={`fn-${fret}`}
            x={fretX(fret)}
            y={SVG_H - 6}
            textAnchor="middle"
            fontSize={9}
            fontWeight={INLAY_FRETS.includes(fret) ? 700 : 400}
            fill="currentColor"
            opacity={INLAY_FRETS.includes(fret) ? 0.55 : 0.35}
          >
            {fret}
          </text>
        );
      })}

      {/* Per-string open / mute status + label, in the left gutter */}
      {Array.from({ length: STRINGS }).map((_, row) => {
        const stringIdx = STRINGS - 1 - row;
        const cy = rowY(row);
        const state = frets[stringIdx];
        const muted = state === "x";
        const open = state === 0;
        const fretted = typeof state === "number" && state > 0;
        return (
          <g key={`status-${stringIdx}`}>
            <text
              x={LABEL_X}
              y={cy}
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
              aria-label={`${STRING_NAMES[stringIdx]} string: ${
                muted ? "muted" : open ? "open" : `fret ${state}`
              }. Toggle open or muted.`}
              onClick={() => onStringToggle(stringIdx)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onStringToggle(stringIdx);
                }
              }}
            >
              <circle
                className="status-bg"
                cx={STATUS_CX}
                cy={cy}
                r={STATUS_R + 3}
              />
              {/* Persistent ring — the always-visible string button. Grey
                  when muted, lime when open. */}
              {!fretted && (
                <circle
                  cx={STATUS_CX}
                  cy={cy}
                  r={STATUS_R - 3}
                  fill="none"
                  stroke={open ? "var(--accent-9)" : "var(--muted-foreground)"}
                  strokeWidth={open ? 2 : 1.5}
                  strokeOpacity={open ? 1 : 0.4}
                />
              )}
              {/* Fretted string sounds — a filled marker. */}
              {fretted && (
                <circle cx={STATUS_CX} cy={cy} r={4} fill="var(--accent-9)" />
              )}
              {/* The "×" only reveals inside the ring on hover of a muted
                  string (see .status-x in globals.css). */}
              {muted && (
                <g
                  className="status-x"
                  stroke="var(--muted-foreground)"
                  strokeWidth={1.3}
                  strokeLinecap="round"
                >
                  <line
                    x1={STATUS_CX - 3.2}
                    y1={cy - 3.2}
                    x2={STATUS_CX + 3.2}
                    y2={cy + 3.2}
                  />
                  <line
                    x1={STATUS_CX + 3.2}
                    y1={cy - 3.2}
                    x2={STATUS_CX - 3.2}
                    y2={cy + 3.2}
                  />
                </g>
              )}
            </g>
          </g>
        );
      })}

      {/* Interactive cells: hover ghost + placed notes */}
      {Array.from({ length: STRINGS }).flatMap((_, row) => {
        const stringIdx = STRINGS - 1 - row;
        const cy = rowY(row);
        return Array.from({ length: FRETS_SHOWN }).map((__, i) => {
          const fret = i + 1;
          const cx = fretX(fret);
          const isActive = frets[stringIdx] === fret;
          const name = noteAt(stringIdx, fret, spelling);
          return (
            <g key={`cell-${stringIdx}-${fret}`} className="fret-cell">
              <rect
                x={NUT_X + (fret - 1) * CELL_W}
                y={cy - CELL_H / 2}
                width={CELL_W}
                height={CELL_H}
                fill="transparent"
                onClick={() => onCellClick(stringIdx, fret)}
              >
                <title>{`${STRING_NAMES[stringIdx]} string, fret ${fret} — ${name}`}</title>
              </rect>

              {isActive ? (
                <g className="pointer-events-none">
                  <circle
                    cx={cx}
                    cy={cy}
                    r={NOTE_R}
                    fill="var(--accent-9)"
                    filter="url(#noteShadow)"
                  />
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={name.length > 1 ? 9.5 : 11}
                    fontWeight={700}
                    fill="var(--accent-contrast)"
                  >
                    {name}
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
                    {name}
                  </text>
                </g>
              )}
            </g>
          );
        });
      })}
    </svg>
  );
}

function ResultPanel({
  result,
  frets,
  spelling,
}: {
  result: ReturnType<typeof identifyChord>;
  frets: Fret[];
  spelling: Spelling;
}) {
  if (result.midi.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Click the fretboard to place notes. Use ○ for open strings and × to mute.
      </div>
    );
  }

  if (result.matches.length === 0) {
    const notes = result.midi.map((m) => noteName(m % 12, spelling)).join(" ");
    return (
      <div className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          No chord identified
        </p>
        <p className="mt-3 text-base">
          {result.midi.length < 2
            ? "Add at least three different notes."
            : result.pitchClasses.length < 3
              ? `Played: ${notes}. Need three distinct pitch classes.`
              : `Played: ${notes}. No standard chord matches this set of notes.`}
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
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          Most likely
        </p>
        <p className="mt-2 text-5xl sm:text-6xl font-bold text-accent-11 tracking-tight">
          {primaryName}
        </p>
        {matchExplanation(primary, spelling) && (
          <p className="mt-2 text-sm text-muted-foreground">
            {matchExplanation(primary, spelling)}
          </p>
        )}

        <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Notes</dt>
          <dd className="font-mono">{notesLowToHigh}</dd>
          <dt className="text-muted-foreground">Intervals</dt>
          <dd className="font-mono">{intervalLabels}</dd>
        </dl>

        {alternates.length > 0 && (
          <div className="mt-6">
            <p className="text-sm uppercase tracking-widest text-muted-foreground mb-2">
              Other interpretations
            </p>
            <ul className="space-y-1.5">
              {alternates.slice(0, 6).map((m, i) => {
                const name = chordName(m, spelling);
                const why = matchExplanation(m, spelling);
                return (
                  <li
                    key={`${name}-${i}`}
                    className="flex items-baseline gap-3 text-sm"
                  >
                    <span className="font-medium min-w-[5ch]">{name}</span>
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
        <ChordDiagram name={primaryName} frets={diagramFrets} />
      </div>
    </div>
  );
}
