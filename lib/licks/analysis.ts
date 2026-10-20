import { CHORD_FORMULAS, intervalLabel, type ChordQuality } from "@/lib/music";
import { parseChordSymbol, chordQualityFromCategory } from "@/lib/song-analysis";
import { roleForDegree, type DegreeRole } from "@/lib/degree-roles";
import { chordAt, pitchClassOf, type ParsedLick, type TimedChord } from "./notation";

export type NoteDegree = { label: string; role: DegreeRole };

// Tensions named by semitones above the root, for notes outside the chord.
const TENSION_LABELS: Record<number, string> = {
  1: "♭9",
  2: "9",
  3: "♯9",
  4: "3",
  5: "11",
  6: "♯11",
  8: "♭13",
  9: "13",
  10: "♭7",
  11: "7",
};

// Intervals that clash with each chord family: heard as chromatic passing
// notes rather than tensions (e.g. the ♭9 over a major 7th chord).
const PASSING: Partial<Record<ChordQuality, number[]>> = {
  maj7: [1, 3, 8, 10],
  "6": [1, 3, 8, 10],
  m7: [1, 4, 11],
  m6: [1, 4, 11],
  mMaj7: [1, 4, 10],
  "7": [11],
  m7b5: [4, 7, 11],
};

/** Quality of a chord symbol, with altered dominants ("G7b9") read as 7ths. */
export function chordQuality(symbol: string): { root: number; quality: ChordQuality } | null {
  const parsed = parseChordSymbol(symbol);
  if (!parsed) return null;
  const s = symbol.slice(parsed.rootName.length).toLowerCase();
  let quality = chordQualityFromCategory(parsed.category);
  if (parsed.category === "maj" && /^6/.test(s)) quality = "6";
  if (parsed.category === "min" && /^m6/.test(s)) quality = "m6";
  if (parsed.category === "min" && /^m(\(?maj|Δ)/.test(s)) quality = "mMaj7";
  return quality ? { root: parsed.root, quality } : null;
}

/** Degree of a pitch class over a chord, and the colour role it gets. */
export function degreeOver(pc: number, chordSymbol: string): NoteDegree | null {
  const chord = chordQuality(chordSymbol);
  if (!chord) return null;
  const interval = (((pc - chord.root) % 12) + 12) % 12;
  if (CHORD_FORMULAS[chord.quality].includes(interval)) {
    const label = intervalLabel(interval, chord.quality);
    return { label, role: roleForDegree(label) };
  }
  const label = TENSION_LABELS[interval] ?? String(interval);
  return { label, role: PASSING[chord.quality]?.includes(interval) ? "passing" : "color" };
}

/** Degree of every note of the lick over the chord sounding at that moment. */
export function lickDegrees(lick: ParsedLick, chords: TimedChord[]): (NoteDegree | null)[] {
  return lick.notes.map((n) => {
    if (!n.pitch) return null;
    const chord = chordAt(chords, n.start);
    return chord ? degreeOver(pitchClassOf(n.pitch), chord.symbol) : null;
  });
}
