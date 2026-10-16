import { degreeSpeller, type DegreeSpeller } from "./music";
import { ARPEGGIO_FORMULAS, type ArpeggioQuality } from "./arpeggios";

export type BaseQuality = "maj7" | "m7" | "7";

export const BASE_FORMULAS: Record<BaseQuality, readonly number[]> = {
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  "7": [0, 4, 7, 10],
};

export const BASE_SUFFIXES: Record<BaseQuality, string> = {
  maj7: "maj7",
  m7: "m7",
  "7": "7",
};

// Degree of every pitch class above the base chord's root. The same semitone
// reads differently per quality: 3 semitones is the ♭3 of a minor chord but
// the ♯9 of a dominant.
const BASE_DEGREES: Record<BaseQuality, Record<number, string>> = {
  maj7: { 0: "R", 1: "♭9", 2: "9", 3: "♯9", 4: "3", 5: "11", 6: "♯11", 7: "5", 8: "♭13", 9: "13", 10: "♭7", 11: "7" },
  m7: { 0: "R", 1: "♭9", 2: "9", 3: "♭3", 4: "3", 5: "11", 6: "♯11", 7: "5", 8: "♭13", 9: "13", 10: "♭7", 11: "7" },
  "7": { 0: "R", 1: "♭9", 2: "9", 3: "♯9", 4: "3", 5: "11", 6: "♯11", 7: "5", 8: "♭13", 9: "13", 10: "♭7", 11: "7" },
};

export type Superimposition = {
  id: string;
  /** Semitones from the base root to the superimposed arpeggio's root. */
  interval: number;
  quality: ArpeggioQuality;
  /** Roman-numeral name of the arpeggio relative to the base chord (triads get a localized "triad" suffix). */
  degree: string;
  /** Suffix of the chord the combination implies, e.g. "maj9". */
  result: string;
  /** Per-option degree overrides, e.g. ♭5 instead of ♯11 for a tritone sub. */
  labels?: Record<number, string>;
  /**
   * Degrees used only for spelling, when the arpeggio's own letter names beat
   * the functional ones (the ♯9 of G7 inside an E♭ triad is B♭, not A♯).
   */
  spellAs?: Record<number, string>;
};

export const SUPERIMPOSITIONS: Record<BaseQuality, Superimposition[]> = {
  maj7: [
    { id: "iii-m7", interval: 4, quality: "m7", degree: "iii m7", result: "maj9" },
    { id: "V-maj7", interval: 7, quality: "maj7", degree: "V maj7", result: "maj9(♯11)" },
    { id: "vii-m7", interval: 11, quality: "m7", degree: "vii m7", result: "maj13(♯11)" },
    { id: "II-triad", interval: 2, quality: "major", degree: "II", result: "maj13(♯11)" },
    { id: "vi-m7", interval: 9, quality: "m7", degree: "vi m7", result: "6" },
  ],
  m7: [
    { id: "bIII-maj7", interval: 3, quality: "maj7", degree: "♭III maj7", result: "m9" },
    { id: "v-m7", interval: 7, quality: "m7", degree: "v m7", result: "m11" },
    { id: "bVII-maj7", interval: 10, quality: "maj7", degree: "♭VII maj7", result: "m13" },
    { id: "ii-triad", interval: 2, quality: "minor", degree: "ii", result: "m13" },
  ],
  "7": [
    { id: "iii-m7b5", interval: 4, quality: "m7b5", degree: "iii m7♭5", result: "9" },
    { id: "v-m7", interval: 7, quality: "m7", degree: "v m7", result: "11" },
    { id: "bii-dim7", interval: 1, quality: "dim7", degree: "♭ii °7", result: "7♭9" },
    { id: "bV-7", interval: 6, quality: "7", degree: "♭V7", result: "7(♭9♯11)", labels: { 6: "♭5" } },
    { id: "II-triad", interval: 2, quality: "major", degree: "II", result: "13(♯11)" },
    { id: "bVI-triad", interval: 8, quality: "major", degree: "♭VI", result: "7alt", spellAs: { 3: "♭3" } },
  ],
};

export function getSuperimposition(base: BaseQuality, id: string): Superimposition {
  return SUPERIMPOSITIONS[base].find((s) => s.id === id) ?? SUPERIMPOSITIONS[base][0];
}

/** Degree of `interval` above the base root, honouring the option's overrides. */
export function baseDegree(base: BaseQuality, s: Superimposition, interval: number): string {
  const iv = ((interval % 12) + 12) % 12;
  return s.labels?.[iv] ?? BASE_DEGREES[base][iv];
}

/** Semitone intervals (from the base root) of the superimposed arpeggio's notes. */
export function superimposedIntervals(s: Superimposition): number[] {
  return ARPEGGIO_FORMULAS[s.quality].map((iv) => (s.interval + iv) % 12);
}

export function isBaseChordTone(base: BaseQuality, interval: number): boolean {
  return BASE_FORMULAS[base].includes(((interval % 12) + 12) % 12);
}

/**
 * Spells every note by its degree over the base chord, so the arpeggio's notes
 * keep the letter names they have in the base chord's scale (E G B D over C).
 * `rootName` pins the root to the key's spelling unless the enharmonic root
 * needs fewer accidentals: D♭m7's ♭III would be F♭maj7, so it reads as
 * C♯m7 → Emaj7 instead.
 */
export function superimpositionSpeller(
  root: number,
  base: BaseQuality,
  s: Superimposition,
  rootName?: string,
): DegreeSpeller {
  const intervals = [...new Set([...BASE_FORMULAS[base], ...superimposedIntervals(s)])];
  const degrees = Object.fromEntries(
    intervals.map((iv) => [iv, s.spellAs?.[iv] ?? baseDegree(base, s, iv)]),
  );
  const pinned = degreeSpeller(root, degrees, rootName);
  if (!rootName) return pinned;
  const free = degreeSpeller(root, degrees);
  return accidentalCost(free, intervals) < accidentalCost(pinned, intervals) ? free : pinned;
}

// Same weighting as degreeSpeller: a double accidental costs extra.
function accidentalCost(speller: DegreeSpeller, intervals: number[]): number {
  return intervals.reduce((sum, iv) => {
    const name = speller.spell(iv);
    if (/[𝄫𝄪]/u.test(name)) return sum + 4;
    return sum + (/[♭♯]/u.test(name) ? 1 : 0);
  }, 0);
}
