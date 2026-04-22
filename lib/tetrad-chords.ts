import { STRING_MIDI, noteName } from "./music";

export type TetradChordQuality =
  | "maj7"
  | "6"
  | "maj7#11"
  | "m7"
  | "m6"
  | "m7b5"
  | "mMaj7"
  | "m9"
  | "7"
  | "7+"
  | "7b5"
  | "7b9"
  | "7(9)"
  | "7sus4"
  | "dim7";

export const TETRAD_CHORD_FORMULAS: Record<TetradChordQuality, readonly number[]> = {
  maj7: [0, 4, 7, 11],
  "6": [0, 4, 7, 9],
  "maj7#11": [0, 4, 11, 18],    // R, 3, 7, #11 (drop 5th)
  m7: [0, 3, 7, 10],
  m6: [0, 3, 7, 9],
  m7b5: [0, 3, 6, 10],
  mMaj7: [0, 3, 7, 11],
  m9: [0, 3, 10, 14],           // R, b3, b7, 9 (drop 5th)
  "7": [0, 4, 7, 10],
  "7+": [0, 4, 8, 10],
  "7b5": [0, 4, 6, 10],
  "7b9": [0, 4, 10, 13],        // R, 3, b7, b9 (drop 5th)
  "7(9)": [0, 4, 10, 14],       // R, 3, b7, 9 (drop 5th)
  "7sus4": [0, 5, 7, 10],
  dim7: [0, 3, 6, 9],
};

export const TETRAD_CHORD_LABELS: Record<TetradChordQuality, string> = {
  maj7: "maj7",
  "6": "6",
  "maj7#11": "maj7♯11",
  m7: "m7",
  m6: "m6",
  m7b5: "m7♭5",
  mMaj7: "m(maj7)",
  m9: "m9",
  "7": "7",
  "7+": "7♯5",
  "7b5": "7♭5",
  "7b9": "7♭9",
  "7(9)": "7(9)",
  "7sus4": "7sus4",
  dim7: "dim7",
};

export const TETRAD_INTERVAL_LABELS: Record<number, string> = {
  0: "R",
  3: "♭3",
  4: "3",
  5: "4",
  6: "♭5",
  7: "5",
  8: "♯5",
  9: "6",
  10: "♭7",
  11: "7",
  13: "♭9",
  14: "9",
  18: "♯11",
};

export type ChordFamily = {
  name: string;
  qualities: TetradChordQuality[];
};

export const CHORD_FAMILIES: ChordFamily[] = [
  { name: "Major", qualities: ["maj7", "6", "maj7#11"] },
  { name: "Minor", qualities: ["m7", "m6", "m7b5", "mMaj7", "m9"] },
  { name: "Dominant", qualities: ["7", "7+", "7b5", "7b9", "7(9)", "7sus4"] },
  { name: "Diminished", qualities: ["dim7"] },
];

export const ROOT_STRING_OPTIONS = [
  { label: "6th", value: 0 },
  { label: "5th", value: 1 },
  { label: "4th", value: 2 },
  { label: "3rd", value: 3 },
  { label: "2nd", value: 4 },
  { label: "1st", value: 5 },
];

export type TetradVoicing = {
  frets: (number | null)[];
  intervals: number[];
  rootStringIndex: number;
};

type VoiceOption = {
  stringIndex: number;
  fret: number;
  pitch: number;
  interval: number;
};

const STRING_CONSTRAINTS: Partial<
  Record<TetradChordQuality, Partial<Record<number, readonly number[]>>>
> = {
  "6": {
    1: [1, 2, 3, 4],
  },
};

const MANUAL_OVERRIDES: Map<string, (number | null)[]> = new Map();

function overrideKey(quality: TetradChordQuality, rootString: number, rootFret: number): string {
  return `${quality}:${rootString}:${rootFret}`;
}

export function registerOverride(
  quality: TetradChordQuality,
  rootString: number,
  rootFret: number,
  frets: (number | null)[],
) {
  MANUAL_OVERRIDES.set(overrideKey(quality, rootString, rootFret), frets);
}

