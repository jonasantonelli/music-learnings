"use client";

import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { KEY_OPTIONS, noteName } from "@/lib/music";
import {
  chordName,
  identifyChord,
  intervalLabelsForMatch,
  matchExplanation,
  type Fret,
  type FretInput,
} from "@/lib/chord-identify";
import { ChordDiagram } from "./mdx/chord-diagram";

const STRINGS = 6;
const FRETS_SHOWN = 15;
// index 0 = low E (string 6 visually), index 5 = high e (string 1 visually)
const STRING_NAMES = ["E", "A", "D", "G", "B", "e"];

const CELL_W = 30;
const CELL_H = 30;
const PAD_X = 18;
const PAD_Y = 18;
const SVG_W = PAD_X * 2 + CELL_W * FRETS_SHOWN;
const SVG_H = PAD_Y * 2 + CELL_H * (STRINGS - 1);

const INLAY_FRETS = [3, 5, 7, 9, 15, 17, 19, 21];
const DOUBLE_INLAY = [12, 24];

function freshFrets(): Fret[] {
  return ["x", "x", "x", "x", "x", "x"];
}

export function ChordIdentifier() {
  const [frets, setFrets] = useState<Fret[]>(freshFrets);
  const [keyCtx, setKeyCtx] = useState<number | undefined>(undefined);

  const setStringFret = useCallback((stringIdx: number, fret: Fret) => {
    setFrets((prev) => {
      const next = prev.slice();
      next[stringIdx] = fret;
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
        keyCtx={keyCtx}
        onKeyChange={setKeyCtx}
        onClear={onClear}
      />

      <FretboardInput
        frets={frets}
        onCellClick={onCellClick}
        onStringSet={setStringFret}
      />

      <ResultPanel result={result} frets={frets} keyCtx={keyCtx} />
    </div>
  );
}

function Toolbar({
  keyCtx,
  onKeyChange,
  onClear,
}: {
  keyCtx: number | undefined;
  onKeyChange: (v: number | undefined) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <label className="text-sm flex items-center gap-2">
        <span className="text-muted-foreground">Song key</span>
        <select
          value={keyCtx ?? ""}
          onChange={(e) =>
            onKeyChange(e.target.value === "" ? undefined : Number(e.target.value))
          }
          className="rounded-md border border-border bg-background px-2 py-1 text-sm"
        >
          <option value="">Auto (flats)</option>
          {KEY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.name}
            </option>
          ))}
        </select>
      </label>
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
  onCellClick,
  onStringSet,
}: {
  frets: Fret[];
  onCellClick: (stringIdx: number, fret: number) => void;
  onStringSet: (stringIdx: number, v: Fret) => void;
}) {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
      <div className="flex items-start gap-2 min-w-fit">
        {/* Per-string side controls */}
        <div
          className="grid"
          style={{
            gridTemplateRows: `repeat(${STRINGS}, ${CELL_H}px)`,
            paddingTop: PAD_Y - CELL_H / 2,
          }}
        >
          {Array.from({ length: STRINGS }).map((_, row) => {
            const stringIdx = STRINGS - 1 - row;
            const state = frets[stringIdx];
            return (
              <div
                key={row}
                className="flex items-center gap-1"
                style={{ height: CELL_H }}
              >
                <button
                  type="button"
                  onClick={() => onStringSet(stringIdx, "x")}
                  aria-label={`Mute ${STRING_NAMES[stringIdx]} string`}
                  className={cn(
                    "h-6 w-6 rounded text-xs font-medium border border-border flex items-center justify-center",
                    state === "x"
                      ? "bg-accent-9 text-accent-contrast border-accent-9"
                      : "text-muted-foreground hover:bg-card-hover",
                  )}
                >
                  ×
                </button>
                <button
                  type="button"
                  onClick={() => onStringSet(stringIdx, 0)}
                  aria-label={`Set ${STRING_NAMES[stringIdx]} string open`}
                  className={cn(
                    "h-6 w-6 rounded text-xs font-medium border border-border flex items-center justify-center",
                    state === 0
                      ? "bg-accent-9 text-accent-contrast border-accent-9"
                      : "text-muted-foreground hover:bg-card-hover",
                  )}
                >
                  ○
                </button>
                <span className="ml-1 w-3 text-xs text-muted-foreground">
                  {STRING_NAMES[stringIdx]}
                </span>
              </div>
            );
          })}
        </div>

        <FretboardSvg frets={frets} onCellClick={onCellClick} />
      </div>
    </div>
  );
}

