"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  parseChordSymbol,
  parseKeyName,
  getChordFunction,
  detectIIVIPatterns,
  chordQualityFromCategory,
  type ChordFunction,
  type FlatChord,
} from "@/lib/song-analysis";
import {
  STRING_SETS,
  INVERSION_NAMES,
  INTERVAL_LABELS,
  QUALITY_LABELS,
  computeDrop2Voicing,
  noteName,
  type ChordQuality,
  type Voicing,
} from "@/lib/music";
import { VoicingDiagram } from "./voicing-diagram";

export type SongBar = {
  chord?: string;
  chords?: string[];
};

export type SongSection = {
  label: string;
  bars: SongBar[];
};

type Props = {
  sections: SongSection[];
  songKey: string;
};

function normalizeBar(bar: SongBar): string[] {
  if (bar.chords) return bar.chords;
  if (bar.chord) return [bar.chord];
  return [];
}

const FUNCTION_COLORS: Record<ChordFunction, string> = {
  tonic: "bg-accent-3 border-accent-7 text-accent-12",
  subdominant: "bg-blue-50 border-blue-300 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200",
  dominant: "bg-orange-50 border-orange-300 text-orange-900 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-200",
  other: "bg-muted border-border text-foreground",
};

const FUNCTION_LABELS: Record<ChordFunction, string> = {
  tonic: "T",
  subdominant: "SD",
  dominant: "D",
  other: "",
};

type IIVILookup = Map<string, { label: string }>;

