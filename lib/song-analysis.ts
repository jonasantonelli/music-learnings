export type ChordFunction = "tonic" | "subdominant" | "dominant" | "other";
export type ChordCategory = "maj" | "min" | "dom" | "dim" | "hdim" | "aug" | "other";

export type ParsedChord = {
  root: number;
  rootName: string;
  category: ChordCategory;
  symbol: string;
};

const NOTE_MAP: Record<string, number> = {
  C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3,
  E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8,
  A: 9, "A#": 10, Bb: 10, B: 11,
};

const UNICODE_MAP: Record<string, string> = {
  "\u266F": "#",
  "\u266D": "b",
};

export function parseChordSymbol(symbol: string): ParsedChord | null {
  let s = symbol.trim();
  if (!s) return null;

  for (const [unicode, ascii] of Object.entries(UNICODE_MAP)) {
    s = s.replaceAll(unicode, ascii);
  }

  const rootMatch = s.match(/^([A-G])([#b]?)/);
  if (!rootMatch) return null;

  const rootName = rootMatch[1] + rootMatch[2];
  const root = NOTE_MAP[rootName];
  if (root === undefined) return null;

  const suffix = s.slice(rootMatch[0].length).toLowerCase();
  const category = categorizeChord(suffix);

  return { root, rootName, category, symbol };
}

function categorizeChord(suffix: string): ChordCategory {
  const s = suffix.replace(/[()]/g, "");

  if (/^dim|^o(?![\d])|^°/.test(s)) return "dim";
  if (/^m7b5|^m7♭5|^ø|^hdim/.test(s)) return "hdim";
  if (/^\+|^aug/.test(s)) return "aug";
  if (/^m/.test(s)) return "min";
  if (/^7|^9|^11|^13|^dom/.test(s)) return "dom";
  if (/^maj|^M|^Δ|^$|^6/.test(s)) return "maj";

  return "other";
}

export type ChordProvenance = {
  sectionIndex: number;
  barIndex: number;
  chordIndex: number;
};

export type FlatChord = {
  chord: string;
  provenance: ChordProvenance;
};

export type IIVIPattern = {
  startIndex: number;
  length: number;
  mode: "major" | "minor";
  provenances: ChordProvenance[];
};

export function detectIIVIPatterns(
  flatChords: FlatChord[],
): IIVIPattern[] {
  const patterns: IIVIPattern[] = [];
  const parsed = flatChords.map((c) => parseChordSymbol(c.chord));

  for (let i = 0; i <= parsed.length - 3; i++) {
    const ii = parsed[i];
    const v = parsed[i + 1];
    const I = parsed[i + 2];
    if (!ii || !v || !I) continue;

    const iiToV = ((v.root - ii.root) + 12) % 12;
    const vToI = ((I.root - v.root) + 12) % 12;

    if (
      iiToV === 5 &&
      vToI === 5 &&
      (ii.category === "min" || ii.category === "hdim") &&
      v.category === "dom" &&
      (I.category === "maj" || I.category === "min")
    ) {
      const mode =
        ii.category === "hdim" || I.category === "min" ? "minor" : "major";
      patterns.push({
        startIndex: i,
        length: 3,
        mode,
        provenances: [
          flatChords[i].provenance,
          flatChords[i + 1].provenance,
          flatChords[i + 2].provenance,
        ],
      });
    }
  }

  return patterns;
}

export function getChordFunction(
  chord: ParsedChord,
  keyRoot: number,
): ChordFunction {
  const interval = ((chord.root - keyRoot) + 12) % 12;

  if ([0, 4, 9].includes(interval) && chord.category !== "dom") return "tonic";
  if ([7, 11].includes(interval) || chord.category === "dom") return "dominant";
  if ([2, 5].includes(interval)) return "subdominant";

  return "other";
}

const KEY_NAME_MAP: Record<string, number> = {
  "C major": 0, "C minor": 0,
  "Db major": 1, "C# major": 1, "C# minor": 1, "Db minor": 1,
  "D major": 2, "D minor": 2,
  "Eb major": 3, "D# major": 3, "Eb minor": 3, "D# minor": 3,
  "E major": 4, "E minor": 4,
  "F major": 5, "F minor": 5,
  "F# major": 6, "Gb major": 6, "F# minor": 6, "Gb minor": 6,
  "G major": 7, "G minor": 7,
  "Ab major": 8, "G# major": 8, "Ab minor": 8, "G# minor": 8,
  "A major": 9, "A minor": 9,
  "Bb major": 10, "A# major": 10, "Bb minor": 10, "A# minor": 10,
  "B major": 11, "B minor": 11,
};

import type { ChordQuality } from "./music";

const CATEGORY_TO_QUALITY: Partial<Record<ChordCategory, ChordQuality>> = {
  maj: "maj7",
  min: "m7",
  dom: "7",
  hdim: "m7b5",
  dim: "dim7",
};

export function chordQualityFromCategory(category: ChordCategory): ChordQuality | null {
  return CATEGORY_TO_QUALITY[category] ?? null;
}

export function parseKeyName(key: string): number {
  const normalized = key.trim().replace(/♯/g, "#").replace(/♭/g, "b");
  const mapped = KEY_NAME_MAP[normalized];
  if (mapped !== undefined) return mapped;

  const match = normalized.match(/^([A-G][#b]?)/);
  if (match) {
    const root = NOTE_MAP[match[1]];
    if (root !== undefined) return root;
  }

  return 0;
}
