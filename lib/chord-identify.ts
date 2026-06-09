import { STRING_MIDI, noteName } from "./music";

export type Fret = number | "x"; // 0 = open string, "x" = muted, n>0 = fretted
export type FretInput = readonly Fret[]; // length 6, low E → high E

export type QualityDef = {
  /** Display suffix appended to the root name (e.g. "m7", "°7", "" for major). */
  symbol: string;
  /** Pitch classes from the root, ordered low → high. */
  intervals: readonly number[];
  /** Preference rank, lower = simpler/more common. Used to break ties. */
  rank: number;
  /** Per-interval label overrides (e.g. for °7 the 9 displays as "°7"). */
  labels?: Readonly<Record<number, string>>;
};

const DEFAULT_INTERVAL_LABEL: Readonly<Record<number, string>> = {
  0: "R",
  1: "♭9",
  2: "9",
  3: "♭3",
  4: "3",
  5: "11",
  6: "♭5",
  7: "5",
  8: "♯5",
  9: "13",
  10: "♭7",
  11: "7",
};

export const QUALITIES: readonly QualityDef[] = [
  // Triads
  { symbol: "", intervals: [0, 4, 7], rank: 1 },
  { symbol: "m", intervals: [0, 3, 7], rank: 1 },
  { symbol: "°", intervals: [0, 3, 6], rank: 2, labels: { 6: "♭5" } },
  { symbol: "+", intervals: [0, 4, 8], rank: 3, labels: { 8: "♯5" } },
  { symbol: "sus2", intervals: [0, 2, 7], rank: 3, labels: { 2: "2" } },
  { symbol: "sus4", intervals: [0, 5, 7], rank: 2, labels: { 5: "4" } },
  // 6 chords
  { symbol: "6", intervals: [0, 4, 7, 9], rank: 2, labels: { 9: "6" } },
  { symbol: "m6", intervals: [0, 3, 7, 9], rank: 2, labels: { 9: "6" } },
  // 7th chords
  { symbol: "maj7", intervals: [0, 4, 7, 11], rank: 1 },
  { symbol: "m7", intervals: [0, 3, 7, 10], rank: 1 },
  { symbol: "7", intervals: [0, 4, 7, 10], rank: 1 },
  { symbol: "m7♭5", intervals: [0, 3, 6, 10], rank: 2, labels: { 6: "♭5" } },
  { symbol: "°7", intervals: [0, 3, 6, 9], rank: 2, labels: { 6: "♭5", 9: "°7" } },
  { symbol: "m(maj7)", intervals: [0, 3, 7, 11], rank: 3 },
  { symbol: "maj7♯5", intervals: [0, 4, 8, 11], rank: 4, labels: { 8: "♯5" } },
  { symbol: "7♯5", intervals: [0, 4, 8, 10], rank: 4, labels: { 8: "♯5" } },
  { symbol: "7♭5", intervals: [0, 4, 6, 10], rank: 4, labels: { 6: "♭5" } },
  { symbol: "7sus4", intervals: [0, 5, 7, 10], rank: 3, labels: { 5: "4" } },
  // add9 (4 tones but a distinct quality, not a triad with omitted ext.)
  { symbol: "add9", intervals: [0, 2, 4, 7], rank: 2, labels: { 2: "9" } },
  { symbol: "m(add9)", intervals: [0, 2, 3, 7], rank: 2, labels: { 2: "9" } },
  // 5-note chords
  { symbol: "6/9", intervals: [0, 2, 4, 7, 9], rank: 3, labels: { 2: "9", 9: "6" } },
  { symbol: "m6/9", intervals: [0, 2, 3, 7, 9], rank: 4, labels: { 2: "9", 9: "6" } },
  { symbol: "maj9", intervals: [0, 2, 4, 7, 11], rank: 2, labels: { 2: "9" } },
  { symbol: "m9", intervals: [0, 2, 3, 7, 10], rank: 2, labels: { 2: "9" } },
  { symbol: "9", intervals: [0, 2, 4, 7, 10], rank: 2, labels: { 2: "9" } },
  { symbol: "9sus4", intervals: [0, 2, 5, 7, 10], rank: 3, labels: { 2: "9", 5: "4" } },
  { symbol: "7♭9", intervals: [0, 1, 4, 7, 10], rank: 3, labels: { 1: "♭9" } },
  { symbol: "7♯9", intervals: [0, 3, 4, 7, 10], rank: 3, labels: { 3: "♯9" } },
  { symbol: "7♯11", intervals: [0, 4, 6, 7, 10], rank: 3, labels: { 6: "♯11" } },
  { symbol: "7♭13", intervals: [0, 4, 7, 8, 10], rank: 3, labels: { 8: "♭13" } },
  { symbol: "maj7♯11", intervals: [0, 4, 6, 7, 11], rank: 3, labels: { 6: "♯11" } },
  // 6-note chords
  { symbol: "13", intervals: [0, 2, 4, 7, 9, 10], rank: 3, labels: { 2: "9", 9: "13" } },
  { symbol: "m13", intervals: [0, 2, 3, 7, 9, 10], rank: 4, labels: { 2: "9", 9: "13" } },
  { symbol: "m11", intervals: [0, 2, 3, 5, 7, 10], rank: 3, labels: { 2: "9", 5: "11" } },
  { symbol: "maj9♯11", intervals: [0, 2, 4, 6, 7, 11], rank: 4, labels: { 2: "9", 6: "♯11" } },
];