export function SongChart({ sections, songKey }: Props) {
  const keyRoot = parseKeyName(songKey);
  const [popover, setPopover] = useState<PopoverState>(null);

  const openVoicings = useCallback((chordSymbol: string) => {
    const parsed = parseChordSymbol(chordSymbol);
    if (!parsed) return;
    const quality = chordQualityFromCategory(parsed.category);
    if (!quality) return;
    setPopover({ root: parsed.root, quality, chordSymbol });
  }, []);

  const iiviLookup = useMemo<IIVILookup>(() => {
    const flatChords: FlatChord[] = [];
    sections.forEach((section, si) => {
      section.bars.forEach((bar, bi) => {
        normalizeBar(bar).forEach((chord, ci) => {
          flatChords.push({
            chord,
            provenance: { sectionIndex: si, barIndex: bi, chordIndex: ci },
          });
        });
      });
    });

    const patterns = detectIIVIPatterns(flatChords);
    const lookup: IIVILookup = new Map();
    const iiviLabels = ["ii", "V", "I"];

    for (const p of patterns) {
      for (let j = 0; j < p.provenances.length; j++) {
        const prov = p.provenances[j];
        const key = `${prov.sectionIndex}-${prov.barIndex}-${prov.chordIndex}`;
        lookup.set(key, { label: iiviLabels[j] });
      }
    }

    return lookup;
  }, [sections]);

  return (
    <div className="not-prose space-y-6">
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="font-medium text-muted-foreground">Functions:</span>
        {(["tonic", "subdominant", "dominant"] as const).map((fn) => (
          <span key={fn} className="flex items-center gap-1.5">
            <span
              className={cn(
                "inline-block h-3 w-3 rounded-sm border",
                FUNCTION_COLORS[fn],
              )}
            />
            <span className="text-muted-foreground capitalize">{fn}</span>
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-6 rounded-sm border-2 border-dashed border-accent-9" />
          <span className="text-muted-foreground">ii-V-I</span>
        </span>
      </div>

      {sections.map((section, sectionIndex) => {
        const bars = section.bars.map((bar, barIndex) => {
          const chords = normalizeBar(bar);
          const isMulti = chords.length > 1;

          const hasAnyIIVI = chords.some((_, ci) =>
            iiviLookup.has(`${sectionIndex}-${barIndex}-${ci}`),
          );

          return (
            <div
              key={barIndex}
              className={cn(
                "relative overflow-hidden rounded-lg border min-h-[3.5rem] sm:min-h-[4rem] transition-colors",
                isMulti ? "flex" : "flex flex-col items-center justify-center",
                !isMulti && FUNCTION_COLORS[getBarFunction(chords[0], keyRoot)],
                isMulti && "border-border",
                hasAnyIIVI && "ring-2 ring-accent-9 ring-offset-1 ring-offset-background",
              )}
            >
              {isMulti ? (
                chords.map((chord, ci) => {
                  const parsed = parseChordSymbol(chord);
                  const fn = parsed ? getChordFunction(parsed, keyRoot) : "other";
                  const iiviInfo = iiviLookup.get(`${sectionIndex}-${barIndex}-${ci}`);

                  return (
                    <button
                      key={ci}
                      type="button"
                      onClick={() => openVoicings(chord)}
                      className={cn(
                        "flex flex-1 flex-col items-center justify-center p-1.5 sm:p-2 cursor-pointer hover:brightness-95 dark:hover:brightness-110 transition-all",
                        FUNCTION_COLORS[fn],
                        ci > 0 && "border-l border-inherit",
                      )}
                    >
                      <span className="text-xs sm:text-sm font-semibold leading-tight">
                        {chord}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        {fn !== "other" && (
                          <span className="text-[9px] font-medium opacity-70">
                            {FUNCTION_LABELS[fn]}
                          </span>
                        )}
                        {iiviInfo && (
                          <span className="text-[9px] font-bold text-accent-11">
                            {iiviInfo.label}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <SingleChordCell
                  chord={chords[0]}
                  keyRoot={keyRoot}
                  iiviInfo={iiviLookup.get(`${sectionIndex}-${barIndex}-0`)}
                  onChordClick={openVoicings}
                />
              )}
            </div>
          );
        });

        return (
          <div key={`${section.label}-${sectionIndex}`}>
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-full bg-accent-3 border border-accent-6 px-2.5 py-0.5 text-xs font-semibold text-accent-11">
                {section.label}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {bars}
            </div>
          </div>
        );
      })}

      {popover && (
        <ChordVoicingPopover
          root={popover.root}
          quality={popover.quality}
          chordSymbol={popover.chordSymbol}
          onClose={() => setPopover(null)}
        />
      )}
    </div>
  );
}

function SingleChordCell({
  chord,
  keyRoot,
  iiviInfo,
  onChordClick,
}: {
  chord: string;
  keyRoot: number;
  iiviInfo?: { label: string };
  onChordClick: (chord: string) => void;
}) {
  const parsed = parseChordSymbol(chord);
  const fn = parsed ? getChordFunction(parsed, keyRoot) : "other";

  return (
    <button
      type="button"
      onClick={() => onChordClick(chord)}
      className="flex flex-col items-center justify-center p-2 sm:p-3 w-full cursor-pointer hover:brightness-95 dark:hover:brightness-110 transition-all"
    >
      <span className="text-sm sm:text-base font-semibold leading-tight">
        {chord}
      </span>
      <div className="flex items-center gap-1 mt-0.5">
        {fn !== "other" && (
          <span className="text-[10px] font-medium opacity-70">
            {FUNCTION_LABELS[fn]}
          </span>
        )}
        {iiviInfo && (
          <span className="text-[10px] font-bold text-accent-11">
            {iiviInfo.label}
          </span>
        )}
      </div>
    </button>
  );
}

function getBarFunction(chord: string, keyRoot: number): ChordFunction {
  const parsed = parseChordSymbol(chord);
  return parsed ? getChordFunction(parsed, keyRoot) : "other";
}

function buildPopoverLabels(
  voicing: Voicing,
  root: number,
  stringSetIndex: number,
): (string | null)[] {
  const labels: (string | null)[] = [null, null, null, null, null, null];
  const indices = STRING_SETS[stringSetIndex].indices;
  for (let i = 0; i < 4; i++) {
    const si = indices[i];
    labels[si] = INTERVAL_LABELS[voicing.intervals[i]] ?? String(voicing.intervals[i]);
  }
  return labels;
}

function buildPopoverHighlights(voicing: Voicing, stringSetIndex: number): (boolean | null)[] {
  const highlights: (boolean | null)[] = [null, null, null, null, null, null];
  const indices = STRING_SETS[stringSetIndex].indices;
  for (let i = 0; i < 4; i++) {
    highlights[indices[i]] = voicing.toneIndices[i] === 0;
  }
  return highlights;
}

type PopoverState = {
  root: number;
  quality: ChordQuality;
  chordSymbol: string;
} | null;

function ChordVoicingPopover({
  root,
  quality,
  chordSymbol,
  onClose,
}: {
  root: number;
  quality: ChordQuality;
  chordSymbol: string;
  onClose: () => void;
}) {
  const [stringSet, setStringSet] = useState(1);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  const voicings = [0, 1, 2, 3]
    .map((inv) => computeDrop2Voicing(root, quality, inv, stringSet))
    .sort((a, b) => a.midi[a.midi.length - 1] - b.midi[b.midi.length - 1]);

  const chordName = `${noteName(root, root)}${QUALITY_LABELS[quality]}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        ref={ref}
        className="relative mx-4 max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-background p-4 shadow-xl sm:p-6 max-w-lg w-full"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">{chordSymbol}</h3>
            <p className="text-xs text-muted-foreground">Drop-2 voicings</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Strings:</span>
          <div className="inline-flex rounded-full border border-border bg-muted/40 p-0.5">
            {STRING_SETS.map((s, i) => (
              <button
                key={s.label}
                onClick={() => setStringSet(i)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  i === stringSet
                    ? "bg-accent-9 text-accent-contrast shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 justify-items-center">
          {voicings.map((v, i) => (
            <VoicingDiagram
              key={i}
              name={chordName}
              subtitle={INVERSION_NAMES[v.inversionIndex]}
              frets={v.frets}
              labels={buildPopoverLabels(v, root, stringSet)}
              highlights={buildPopoverHighlights(v, stringSet)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
