import { defineMessages, type Locale } from "./i18n";

export const NOTE_NAMES_SHARP = [
  "C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B",
];
export const NOTE_NAMES_FLAT = [
  "C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B",
];

const SHARP_KEYS = new Set([0, 2, 4, 7, 9, 11]); // C, D, E, G, A, B

/**
 * Spelling preference: a key's pitch class (sharps for sharp keys, else flats),
 * or an explicit `"sharp"` / `"flat"` override that ignores the key.
 */
export type Spelling = number | "sharp" | "flat";

export function noteName(pc: number, pref?: Spelling): string {
  const n = ((pc % 12) + 12) % 12;
  const useSharp =
    pref === "sharp"
      ? true
      : pref === "flat"
        ? false
        : typeof pref === "number" && SHARP_KEYS.has(pref);
  return useSharp ? NOTE_NAMES_SHARP[n] : NOTE_NAMES_FLAT[n];
}

// --- Degree-based spelling -------------------------------------------------
// `noteName` picks sharps/flats per key, which misspells altered degrees
// (C Dorian's ♭3 came out as D♯). Spelling by degree keeps letter names
// consecutive: the 3rd of C is always some kind of E.

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
const ACCIDENTALS: Record<number, string> = {
  [-2]: "𝄫",
  [-1]: "♭",
  0: "",
  1: "♯",
  2: "𝄪",
};

type ParsedNote = { letter: number; alter: number };

function parseNoteName(name: string): ParsedNote {
  const letter = LETTERS.indexOf(name[0]);
  let alter = 0;
  for (const ch of name.slice(1)) {
    if (ch === "♭" || ch === "b") alter--;
    else if (ch === "♯" || ch === "#") alter++;
  }
  return { letter, alter };
}

/**
 * Parse a degree label ("R", "♭3", "♯11", "°7", "13") into a letter offset
 * above the root and a semitone distance. Returns null for unknown labels.
 */
