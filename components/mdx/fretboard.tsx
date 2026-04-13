import * as React from "react";

type Marker = {
  string: number; // 1 = high E (top visual), 6 = low E (bottom)
  fret: number; // 1-based; 0 = open (not rendered as dot)
  label?: string;
  color?: string;
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

export function Fretboard({
  frets = 12,
  strings = 6,
  markers = [],
  startFret = 0,
  tuning = STRING_NAMES_STD,
  caption,
}: FretboardProps) {
  const cellW = 44;
  const cellH = 26;
  const padX = 36;
  const padY = 22;
  const width = padX * 2 + cellW * frets;
  const height = padY * 2 + cellH * (strings - 1);

  const inlayFrets = [3, 5, 7, 9, 15, 17, 19, 21].map((n) => n - startFret);
  const doubleInlay = [12, 24].map((n) => n - startFret);

  return (
    <figure className="my-6 overflow-x-auto">
      <svg
        role="img"
        aria-label={caption ?? "Guitar fretboard"}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-full h-auto text-foreground"
      >
        {/* Fretboard background */}
        <rect
          x={padX}
          y={padY}
          width={cellW * frets}
          height={cellH * (strings - 1)}
          fill="none"
        />

        {/* Inlays */}
        {inlayFrets
          .filter((f) => f > 0 && f <= frets)
          .map((f) => (
            <circle
              key={`inlay-${f}`}
              cx={padX + cellW * (f - 0.5)}
              cy={padY + (cellH * (strings - 1)) / 2}
              r={4}
              fill="currentColor"
              opacity={0.15}
            />
          ))}
        {doubleInlay
          .filter((f) => f > 0 && f <= frets)
          .map((f) => (
            <g key={`dinlay-${f}`}>
              <circle
                cx={padX + cellW * (f - 0.5)}
                cy={padY + cellH * 0.8}
                r={4}
                fill="currentColor"
                opacity={0.15}
              />
              <circle
                cx={padX + cellW * (f - 0.5)}
                cy={padY + cellH * (strings - 1.8)}
                r={4}
                fill="currentColor"
                opacity={0.15}
              />
            </g>
          ))}

        {/* Frets (vertical lines) */}
        {Array.from({ length: frets + 1 }).map((_, i) => (
          <line
            key={`f-${i}`}
            x1={padX + i * cellW}
            y1={padY}
            x2={padX + i * cellW}
            y2={padY + cellH * (strings - 1)}
            stroke="currentColor"
            strokeWidth={i === 0 && startFret === 0 ? 4 : 1.5}
            opacity={0.5}
          />
        ))}

        {/* Strings (horizontal lines) */}
        {Array.from({ length: strings }).map((_, i) => (
          <line
            key={`s-${i}`}
            x1={padX}
            y1={padY + i * cellH}
            x2={padX + cellW * frets}
            y2={padY + i * cellH}
            stroke="currentColor"
            strokeWidth={1.25}
            opacity={0.75}
          />
        ))}

        {/* Tuning labels */}
        {tuning.slice(0, strings).map((t, i) => (
          <text
            key={`t-${i}`}
            x={padX - 10}
            y={padY + i * cellH + 4}
            textAnchor="end"
            fontSize={12}
            fill="currentColor"
            opacity={0.6}
          >
            {t}
          </text>
        ))}

        {/* Fret number (when starting above 0) */}
        {startFret > 0 && (
          <text
            x={padX + cellW * 0.5}
            y={padY - 6}
            textAnchor="middle"
            fontSize={11}
            fill="currentColor"
            opacity={0.6}
          >
            {startFret + 1}fr
          </text>
        )}

        {/* Markers */}
        {markers.map((m, idx) => {
          const absFret = m.fret - startFret;
          if (absFret <= 0 || absFret > frets) return null;
          const cx = padX + cellW * (absFret - 0.5);
          const cy = padY + (m.string - 1) * cellH;
          return (
            <g key={idx}>
              <circle
                cx={cx}
                cy={cy}
                r={10}
                fill={m.color ?? "currentColor"}
              />
              {m.label && (
                <text
                  x={cx}
                  y={cy + 3.5}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={600}
                  fill="var(--background)"
                >
                  {m.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