function FretboardSvg({
  frets,
  onCellClick,
}: {
  frets: Fret[];
  onCellClick: (stringIdx: number, fret: number) => void;
}) {
  return (
    <svg
      role="img"
      aria-label="Interactive guitar fretboard. Click a fret to place a note on that string."
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      width={SVG_W}
      height={SVG_H}
      className="text-foreground"
    >
      {/* Inlays */}
      {INLAY_FRETS.filter((f) => f <= FRETS_SHOWN).map((f) => (
        <circle
          key={`inlay-${f}`}
          cx={PAD_X + (f - 0.5) * CELL_W}
          cy={PAD_Y + ((STRINGS - 1) * CELL_H) / 2}
          r={4}
          fill="currentColor"
          opacity={0.12}
        />
      ))}
      {DOUBLE_INLAY.filter((f) => f <= FRETS_SHOWN).map((f) => (
        <g key={`dinlay-${f}`}>
          <circle
            cx={PAD_X + (f - 0.5) * CELL_W}
            cy={PAD_Y + CELL_H * 0.7}
            r={4}
            fill="currentColor"
            opacity={0.12}
          />
          <circle
            cx={PAD_X + (f - 0.5) * CELL_W}
            cy={PAD_Y + CELL_H * (STRINGS - 1.7)}
            r={4}
            fill="currentColor"
            opacity={0.12}
          />
        </g>
      ))}

      {/* Frets */}
      {Array.from({ length: FRETS_SHOWN + 1 }).map((_, i) => (
        <line
          key={`f-${i}`}
          x1={PAD_X + i * CELL_W}
          y1={PAD_Y}
          x2={PAD_X + i * CELL_W}
          y2={PAD_Y + CELL_H * (STRINGS - 1)}
          stroke="currentColor"
          strokeWidth={i === 0 ? 3.5 : 1}
          opacity={0.55}
        />
      ))}

      {/* Strings */}
      {Array.from({ length: STRINGS }).map((_, row) => (
        <line
          key={`s-${row}`}
          x1={PAD_X}
          y1={PAD_Y + row * CELL_H}
          x2={PAD_X + CELL_W * FRETS_SHOWN}
          y2={PAD_Y + row * CELL_H}
          stroke="currentColor"
          strokeWidth={1.25}
          opacity={0.7}
        />
      ))}

      {/* Fret numbers below */}
      {Array.from({ length: FRETS_SHOWN }).map((_, i) => {
        const fret = i + 1;
        return (
          <text
            key={`fn-${fret}`}
            x={PAD_X + (fret - 0.5) * CELL_W}
            y={SVG_H - 4}
            textAnchor="middle"
            fontSize={9}
            fill="currentColor"
            opacity={0.45}
          >
            {fret}
          </text>
        );
      })}

      {/* Click cells */}
      {Array.from({ length: STRINGS }).flatMap((_, row) => {
        const stringIdx = STRINGS - 1 - row;
        const cy = PAD_Y + row * CELL_H;
        return Array.from({ length: FRETS_SHOWN }).map((__, i) => {
          const fret = i + 1;
          const cx = PAD_X + (fret - 0.5) * CELL_W;
          const isActive = frets[stringIdx] === fret;
          return (
            <g key={`cell-${stringIdx}-${fret}`}>
              <rect
                x={PAD_X + (fret - 1) * CELL_W}
                y={cy - CELL_H / 2}
                width={CELL_W}
                height={CELL_H}
                fill="transparent"
                className="cursor-pointer fretboard-cell"
                onClick={() => onCellClick(stringIdx, fret)}
              />
              {isActive && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={10}
                  fill="var(--accent-9)"
                  className="pointer-events-none"
                >
                  <title>{`${STRING_NAMES[stringIdx]} string, fret ${fret}`}</title>
                </circle>
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
  keyCtx,
}: {
  result: ReturnType<typeof identifyChord>;
  frets: Fret[];
  keyCtx: number | undefined;
}) {
  if (result.midi.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Click the fretboard to place notes. Use ○ for open strings and × to mute.
      </div>
    );
  }

  if (result.matches.length === 0) {
    const notes = result.midi.map((m) => noteName(m % 12, keyCtx)).join(" ");
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
  const primaryName = chordName(primary, keyCtx);
  const notesLowToHigh = result.midi
    .map((m) => noteName(m % 12, keyCtx))
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
        {matchExplanation(primary, keyCtx) && (
          <p className="mt-2 text-sm text-muted-foreground">
            {matchExplanation(primary, keyCtx)}
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
                const name = chordName(m, keyCtx);
                const why = matchExplanation(m, keyCtx);
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