export function computeTetradVoicing(
  root: number,
  quality: TetradChordQuality,
  rootString: number,
): TetradVoicing | null {
  const formula = TETRAD_CHORD_FORMULAS[quality];
  const openPitch = STRING_MIDI[rootString];
  const rootPc = ((root % 12) + 12) % 12;

  let rootFret = ((rootPc - (openPitch % 12)) + 12) % 12;
  if (rootFret === 0) rootFret = 12;

  const bestRootFrets: number[] = [];
  for (let f = rootFret; f <= 19; f += 12) {
    bestRootFrets.push(f);
  }

  const allowedStrings = STRING_CONSTRAINTS[quality]?.[rootString];

  let bestVoicing: TetradVoicing | null = null;
  let bestCost = Infinity;

  for (const rf of bestRootFrets) {
    const key = overrideKey(quality, rootString, rf);
    if (MANUAL_OVERRIDES.has(key)) {
      const frets = MANUAL_OVERRIDES.get(key)!;
      return {
        frets,
        intervals: extractIntervals(frets, root, formula),
        rootStringIndex: rootString,
      };
    }

    const rootPitch = openPitch + rf;

    const otherTones = formula.slice(1);
    const voiceOptions: VoiceOption[][] = [];

    for (const interval of otherTones) {
      const targetPc = ((root + interval) % 12 + 12) % 12;
      const candidates: VoiceOption[] = [];

      for (let si = 0; si < 6; si++) {
        if (si === rootString) continue;
        if (allowedStrings && !allowedStrings.includes(si)) continue;
        if (rootString === 0 && si === 1) continue;
        if (rootString === 1 && si === 0) continue;
        if (rootString >= 2 && si < 2) continue;
        const open = STRING_MIDI[si];
        let baseFret = ((targetPc - (open % 12)) + 12) % 12;
        if (baseFret === 0) baseFret = 12;

        for (let fret = baseFret; fret <= 19; fret += 12) {
          candidates.push({
            stringIndex: si,
            fret,
            pitch: open + fret,
            interval,
          });
        }
      }
      voiceOptions.push(candidates);
    }

    if (voiceOptions.length !== 3) continue;

    for (const v1 of voiceOptions[0]) {
      for (const v2 of voiceOptions[1]) {
        if (v2.stringIndex === v1.stringIndex) continue;
        for (const v3 of voiceOptions[2]) {
          if (v3.stringIndex === v1.stringIndex || v3.stringIndex === v2.stringIndex) continue;

          const allFrets = [rf, v1.fret, v2.fret, v3.fret];
          const minFret = Math.min(...allFrets);
          const maxFret = Math.max(...allFrets);
          const span = maxFret - minFret;

          if (span > 5) continue;

          const usedStrings = [rootString, v1.stringIndex, v2.stringIndex, v3.stringIndex];
          const adjacencyGap = computeAdjacencyGap(usedStrings);
          const spanCost = span * 10;
          const gapCost = adjacencyGap * 20;
          const nutPenalty = minFret < 2 ? 500 : 0;
          const distFromRoot = Math.abs(avgFret(allFrets) - rf) * 2;
          const cost = spanCost + gapCost + nutPenalty + distFromRoot;

          if (cost < bestCost) {
            bestCost = cost;
            const frets: (number | null)[] = [null, null, null, null, null, null];
            frets[rootString] = rf;
            frets[v1.stringIndex] = v1.fret;
            frets[v2.stringIndex] = v2.fret;
            frets[v3.stringIndex] = v3.fret;
            bestVoicing = {
              frets,
              intervals: buildIntervalArray(frets, rootString, formula, [v1, v2, v3]),
              rootStringIndex: rootString,
            };
          }
        }
      }
    }
  }

  if (
    bestVoicing &&
    quality === "m9" &&
    rootString === 0 &&
    bestVoicing.frets[4] === null
  ) {
    const rf = bestVoicing.frets[0]!;
    bestVoicing.frets[4] = rf;
    bestVoicing.intervals = extractIntervals(
      bestVoicing.frets,
      root,
      [0, 3, 7, 10, 14],
    );
  }

  return bestVoicing;
}

function computeAdjacencyGap(strings: number[]): number {
  const sorted = [...strings].sort((a, b) => a - b);
  let maxGap = 0;
  for (let i = 1; i < sorted.length; i++) {
    maxGap = Math.max(maxGap, sorted[i] - sorted[i - 1] - 1);
  }
  return maxGap;
}

function avgFret(frets: number[]): number {
  return frets.reduce((a, b) => a + b, 0) / frets.length;
}

function buildIntervalArray(
  frets: (number | null)[],
  _rootString: number,
  _formula: readonly number[],
  voices: VoiceOption[],
): number[] {
  const intervals: number[] = [];
  for (let si = 0; si < 6; si++) {
    if (frets[si] === null) continue;
    if (si === _rootString) {
      intervals.push(0);
    } else {
      const voice = voices.find((v) => v.stringIndex === si);
      if (voice) intervals.push(voice.interval);
    }
  }
  return intervals;
}

function extractIntervals(
  frets: (number | null)[],
  root: number,
  formula: readonly number[],
): number[] {
  const intervals: number[] = [];
  for (let si = 0; si < 6; si++) {
    if (frets[si] === null) continue;
    const pitch = STRING_MIDI[si] + frets[si]!;
    const pc = ((pitch % 12) - root + 12) % 12;
    const match = formula.find((f) => f % 12 === pc);
    intervals.push(match ?? pc);
  }
  return intervals;
}

export function tetradChordLabel(
  root: number,
  quality: TetradChordQuality,
): string {
  return noteName(root, root) + TETRAD_CHORD_LABELS[quality];
}

export function intervalLabel(interval: number): string {
  return TETRAD_INTERVAL_LABELS[interval] ?? String(interval);
}