function parseDegree(label: string): { steps: number; semitones: number } | null {
  const m = /^(°|[♭♯b#]*)(R|\d+)$/.exec(label.trim());
  if (!m) return null;
  const n = m[2] === "R" ? 1 : Number(m[2]);
  if (n < 1) return null;
  let alter = 0;
  if (m[1] === "°") alter = -2; // diminished 7th
  else for (const ch of m[1]) alter += ch === "♭" || ch === "b" ? -1 : 1;
  const steps = (n - 1) % 7;
  return { steps, semitones: LETTER_PC[steps] + alter };
}

function spellFrom(root: ParsedNote, label: string): { name: string; alter: number } | null {
  const degree = parseDegree(label);
  if (!degree || root.letter < 0) return null;
  const letter = (root.letter + degree.steps) % 7;
  const target = LETTER_PC[root.letter] + root.alter + degree.semitones;
  // Distance from the natural letter to the target, folded into -6..5.
  const alter = ((((target - LETTER_PC[letter]) % 12) + 18) % 12) - 6;
  if (!(alter in ACCIDENTALS)) return null;
  return { name: LETTERS[letter] + ACCIDENTALS[alter], alter };
}

export type DegreeSpeller = {
  /** The root, spelled to minimise accidentals across the given degrees. */
  root: string;
  /** Spell the note `interval` semitones above the root. */
  spell: (interval: number) => string;
};

/**
 * Build a speller for a scale or chord from its degree labels, keyed by
 * semitone interval above the root (e.g. `{ 0: "R", 3: "♭3", 10: "♭7" }`).
 * Chooses between the sharp and flat spelling of the root, preferring the
 * one with fewer accidentals (double accidentals count extra); ties go flat.
 * Pass `rootName` to pin the root's spelling (e.g. to match a key).
 */
export function degreeSpeller(
  rootPc: number,
  degreesByInterval: Record<number, string>,
  rootName?: string,
): DegreeSpeller {
  const pc = ((rootPc % 12) + 12) % 12;
  const candidates = rootName
    ? [rootName]
    : [...new Set([NOTE_NAMES_FLAT[pc], NOTE_NAMES_SHARP[pc]])];
  const labels = Object.values(degreesByInterval);

  const cost = (rootName: string) => {
    const root = parseNoteName(rootName);
    return labels.reduce((sum, label) => {
      const spelled = spellFrom(root, label);
      if (!spelled) return sum + 10;
      const a = Math.abs(spelled.alter);
      return sum + (a === 2 ? 4 : a);
    }, 0);
  };

  const chosen = candidates.reduce((best, c) => (cost(c) < cost(best) ? c : best));
  const root = parseNoteName(chosen);

  return {
    root: chosen,
    spell: (interval: number) => {
      const label =
        degreesByInterval[interval] ?? degreesByInterval[((interval % 12) + 12) % 12];
      const spelled = label ? spellFrom(root, label) : null;
      return spelled?.name ?? noteName(pc + interval, pc);
    },
  };
}

export type ChordQuality =
  | "maj7"
  | "6"
  | "maj7#5"
  | "m7"
  | "m6"
  | "mMaj7"
  | "7"
  | "7sus4"
  | "7#5"
  | "7b5"
  | "m7b5"
  | "dim7";

/** Four chord tones per quality, in close-position order (slot 0 = root). */
export const CHORD_FORMULAS: Record<ChordQuality, readonly number[]> = {
  maj7: [0, 4, 7, 11],
  "6": [0, 4, 7, 9],
  "maj7#5": [0, 4, 8, 11],
  m7: [0, 3, 7, 10],
  m6: [0, 3, 7, 9],
  mMaj7: [0, 3, 7, 11],
  "7": [0, 4, 7, 10],
  "7sus4": [0, 5, 7, 10],
  "7#5": [0, 4, 8, 10],
  "7b5": [0, 4, 6, 10],
  m7b5: [0, 3, 6, 10],
  dim7: [0, 3, 6, 9],
};

/**
 * Degree label for each formula slot. Semitones alone are ambiguous — 9 is a
 * 6th in C6 but a diminished 7th in C°7 — so labels follow the chord.
 */
export const CHORD_TONE_LABELS: Record<ChordQuality, readonly string[]> = {
  maj7: ["R", "3", "5", "7"],
  "6": ["R", "3", "5", "6"],
  "maj7#5": ["R", "3", "♯5", "7"],
  m7: ["R", "♭3", "5", "♭7"],
  m6: ["R", "♭3", "5", "6"],
  mMaj7: ["R", "♭3", "5", "7"],
  "7": ["R", "3", "5", "♭7"],
  "7sus4": ["R", "4", "5", "♭7"],
  "7#5": ["R", "3", "♯5", "♭7"],
  "7b5": ["R", "3", "♭5", "♭7"],
  m7b5: ["R", "♭3", "♭5", "♭7"],
  dim7: ["R", "♭3", "♭5", "°7"],
};

export const QUALITY_LABELS: Record<ChordQuality, string> = {
  maj7: "maj7",
  "6": "6",
  "maj7#5": "maj7♯5",
  m7: "m7",
  m6: "m6",
  mMaj7: "m(maj7)",
  "7": "7",
  "7sus4": "7sus4",
  "7#5": "7♯5",
  "7b5": "7♭5",
  m7b5: "m7♭5",
  dim7: "dim7",
};

export const QUALITY_SUFFIXES: Record<ChordQuality, string> = {
  ...QUALITY_LABELS,
  dim7: "°7",
};

export type QualityFamilyId = "major" | "minor" | "dominant" | "diminished";

/** `label` is English; use `qualityFamilyLabel(id, locale)` in UI code. */
export const QUALITY_FAMILIES: {
  id: QualityFamilyId;
  label: string;
  qualities: ChordQuality[];
}[] = [
  { id: "major", label: "Major", qualities: ["maj7", "6", "maj7#5"] },
  { id: "minor", label: "Minor", qualities: ["m7", "m6", "mMaj7"] },
  { id: "dominant", label: "Dominant", qualities: ["7", "7sus4", "7#5", "7b5"] },
  { id: "diminished", label: "Diminished", qualities: ["m7b5", "dim7"] },
];

const QUALITY_FAMILY_LABELS = defineMessages<Record<QualityFamilyId, string>>({
  en: { major: "Major", minor: "Minor", dominant: "Dominant", diminished: "Diminished" },
  pt: { major: "Maior", minor: "Menor", dominant: "Dominante", diminished: "Diminuto" },
  es: { major: "Mayor", minor: "Menor", dominant: "Dominante", diminished: "Disminuido" },
});

export function qualityFamilyLabel(id: QualityFamilyId, locale: Locale): string {
  return QUALITY_FAMILY_LABELS[locale][id];
}

export const INTERVAL_LABELS: Record<number, string> = {
  0: "R",
  3: "♭3",
  4: "3",
  5: "4",
  6: "♭5",
  7: "5",
  8: "♯5",
  9: "°7",
  10: "♭7",
  11: "7",
};

export function intervalLabel(interval: number, quality: ChordQuality): string {
  const slot = CHORD_FORMULAS[quality].indexOf(interval);
  return slot >= 0
    ? CHORD_TONE_LABELS[quality][slot]
    : (INTERVAL_LABELS[interval] ?? String(interval));
}

// --- Colors (tensions) -----------------------------------------------------
// Tension intervals sit above the octave so labels and spelling stay unambiguous.

type Tension = { interval: number; label: string };

const T = {
  b9: { interval: 13, label: "♭9" },
  n9: { interval: 14, label: "9" },
  s9: { interval: 15, label: "♯9" },
  n11: { interval: 17, label: "11" },
  s11: { interval: 18, label: "♯11" },
  b13: { interval: 20, label: "♭13" },
  n13: { interval: 21, label: "13" },
} satisfies Record<string, Tension>;

/**
 * A color swaps chord tones for tensions while keeping four voices — the
 * standard way to extend a drop-2 shape. The root gives way to a 9 (♭9, ♯9)
 * and the 5th to a 13 (♭13, ♯11, 11); each tension sits a step from the tone
 * it replaces, so the shape barely changes. The 3rd and 7th — the guide
 * tones that define the chord — always stay.
 */
export type ChordColor = {
  id: string;
  suffix: string;
  /** formula slot → replacement tension */
  replace: Partial<Record<0 | 1 | 2 | 3, Tension>>;
};

export const CHORD_COLORS: Partial<Record<ChordQuality, ChordColor[]>> = {
  maj7: [
    { id: "9", suffix: "maj9", replace: { 0: T.n9 } },
    { id: "13", suffix: "maj7(13)", replace: { 2: T.n13 } },
    { id: "9-13", suffix: "maj13", replace: { 0: T.n9, 2: T.n13 } },
    { id: "#11", suffix: "maj7(♯11)", replace: { 2: T.s11 } },
    { id: "9-#11", suffix: "maj9(♯11)", replace: { 0: T.n9, 2: T.s11 } },
  ],
  "6": [{ id: "9", suffix: "6/9", replace: { 0: T.n9 } }],
  "maj7#5": [{ id: "9", suffix: "maj9♯5", replace: { 0: T.n9 } }],
  m7: [
    { id: "9", suffix: "m9", replace: { 0: T.n9 } },
    { id: "11", suffix: "m7(11)", replace: { 2: T.n11 } },
    { id: "9-11", suffix: "m11", replace: { 0: T.n9, 2: T.n11 } },
  ],
  m6: [{ id: "9", suffix: "m6/9", replace: { 0: T.n9 } }],
  mMaj7: [{ id: "9", suffix: "m(maj9)", replace: { 0: T.n9 } }],
  "7": [
    { id: "9", suffix: "9", replace: { 0: T.n9 } },
    { id: "13", suffix: "13", replace: { 2: T.n13 } },
    { id: "9-13", suffix: "13(9)", replace: { 0: T.n9, 2: T.n13 } },
    { id: "b9", suffix: "7♭9", replace: { 0: T.b9 } },
    { id: "#9", suffix: "7♯9", replace: { 0: T.s9 } },
    { id: "#11", suffix: "7♯11", replace: { 2: T.s11 } },
    { id: "b13", suffix: "7♭13", replace: { 2: T.b13 } },
    { id: "b9-13", suffix: "13♭9", replace: { 0: T.b9, 2: T.n13 } },
    { id: "b9-b13", suffix: "7♭9♭13", replace: { 0: T.b9, 2: T.b13 } },
    { id: "alt", suffix: "7alt", replace: { 0: T.s9, 2: T.b13 } },
  ],
  "7sus4": [
    { id: "9", suffix: "9sus4", replace: { 0: T.n9 } },
    { id: "13", suffix: "13sus4", replace: { 2: T.n13 } },
    { id: "b9", suffix: "7sus4(♭9)", replace: { 0: T.b9 } },
  ],
  "7#5": [
    { id: "9", suffix: "9♯5", replace: { 0: T.n9 } },
    { id: "b9", suffix: "7♯5♭9", replace: { 0: T.b9 } },
  ],
  "7b5": [
    { id: "9", suffix: "9♭5", replace: { 0: T.n9 } },
    { id: "b9", suffix: "7♭5♭9", replace: { 0: T.b9 } },
  ],
  m7b5: [
    { id: "9", suffix: "m9♭5", replace: { 0: T.n9 } },
  ],
};

export function getChordColor(quality: ChordQuality, colorId?: string): ChordColor | undefined {
  if (!colorId) return undefined;
  return CHORD_COLORS[quality]?.find((c) => c.id === colorId);
}

/** Intervals + degree labels per formula slot, after applying an optional color. */
export function resolveChordTones(
  quality: ChordQuality,
  colorId?: string,
): { intervals: number[]; labels: string[] } {
  const intervals = [...CHORD_FORMULAS[quality]];
  const labels = [...CHORD_TONE_LABELS[quality]];
  const color = getChordColor(quality, colorId);
  if (color) {
    for (const [slot, t] of Object.entries(color.replace)) {
      intervals[Number(slot)] = t.interval;
      labels[Number(slot)] = t.label;
    }
  }
  return { intervals, labels };
}

/** Spells a drop-2 chord (and its color) by degree; `rootName` pins the root to a key. */
export function chordSpeller(
  root: number,
  quality: ChordQuality,
  rootName?: string,
  colorId?: string,
): DegreeSpeller {
  const { intervals, labels } = resolveChordTones(quality, colorId);
  return degreeSpeller(
    root,
    Object.fromEntries(intervals.map((iv, i) => [iv, labels[i]])),
    rootName,
  );
}

/** Spells a V7♭9 — the diminished 7th a half step above the root sits on its ♭9, 3, 5, ♭7. */
export function dominantFlat9Speller(root: number, rootName?: string): DegreeSpeller {
  return degreeSpeller(root, { 0: "R", 1: "♭9", 4: "3", 7: "5", 10: "♭7" }, rootName);
}

// Standard tuning MIDI values: string 6 (low E) → string 1 (high E)
export const STRING_MIDI = [40, 45, 50, 55, 59, 64];

export const STRING_SETS = [
  { label: "6-5-4-3", indices: [0, 1, 2, 3] },
  { label: "5-4-3-2", indices: [1, 2, 3, 4] },
  { label: "4-3-2-1", indices: [2, 3, 4, 5] },
];

// Drop-2 voice arrangement per inversion (indices into chord formula, bottom→top).
// Inversions are named by the bass note, the usual guitar convention. Each is a
// close voicing with its 2nd voice from the top dropped an octave.
export const DROP2_VOICES: readonly (readonly number[])[] = [
  [0, 2, 3, 1], // Root position: R 5 7 3  (close 5 7 R 3)
  [1, 3, 0, 2], // 1st inversion: 3 7 R 5  (close 7 R 3 5)
  [2, 0, 1, 3], // 2nd inversion: 5 R 3 7  (close R 3 5 7)
  [3, 1, 2, 0], // 3rd inversion: 7 3 5 R  (close 3 5 7 R)
];

/** Inversion names per locale, indexed by inversion (0 = root position). */
export const INVERSION_NAMES_BY_LOCALE = defineMessages<readonly string[]>({
  en: ["Root Position", "1st Inversion", "2nd Inversion", "3rd Inversion"],
  pt: ["Posição fundamental", "1ª inversão", "2ª inversão", "3ª inversão"],
  es: ["Posición fundamental", "1.ª inversión", "2.ª inversión", "3.ª inversión"],
});

/** English inversion names (kept for existing callers). */
export const INVERSION_NAMES = INVERSION_NAMES_BY_LOCALE.en;

export function inversionName(index: number, locale: Locale): string {
  return INVERSION_NAMES_BY_LOCALE[locale][index] ?? INVERSION_NAMES[index] ?? "";
}

export type Voicing = {
  frets: (number | null)[]; // 6 elements, null = muted
  midi: number[]; // 4 pitches (one per voice, bottom→top)
  intervals: number[]; // 4 intervals in semitones from root
  labels: string[]; // 4 degree labels (R, ♭3, 9, 13…), one per voice
  toneIndices: number[]; // which chord-tone index per voice
  inversionIndex: number;
};

type VoiceCandidate = {
  fret: number;
  pitch: number;
  toneIdx: number;
  interval: number;
  label: string;
  si: number;
};

export function computeDrop2Voicing(
  root: number,
  quality: ChordQuality,
  inversionIndex: number,
  stringSetIndex: number,
  colorId?: string,
): Voicing {
  const { intervals: formula, labels: toneLabels } = resolveChordTones(quality, colorId);
  const voices = DROP2_VOICES[inversionIndex];
  const stringSet = STRING_SETS[stringSetIndex];

  // Build candidate frets for each voice (no open strings, max fret 19)
  const candidates: VoiceCandidate[][] = [];
  for (let i = 0; i < 4; i++) {
    const toneIdx = voices[i];
    const interval = formula[toneIdx];
    const pc = (root + interval) % 12;
    const si = stringSet.indices[i];
    const open = STRING_MIDI[si];

    let baseFret = ((pc - (open % 12)) + 12) % 12;
    if (baseFret === 0) baseFret = 12;

    const voiceCandidates: VoiceCandidate[] = [];
    for (let fret = baseFret; fret <= 19; fret += 12) {
      voiceCandidates.push({
        fret,
        pitch: open + fret,
        toneIdx,
        interval,
        label: toneLabels[toneIdx],
        si,
      });
    }
    candidates.push(voiceCandidates);
  }

  // Pick combination with ascending pitches and smallest fret span.
  // Near-nut shapes (min fret < 2) are penalized so the movable 12th-fret
  // version is preferred when one exists.
  let best: VoiceCandidate[] | null = null;
  let bestCost = Infinity;

  for (const c0 of candidates[0]) {
    for (const c1 of candidates[1]) {
      if (c1.pitch <= c0.pitch) continue;
      for (const c2 of candidates[2]) {
        if (c2.pitch <= c1.pitch) continue;
        for (const c3 of candidates[3]) {
          if (c3.pitch <= c2.pitch) continue;
          const allFrets = [c0.fret, c1.fret, c2.fret, c3.fret];
          const span = Math.max(...allFrets) - Math.min(...allFrets);
          const minFret = Math.min(...allFrets);
          const cost = span + (minFret < 2 ? 1000 : 0);
          if (cost < bestCost) {
            bestCost = cost;
            best = [c0, c1, c2, c3];
          }
        }
      }
    }
  }

  if (!best) best = candidates.map((c) => c[0]);

  const frets: (number | null)[] = [null, null, null, null, null, null];
  const midi: number[] = [];
  const intervals: number[] = [];
  const labels: string[] = [];
  const toneIndices: number[] = [];

  for (const c of best) {
    frets[c.si] = c.fret;
    midi.push(c.pitch);
    intervals.push(c.interval);
    labels.push(c.label);
    toneIndices.push(c.toneIdx);
  }

  return { frets, midi, intervals, labels, toneIndices, inversionIndex };
}

function shiftVoicing(v: Voicing, fretShift: number): Voicing {
  return {
    ...v,
    frets: v.frets.map((f) => (f === null ? null : f + fretShift)),
    midi: v.midi.map((m) => m + fretShift),
  };
}

function isPlayable(v: Voicing, minFret = 2): boolean {
  const played = v.frets.filter((f): f is number => f !== null);
  return played.length > 0 && played.every((f) => f >= minFret) && Math.max(...played) <= 19;
}

export function shiftVoicingOctave(v: Voicing, semitones: number): Voicing | null {
  const shifted = shiftVoicing(v, semitones);
  return isPlayable(shifted) ? shifted : null;
}

export function lowestFret(v: Voicing): number {
  return Math.min(...v.frets.filter((f): f is number => f !== null));
}

/**
 * Every playable position (frets 1–19) of every inversion on one string set,
 * ordered up the neck. Shapes low enough to repeat an octave higher appear twice.
 */
export function allDrop2Positions(
  root: number,
  quality: ChordQuality,
  stringSetIndex: number,
  colorId?: string,
): Voicing[] {
  const seen = new Set<string>();
  const out: Voicing[] = [];
  for (let inv = 0; inv < 4; inv++) {
    const base = computeDrop2Voicing(root, quality, inv, stringSetIndex, colorId);
    for (const shift of [-12, 0, 12]) {
      const v = shift === 0 ? base : shiftVoicing(base, shift);
      const key = v.frets.join(",");
      if (!isPlayable(v, 1) || seen.has(key)) continue;
      seen.add(key);
      out.push(v);
    }
  }
  return out.sort((a, b) => lowestFret(a) - lowestFret(b) || a.midi[0] - b.midi[0]);
}

export function voiceLeadingDistance(a: Voicing, b: Voicing): number {
  return a.midi.reduce((sum, p, i) => sum + Math.abs(p - b.midi[i]), 0);
}

export function findBestVoiceLeading(
  from: Voicing,
  root: number,
  quality: ChordQuality,
  stringSetIndex: number,
  colorId?: string,
): Voicing {
  const candidates: Voicing[] = [];

  for (let inv = 0; inv < 4; inv++) {
    const base = computeDrop2Voicing(root, quality, inv, stringSetIndex, colorId);
    for (const shift of [-12, 0, 12]) {
      const v = shift === 0 ? base : shiftVoicing(base, shift);
      if (isPlayable(v)) candidates.push(v);
    }
  }

  return candidates.reduce((best, v) =>
    voiceLeadingDistance(from, v) < voiceLeadingDistance(from, best) ? v : best,
  );
}

export function chordLabel(
  root: number,
  quality: ChordQuality,
  key?: Spelling,
  colorId?: string,
): string {
  const color = getChordColor(quality, colorId);
  return noteName(root, key) + (color ? color.suffix : QUALITY_SUFFIXES[quality]);
}

export type ProgressionChord = {
  root: number;
  quality: ChordQuality;
  degree: string;
  /** Color used when the progression is played with extensions */
  color?: string;
};

type ProgressionStep = {
  offset: number;
  quality: ChordQuality;
  degree: string;
  ext?: string;
};

export type ProgressionId = "major-251" | "minor-251" | "turnaround" | "rhythm" | "iii-vi-ii-v";

export type TonicMinor = "m7" | "m6" | "mMaj7";

export const PROGRESSIONS: {
  id: ProgressionId;
  label: string;
  steps: (tonicMinor: TonicMinor) => ProgressionStep[];
}[] = [
  {
    id: "major-251",
    label: "ii–V–I",
    steps: () => [
      { offset: 2, quality: "m7", degree: "ii", ext: "9" },
      { offset: 7, quality: "7", degree: "V", ext: "13" },
      { offset: 0, quality: "maj7", degree: "I", ext: "9" },
    ],
  },
  {
    id: "minor-251",
    label: "Minor ii–V–i",
    steps: (tonic) => [
      { offset: 2, quality: "m7b5", degree: "iiø", ext: "9" },
      { offset: 7, quality: "7", degree: "V", ext: "b9-b13" },
      { offset: 0, quality: tonic, degree: "i", ext: "9" },
    ],
  },
  {
    id: "turnaround",
    label: "I–vi–ii–V",
    steps: () => [
      { offset: 0, quality: "maj7", degree: "I", ext: "9" },
      { offset: 9, quality: "m7", degree: "vi", ext: "11" },
      { offset: 2, quality: "m7", degree: "ii", ext: "9" },
      { offset: 7, quality: "7", degree: "V", ext: "13" },
    ],
  },
  {
    id: "rhythm",
    label: "I–VI7–ii–V",
    steps: () => [
      { offset: 0, quality: "6", degree: "I", ext: "9" },
      { offset: 9, quality: "7", degree: "VI7", ext: "b9" },
      { offset: 2, quality: "m7", degree: "ii", ext: "9" },
      { offset: 7, quality: "7", degree: "V", ext: "13" },
    ],
  },
  {
    id: "iii-vi-ii-v",
    label: "iii–VI7–ii–V–I",
    steps: () => [
      { offset: 4, quality: "m7", degree: "iii", ext: "11" },
      { offset: 9, quality: "7", degree: "VI7", ext: "b9-b13" },
      { offset: 2, quality: "m7", degree: "ii", ext: "9" },
      { offset: 7, quality: "7", degree: "V", ext: "13" },
      { offset: 0, quality: "maj7", degree: "I", ext: "9" },
    ],
  },
];

/** Progression labels per locale; roman numerals stay as-is. */
const PROGRESSION_LABELS = defineMessages<Record<ProgressionId, string>>({
  en: {
    "major-251": "ii–V–I",
    "minor-251": "Minor ii–V–i",
    turnaround: "I–vi–ii–V",
    rhythm: "I–VI7–ii–V",
    "iii-vi-ii-v": "iii–VI7–ii–V–I",
  },
  pt: {
    "major-251": "ii–V–I",
    "minor-251": "ii–V–i menor",
    turnaround: "I–vi–ii–V",
    rhythm: "I–VI7–ii–V",
    "iii-vi-ii-v": "iii–VI7–ii–V–I",
  },
  es: {
    "major-251": "ii–V–I",
    "minor-251": "ii–V–i menor",
    turnaround: "I–vi–ii–V",
    rhythm: "I–VI7–ii–V",
    "iii-vi-ii-v": "iii–VI7–ii–V–I",
  },
});

/** The progression's label in `locale` (`PROGRESSIONS[].label` is English). */
export function progressionLabel(id: ProgressionId, locale: Locale): string {
  return PROGRESSION_LABELS[locale][id];
}

export function getProgression(
  id: ProgressionId,
  key: number,
  tonicMinor: TonicMinor = "m7",
): ProgressionChord[] {
  const prog = PROGRESSIONS.find((p) => p.id === id) ?? PROGRESSIONS[0];
  return prog.steps(tonicMinor).map((s) => ({
    root: (key + s.offset) % 12,
    quality: s.quality,
    degree: s.degree,
    color: s.ext,
  }));
}

// --- Diatonic seventh chords ----------------------------------------------

export type HarmonizedScaleId = "major" | "melodic-minor" | "harmonic-minor";

export const HARMONIZED_SCALES: {
  id: HarmonizedScaleId;
  label: string;
  steps: ProgressionStep[];
}[] = [
  {
    id: "major",
    label: "Major",
    steps: [
      { offset: 0, quality: "maj7", degree: "Imaj7" },
      { offset: 2, quality: "m7", degree: "ii–7" },
      { offset: 4, quality: "m7", degree: "iii–7" },
      { offset: 5, quality: "maj7", degree: "IVmaj7" },
      { offset: 7, quality: "7", degree: "V7" },
      { offset: 9, quality: "m7", degree: "vi–7" },
      { offset: 11, quality: "m7b5", degree: "viiø7" },
    ],
  },
  {
    id: "melodic-minor",
    label: "Melodic minor",
    steps: [
      { offset: 0, quality: "mMaj7", degree: "i–(maj7)" },
      { offset: 2, quality: "m7", degree: "ii–7" },
      { offset: 3, quality: "maj7#5", degree: "♭IIImaj7♯5" },
      { offset: 5, quality: "7", degree: "IV7" },
      { offset: 7, quality: "7", degree: "V7" },
      { offset: 9, quality: "m7b5", degree: "viø7" },
      { offset: 11, quality: "m7b5", degree: "viiø7" },
    ],
  },
  {
    id: "harmonic-minor",
    label: "Harmonic minor",
    steps: [
      { offset: 0, quality: "mMaj7", degree: "i–(maj7)" },
      { offset: 2, quality: "m7b5", degree: "iiø7" },
      { offset: 3, quality: "maj7#5", degree: "♭IIImaj7♯5" },
      { offset: 5, quality: "m7", degree: "iv–7" },
      { offset: 7, quality: "7", degree: "V7" },
      { offset: 8, quality: "maj7", degree: "♭VImaj7" },
      { offset: 11, quality: "dim7", degree: "vii°7" },
    ],
  },
];

const HARMONIZED_SCALE_LABELS = defineMessages<Record<HarmonizedScaleId, string>>({
  en: { major: "Major", "melodic-minor": "Melodic minor", "harmonic-minor": "Harmonic minor" },
  pt: { major: "Maior", "melodic-minor": "Menor melódica", "harmonic-minor": "Menor harmônica" },
  es: { major: "Mayor", "melodic-minor": "Menor melódica", "harmonic-minor": "Menor armónica" },
});

/** The harmonized scale's label in `locale` (`HARMONIZED_SCALES[].label` is English). */
export function harmonizedScaleLabel(id: HarmonizedScaleId, locale: Locale): string {
  return HARMONIZED_SCALE_LABELS[locale][id];
}

export type DiatonicVoicing = { chord: ProgressionChord; voicing: Voicing };

/**
 * Harmonize a scale in one drop-2 inversion on one string set. Every voice
 * climbs to the next scale degree, so the shape walks up the neck; the tonic
 * repeats an octave higher to close the run. Starts as low as the neck allows,
 * and drops an octave only if the run would run off the top.
 */
export function diatonicDrop2Run(
  key: number,
  scaleId: HarmonizedScaleId,
  inversionIndex: number,
  stringSetIndex: number,
): DiatonicVoicing[] {
  const scale = HARMONIZED_SCALES.find((s) => s.id === scaleId) ?? HARMONIZED_SCALES[0];
  const chords: ProgressionChord[] = [...scale.steps, scale.steps[0]].map((s) => ({
    root: (key + s.offset) % 12,
    quality: s.quality,
    degree: s.degree,
  }));

  const positions = chords.map((chord) => {
    const base = computeDrop2Voicing(chord.root, chord.quality, inversionIndex, stringSetIndex);
    return [-24, -12, 0, 12]
      .map((s) => shiftVoicing(base, s))
      .filter((v) => isPlayable(v, 1))
      .sort((a, b) => a.midi[0] - b.midi[0]);
  });

  // Walk up from a given first shape: each chord takes the next position above.
  const walk = (start: Voicing) => {
    const run = [start];
    let drops = 0;
    for (const options of positions.slice(1)) {
      const prev = run[run.length - 1].midi[0];
      const next = options.find((o) => o.midi[0] > prev);
      if (!next) drops++;
      run.push(next ?? options[0]);
    }
    return { run, drops };
  };

  // Prefer a start where the whole run fits on the neck, then the lowest one.
  const best = positions[0]
    .map(walk)
    .reduce((a, b) => (b.drops < a.drops ? b : a));

  return best.run.map((voicing, i) => ({ chord: chords[i], voicing }));
}

export const KEY_OPTIONS = NOTE_NAMES_FLAT.map((name, i) => ({
  name,
  value: i,
}));

/**
 * The root name shown in the KEY_OPTIONS picker. Pass it as a speller's
 * `rootName` so picking G♭ never comes back spelled as F♯.
 */
export function keyName(pc: number): string {
  return KEY_OPTIONS[((pc % 12) + 12) % 12].name;
}