export type ChordMatch = {
  rootPc: number;
  bassPc: number;
  quality: QualityDef;
  /** Formula intervals NOT present in the played voicing (0–1 entries). */
  missing: readonly number[];
  /** Intervals from the root for every distinct pitch class actually played. */
  playedIntervals: readonly number[];
  score: number;
};

export type IdentifyResult = {
  /** Sounding pitches, low → high. Empty if nothing is played. */
  midi: number[];
  /** Unique pitch classes present in the voicing. */
  pitchClasses: number[];
  bassPc: number | null;
  matches: ChordMatch[];
};

export function fretsToMidi(frets: FretInput): number[] {
  const out: number[] = [];
  for (let i = 0; i < frets.length; i++) {
    const f = frets[i];
    if (typeof f === "number") out.push(STRING_MIDI[i] + f);
  }
  return out.sort((a, b) => a - b);
}

export function identifyChord(frets: FretInput): IdentifyResult {
  const midi = fretsToMidi(frets);
  if (midi.length === 0) {
    return { midi, pitchClasses: [], bassPc: null, matches: [] };
  }
  const bassPc = midi[0] % 12;
  const pcSet = new Set(midi.map((m) => m % 12));
  const pcs = [...pcSet].sort((a, b) => a - b);

  if (pcs.length < 3) {
    return { midi, pitchClasses: pcs, bassPc, matches: [] };
  }

  const matches: ChordMatch[] = [];

  for (const rootPc of pcs) {
    const intervalSet = new Set(pcs.map((p) => (p - rootPc + 12) % 12));

    for (const quality of QUALITIES) {
      const formulaSet = new Set(quality.intervals);
      const missing = quality.intervals.filter((i) => !intervalSet.has(i));
      let extras = 0;
      for (const i of intervalSet) if (!formulaSet.has(i)) extras++;

      if (extras > 0) continue;
      // Triads and tetrads (≤4 formula tones) must be exact — anything missing
      // would collapse them into a simpler chord that we'd already match below.
      if (quality.intervals.length <= 4 && missing.length > 0) continue;
      // 5+ note chords may omit only the root or the 5 (rootless / no-5
      // voicings); never the 3 or the characteristic extension.
      if (missing.length > 1) continue;
      if (missing.length === 1 && missing[0] !== 0 && missing[0] !== 7) continue;

      const playedIntervals = quality.intervals.filter((i) =>
        intervalSet.has(i),
      );

      let score = 1000 - quality.rank * 10;
      if (missing.length === 1) score -= 200;
      if (rootPc === bassPc) score += 100;

      matches.push({
        rootPc,
        bassPc,
        quality,
        missing,
        playedIntervals,
        score,
      });
    }
  }

  matches.sort((a, b) => b.score - a.score);
  return { midi, pitchClasses: pcs, bassPc, matches };
}

export function chordName(match: ChordMatch, keyContext?: number): string {
  const root = noteName(match.rootPc, keyContext);
  const bass = noteName(match.bassPc, keyContext);
  const slash = match.rootPc !== match.bassPc ? `/${bass}` : "";
  return `${root}${match.quality.symbol}${slash}`;
}

export function intervalLabel(quality: QualityDef, interval: number): string {
  return quality.labels?.[interval] ?? DEFAULT_INTERVAL_LABEL[interval] ?? "?";
}

/** Per-interval labels for the played notes (from root), in formula order. */
export function intervalLabelsForMatch(match: ChordMatch): string[] {
  return match.playedIntervals.map((i) => intervalLabel(match.quality, i));
}

/** Human-readable explanation appended to alternate names. */
export function matchExplanation(
  match: ChordMatch,
  keyContext?: number,
): string {
  const parts: string[] = [];
  if (match.missing.length > 0) {
    const labels = match.missing
      .map((i) => intervalLabel(match.quality, i))
      .join(" + ");
    parts.push(`omits ${labels}`);
  }
  if (match.rootPc !== match.bassPc) {
    parts.push(`${noteName(match.bassPc, keyContext)} in the bass`);
  }
  return parts.join("; ");
}
