import * as React from "react";

type ChordDiagramProps = {
  name?: string;
  /** Frets per string from low E to high E. Use "x" for muted, 0 for open. e.g. "x32010" or [null,3,2,0,1,0] */
  frets: string | Array<number | "x" | null>;
  /** Optional finger numbers, same order, 1-4, 0/null for none */
  fingers?: Array<number | null>;
  baseFret?: number;
  /** Number of frets to render */
  numFrets?: number;
};

function parseFrets(
  frets: ChordDiagramProps["frets"],
): Array<number | "x" | null> {
  if (Array.isArray(frets)) return frets;
  return frets.split("").map((c) => {
    if (c === "x" || c === "X") return "x";
    const n = parseInt(c, 10);
    return Number.isNaN(n) ? null : n;
  });
}

export function ChordDiagram({
  name,
  frets,
  fingers,
  baseFret = 1,
  numFrets = 5,
}: ChordDiagramProps) {
  const parsed = parseFrets(frets);
  const strings = parsed.length; // 6 for guitar
  const cellW = 22;
  const cellH = 26;
  const padX = 18;
  const padTop = 36;
  const padBottom = 14;
  const width = padX * 2 + cellW * (strings - 1);
  const height = padTop + padBottom + cellH * numFrets;

  // Derive displayed base fret: if all fretted notes fall above numFrets, shift
  const fretted = parsed.filter(
    (v): v is number => typeof v === "number" && v > 0,
  );
  const min = fretted.length ? Math.min(...fretted) : 0;
  const max = fretted.length ? Math.max(...fretted) : 0;
  const shift =
    baseFret === 1 && max > numFrets ? Math.max(1, min - 0) : baseFret;
  const nutVisible = shift === 1;

  const usesSixthString = parsed[0] !== "x" && parsed[0] !== null;
  const usesFirstString =
    parsed[strings - 1] !== "x" && parsed[strings - 1] !== null;
  const labelOnLeft = !usesSixthString && usesFirstString;

  return (
    <figure className="my-4 inline-block mx-2 align-top">
      <svg
        role="img"
        aria-label={name ? `${name} chord diagram` : "Chord diagram"}
        viewBox={`0 0 ${width} ${height}`}
        width={width * 1.6}
        height={height * 1.6}
        className="text-foreground"
      >
        {name && (
          <text
            x={width / 2}
            y={14}
            textAnchor="middle"
            fontSize={14}
            fontWeight={600}
            fill="currentColor"
          >
            {name}
          </text>
        )}

        {/* Top nut or base fret marker */}
        {nutVisible ? (
          <rect
            x={padX - 1}
            y={padTop - 4}
            width={cellW * (strings - 1) + 2}
            height={4}
            fill="currentColor"
          />
        ) : (
          <text
            x={labelOnLeft ? padX - 6 : padX + cellW * (strings - 1) + 6}
            y={padTop + cellH * 0.7}
            textAnchor={labelOnLeft ? "end" : "start"}
            fontSize={8}
            fill="currentColor"
            opacity={0.7}
          >
            {shift}fr
          </text>
        )}

        {/* Frets */}
        {Array.from({ length: numFrets + 1 }).map((_, i) => (
          <line
            key={`f-${i}`}
            x1={padX}
            y1={padTop + i * cellH}
            x2={padX + cellW * (strings - 1)}
            y2={padTop + i * cellH}
            stroke="currentColor"
            strokeWidth={1}
            opacity={0.5}
          />
        ))}

        {/* Strings */}
        {Array.from({ length: strings }).map((_, i) => (
          <line
            key={`s-${i}`}
            x1={padX + i * cellW}
            y1={padTop}
            x2={padX + i * cellW}
            y2={padTop + cellH * numFrets}
            stroke="currentColor"
            strokeWidth={1}
            opacity={0.6}
          />
        ))}

        {/* Open/muted markers above nut */}
        {parsed.map((v, i) => {
          const cx = padX + i * cellW;
          if (v === "x") {
            return (
              <text
                key={`m-${i}`}
                x={cx}
                y={padTop - 8}
                textAnchor="middle"
                fontSize={12}
                fill="currentColor"
                opacity={0.75}
              >
                ×
              </text>
            );
          }
          if (v === 0) {
            return (
              <circle
                key={`m-${i}`}
                cx={cx}
                cy={padTop - 10}
                r={4}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.25}
              />
            );
          }
          return null;
        })}

        {/* Fretted notes */}
        {parsed.map((v, i) => {
          if (typeof v !== "number" || v === 0) return null;
          const displayFret = v - shift + 1;
          if (displayFret < 1 || displayFret > numFrets) return null;
          const cx = padX + i * cellW;
          const cy = padTop + (displayFret - 0.5) * cellH;
          const finger = fingers?.[i];
          return (
            <g key={`n-${i}`}>
              <circle cx={cx} cy={cy} r={8.5} fill="currentColor" />
              {finger ? (
                <text
                  x={cx}
                  y={cy + 3.5}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={600}
                  fill="var(--background)"
                >
                  {finger}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
