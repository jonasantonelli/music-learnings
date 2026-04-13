type VoicingDiagramProps = {
  name?: string;
  subtitle?: string;
  frets: (number | null)[]; // 6 elements, null = muted
  labels?: (string | null)[]; // 6 elements, text on dots
  highlights?: (boolean | null)[]; // 6 elements, true = accent color
  numFrets?: number;
};

export function VoicingDiagram({
  name,
  subtitle,
  frets,
  labels,
  highlights,
  numFrets = 5,
}: VoicingDiagramProps) {
  const strings = frets.length;
  const played = frets.filter((f): f is number => f !== null);
  const minFret = played.length ? Math.min(...played) : 0;
  const maxFret = played.length ? Math.max(...played) : 0;

  let displayFrets = numFrets;
  let baseFret = 1;

  if (maxFret > displayFrets) {
    baseFret = Math.max(1, minFret);
    while (maxFret - baseFret + 1 > displayFrets) displayFrets++;
  }
  if (minFret === 0 && maxFret <= displayFrets) {
    baseFret = 1;
  }

  const nutVisible = baseFret === 1;
  const cellW = 22;
  const cellH = 26;
  const padX = 18;
  const padRight = padX + 24; // fixed width — always reserve space for "fr" label
  const padTop = name ? (subtitle ? 52 : 36) : 20;
  const padBottom = 14;
  const width = padX + padRight + cellW * (strings - 1);
  const height = padTop + padBottom + cellH * displayFrets;

  return (
    <figure className="my-2 inline-flex flex-col mx-1 align-top" style={{ width: width * 1.6 }}>
      <svg
        role="img"
        aria-label={name ? `${name} voicing` : "Voicing diagram"}
        viewBox={`0 0 ${width} ${height}`}
        className="text-foreground w-full h-auto"
      >
        {name && (
          <text
            x={width / 2}
            y={14}
            textAnchor="middle"
            fontSize={13}
            fontWeight={600}
            fill="currentColor"
          >
            {name}
          </text>
        )}
        {subtitle && (
          <text
            x={width / 2}
            y={30}
            textAnchor="middle"
            fontSize={10}
            fill="currentColor"
            opacity={0.6}
          >
            {subtitle}
          </text>
        )}

        {/* Nut or position marker */}
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
            x={padX + cellW * (strings - 1) + 6}
            y={padTop + cellH * 0.7}
            fontSize={10}
            fill="currentColor"
            opacity={0.7}
          >
            {baseFret}fr
          </text>
        )}

        {/* Frets (horizontal) */}
        {Array.from({ length: displayFrets + 1 }).map((_, i) => (
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

        {/* Strings (vertical) */}
        {Array.from({ length: strings }).map((_, i) => (
          <line
            key={`s-${i}`}
            x1={padX + i * cellW}
            y1={padTop}
            x2={padX + i * cellW}
            y2={padTop + cellH * displayFrets}
            stroke="currentColor"
            strokeWidth={1}
            opacity={0.6}
          />
        ))}

        {/* Open / muted indicators above nut */}
        {frets.map((v, i) => {
          const cx = padX + i * cellW;
          if (v === null)
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
          if (v === 0)
            return (
              <g key={`m-${i}`}>
                <circle
                  cx={cx}
                  cy={padTop - 10}
                  r={4}
                  fill={highlights?.[i] ? "var(--accent-9)" : "none"}
                  stroke={highlights?.[i] ? "var(--accent-9)" : "currentColor"}
                  strokeWidth={1.25}
                />
                {labels?.[i] && (
                  <text
                    x={cx}
                    y={padTop - 20}
                    textAnchor="middle"
                    fontSize={8}
                    fill={highlights?.[i] ? "var(--accent-9)" : "currentColor"}
                    opacity={0.7}
                  >
                    {labels[i]}
                  </text>
                )}
              </g>
            );
          return null;
        })}

        {/* Fretted notes with labels */}
        {frets.map((v, i) => {
          if (v === null || v === 0) return null;
          const df = v - baseFret + 1;
          if (df < 1 || df > displayFrets) return null;
          const cx = padX + i * cellW;
          const cy = padTop + (df - 0.5) * cellH;
          const label = labels?.[i];
          return (
            <g key={`n-${i}`}>
              <circle cx={cx} cy={cy} r={8.5} fill={highlights?.[i] ? "var(--accent-9)" : "currentColor"} />
              {label && (
                <text
                  x={cx}
                  y={cy + 3.5}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight={600}
                  fill={highlights?.[i] ? "var(--accent-contrast)" : "var(--background)"}
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
