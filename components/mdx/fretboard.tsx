"use client";

import * as React from "react";
import { NoteText } from "@/components/note-text";
import { defineMessages } from "@/lib/i18n";
import { useMessages } from "@/components/locale-provider";

const messages = defineMessages({
  en: {
    fretboard: "Guitar fretboard",
    fretNumber: (fret: number) => `${fret}fr`,
  },
  pt: {
    fretboard: "Braço da guitarra",
    fretNumber: (fret: number) => `${fret}ª casa`,
  },
  es: {
    fretboard: "Mástil de la guitarra",
    fretNumber: (fret: number) => `traste ${fret}`,
  },
});

type Marker = {
  string: number; // 1 = high E (top visual), 6 = low E (bottom)
  fret: number; // 1-based; 0 = open (not rendered as dot)
  label?: string;
  color?: string;
  labelColor?: string;
  stroke?: string;
};

type FretboardProps = {
  frets?: number;
  strings?: number;
  markers?: Marker[];
  startFret?: number;
  tuning?: string[]; // high to low
  caption?: string;
};

const STRING_NAMES_STD = ["e", "B", "G", "D", "A", "E"];

// Below ~80% of its natural width the horizontal board's dots and labels get
// too small to read, so narrow containers switch to a vertical board instead.
// Class names are spelled out in full so Tailwind can see them.
const ORIENTATION_BREAKPOINTS = [
  { minWidth: 320, horizontal: "hidden @min-[320px]:block", vertical: "@min-[320px]:hidden" },
  { minWidth: 400, horizontal: "hidden @min-[400px]:block", vertical: "@min-[400px]:hidden" },
  { minWidth: 480, horizontal: "hidden @min-[480px]:block", vertical: "@min-[480px]:hidden" },
  { minWidth: 560, horizontal: "hidden @min-[560px]:block", vertical: "@min-[560px]:hidden" },
  { minWidth: 640, horizontal: "hidden @min-[640px]:block", vertical: "@min-[640px]:hidden" },
];

const HORIZONTAL = { cellAlong: 44, cellAcross: 26, padAlong: 36, padAcross: 22 };
const VERTICAL = { cellAlong: 36, cellAcross: 40, padAlong: 30, padAcross: 30 };
const VERTICAL_FRET_NUMBERS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];

export function Fretboard({
  frets = 12,
  strings = 6,
  markers = [],
  startFret = 0,
  tuning = STRING_NAMES_STD,
  caption,
}: FretboardProps) {
  const t = useMessages(messages);
  const horizontalWidth = HORIZONTAL.padAlong * 2 + HORIZONTAL.cellAlong * frets;
  const breakpoint =
    ORIENTATION_BREAKPOINTS.find((b) => b.minWidth >= horizontalWidth * 0.8) ??
    ORIENTATION_BREAKPOINTS[ORIENTATION_BREAKPOINTS.length - 1];
  const props = { frets, strings, markers, startFret, tuning, label: caption ?? t.fretboard };

  return (
    <figure className="my-6 @container">
      <div className={breakpoint.horizontal}>
        <FretboardSvg {...props} />
      </div>
      <div className={breakpoint.vertical}>
        <FretboardSvg {...props} vertical />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

type FretboardSvgProps = Required<Omit<FretboardProps, "caption">> & {
  label: string;
  vertical?: boolean;
};

function FretboardSvg({
  frets,
  strings,
  markers,
  startFret,
  tuning,
  label,
  vertical = false,
}: FretboardSvgProps) {
  const t = useMessages(messages);
  const { cellAlong, cellAcross, padAlong, padAcross } = vertical ? VERTICAL : HORIZONTAL;
  const boardAlong = cellAlong * frets;
  const boardAcross = cellAcross * (strings - 1);
  const width = vertical ? padAcross * 2 + boardAcross : padAlong * 2 + boardAlong;
  const height = vertical ? padAlong + boardAlong + 14 : padAcross * 2 + boardAcross;

  // Maps a point on the neck to SVG coordinates. `along` counts frets from the
  // nut; `across` counts strings from high e (0) to low E (strings - 1). The
  // vertical board puts low E on the left, as in a chord diagram.
  const at = (along: number, across: number) =>
    vertical
      ? { x: padAcross + (strings - 1 - across) * cellAcross, y: padAlong + along * cellAlong }
      : { x: padAlong + along * cellAlong, y: padAcross + across * cellAcross };

  const inlayFrets = [3, 5, 7, 9, 15, 17, 19, 21].map((n) => n - startFret);
  const doubleInlay = [12, 24].map((n) => n - startFret);
  const nut = startFret === 0;

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${width} ${height}`}
      className={
        vertical
          ? "mx-auto block w-full max-w-[18rem] h-auto text-foreground"
          : "block w-full max-w-full h-auto text-foreground"
      }
    >
      {/* Inlays */}
      {inlayFrets
        .filter((f) => f > 0 && f <= frets)
        .map((f) => {
          const p = at(f - 0.5, (strings - 1) / 2);
          return <circle key={`inlay-${f}`} cx={p.x} cy={p.y} r={4} fill="var(--fret-inlay)" />;
        })}
      {doubleInlay
        .filter((f) => f > 0 && f <= frets)
        .map((f) => {
          const a = at(f - 0.5, 0.8);
          const b = at(f - 0.5, strings - 1.8);
          return (
            <g key={`dinlay-${f}`}>
              <circle cx={a.x} cy={a.y} r={4} fill="var(--fret-inlay)" />
              <circle cx={b.x} cy={b.y} r={4} fill="var(--fret-inlay)" />
            </g>
          );
        })}

      {/* Frets */}
      {Array.from({ length: frets + 1 }).map((_, i) => {
        const a = at(i, 0);
        const b = at(i, strings - 1);
        return (
          <line
            key={`f-${i}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={i === 0 && nut ? "var(--fret-nut)" : "var(--fret-wire)"}
            strokeWidth={i === 0 && nut ? 4 : 2}
          />
        );
      })}

      {/* Strings */}
      {Array.from({ length: strings }).map((_, i) => {
        const a = at(0, i);
        const b = at(frets, i);
        return (
          <line
            key={`s-${i}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="var(--fret-string)"
            strokeWidth={1 + i * 0.25}
          />
        );
      })}

      {/* Tuning labels */}
      {tuning.slice(0, strings).map((name, i) => {
        const p = at(0, i);
        return (
          <text
            key={`t-${i}`}
            x={vertical ? p.x : p.x - 10}
            y={vertical ? p.y - 10 : p.y + 4}
            textAnchor={vertical ? "middle" : "end"}
            fontSize={12}
            fill="currentColor"
            opacity={0.6}
          >
            {name}
          </text>
        );
      })}

      {/* Fret numbers: the vertical board is tall enough to lose your place,
          so it numbers the inlay frets; both number the first fret when the
          board starts above the nut. */}
      {vertical
        ? VERTICAL_FRET_NUMBERS.map((n) => n - startFret)
            .filter((f) => f > 1 && f <= frets)
            .map((f) => {
              const p = at(f - 0.5, strings - 1);
              return (
                <text
                  key={`n-${f}`}
                  x={p.x - 14}
                  y={p.y + 4}
                  textAnchor="end"
                  fontSize={10}
                  fill="currentColor"
                  opacity={0.5}
                >
                  {f + startFret}
                </text>
              );
            })
        : null}
      {startFret > 0 &&
        (() => {
          const p = vertical ? at(0.5, strings - 1) : at(0.5, 0);
          return (
            <text
              x={vertical ? p.x - 14 : p.x}
              y={vertical ? p.y + 4 : p.y - 6}
              textAnchor={vertical ? "end" : "middle"}
              fontSize={vertical ? 10 : 11}
              fill="currentColor"
              opacity={0.6}
            >
              {vertical ? startFret + 1 : t.fretNumber(startFret + 1)}
            </text>
          );
        })()}

      {/* Markers */}
      {markers.map((m, idx) => {
        const absFret = m.fret - startFret;
        if (absFret <= 0 || absFret > frets) return null;
        const { x: cx, y: cy } = at(absFret - 0.5, m.string - 1);
        return (
          <g key={idx}>
            <circle
              cx={cx}
              cy={cy}
              r={10}
              fill={m.color ?? "currentColor"}
              stroke={m.stroke}
              strokeWidth={m.stroke ? 1.5 : undefined}
            />
            {m.label && (
              <text
                x={cx}
                y={cy + 3.5}
                textAnchor="middle"
                fontSize={10}
                fontWeight={600}
                fontFamily="var(--app-mono), ui-monospace, monospace"
                fill={m.labelColor ?? "var(--background)"}
              >
                <NoteText svg text={m.label} />
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
