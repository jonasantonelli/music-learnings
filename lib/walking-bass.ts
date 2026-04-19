import { CHORD_FORMULAS, STRING_MIDI, type ChordQuality } from "./music";

export type BassNote = {
  string: number; // 1-6 (1 = high E, 6 = low E)
  fret: number;
  interval: number; // semitones from chord root
  beat: number; // 1-4
  type: "root" | "chord-tone" | "approach";
};

type Pattern = {
  beats: number[]; // intervals for beats 1-3
};

const PATTERNS: Record<string, Pattern[]> = {
  maj7: [
    { beats: [0, 4, 7] },
    { beats: [0, 7, 4] },
    { beats: [0, 11, 7] },
    { beats: [0, 4, 11] },
  ],
  m7: [
    { beats: [0, 3, 7] },
    { beats: [0, 7, 3] },
    { beats: [0, 10, 7] },
    { beats: [0, 3, 10] },
  ],
  "7": [
    { beats: [0, 4, 7] },
    { beats: [0, 7, 4] },
    { beats: [0, 10, 7] },
    { beats: [0, 4, 10] },
  ],
  m7b5: [
    { beats: [0, 3, 6] },
    { beats: [0, 6, 3] },
    { beats: [0, 10, 6] },
    { beats: [0, 3, 10] },
  ],
  dim7: [
    { beats: [0, 3, 6] },
    { beats: [0, 6, 3] },
    { beats: [0, 9, 6] },
    { beats: [0, 3, 9] },
  ],
  mMaj7: [
    { beats: [0, 3, 7] },
    { beats: [0, 7, 3] },
    { beats: [0, 11, 7] },
    { beats: [0, 3, 11] },
  ],
};

function noteType(interval: number, quality: ChordQuality): BassNote["type"] {
  if (interval === 0) return "root";
  const formula = CHORD_FORMULAS[quality];
  return formula.includes(interval) ? "chord-tone" : "approach";
}

function findFret(
  pc: number,
  stringIndex: number,
  minFret: number,
  maxFret: number,
): number | null {
  const open = STRING_MIDI[stringIndex];
  let baseFret = ((pc - (open % 12)) % 12 + 12) % 12;
  if (baseFret < minFret) baseFret += 12;
  if (baseFret >= minFret && baseFret <= maxFret) return baseFret;
  const alt = baseFret - 12;
  if (alt >= minFret && alt <= maxFret) return alt;
  return null;
}

function findBestPosition(
  pc: number,
  centerFret: number,
  bassStrings: number[],
): { string: number; fret: number } | null {
  let best: { string: number; fret: number; dist: number } | null = null;
  const minFret = Math.max(1, centerFret - 4);
  const maxFret = centerFret + 4;

  for (const si of bassStrings) {
    const fret = findFret(pc, si, minFret, maxFret);
    if (fret !== null) {
      const dist = Math.abs(fret - centerFret);
      if (!best || dist < best.dist) {
        best = { string: 6 - si, fret, dist };
      }
    }
  }
  return best ? { string: best.string, fret: best.fret } : null;
}

function chromaticApproach(
  nextRootPc: number,
  centerFret: number,
  bassStrings: number[],
): { pc: number; string: number; fret: number } | null {
  const below = ((nextRootPc - 1) % 12 + 12) % 12;
  const above = (nextRootPc + 1) % 12;

  const posBelow = findBestPosition(below, centerFret, bassStrings);
  const posAbove = findBestPosition(above, centerFret, bassStrings);

  if (posBelow && posAbove) {
    const distBelow = Math.abs(posBelow.fret - centerFret);
    const distAbove = Math.abs(posAbove.fret - centerFret);
    return distBelow <= distAbove
      ? { pc: below, ...posBelow }
      : { pc: above, ...posAbove };
  }
  if (posBelow) return { pc: below, ...posBelow };
  if (posAbove) return { pc: above, ...posAbove };
  return null;
}

export type WalkingBassLine = {
  chordRoot: number;
  quality: ChordQuality;
  notes: BassNote[];
};

export function generateWalkingBassLine(
  chordRoot: number,
  quality: ChordQuality,
  nextRootPc: number,
  patternIndex: number,
): WalkingBassLine {
  const patterns = PATTERNS[quality] ?? PATTERNS["7"];
  const pattern = patterns[patternIndex % patterns.length];
  const bassStrings = [0, 1, 2]; // strings 6, 5, 4

  const rootPc = chordRoot % 12;
  const rootPos = findBestPosition(rootPc, 5, bassStrings);
  const centerFret = rootPos?.fret ?? 5;

  const notes: BassNote[] = [];

  for (let b = 0; b < 3; b++) {
    const interval = pattern.beats[b];
    const pc = (rootPc + interval) % 12;
    const pos = findBestPosition(pc, centerFret, bassStrings);
    if (pos) {
      notes.push({
        ...pos,
        interval,
        beat: b + 1,
        type: noteType(interval, quality),
      });
    }
  }

  const approach = chromaticApproach(nextRootPc, centerFret, bassStrings);
  if (approach) {
    const interval = ((approach.pc - rootPc) % 12 + 12) % 12;
    notes.push({
      string: approach.string,
      fret: approach.fret,
      interval,
      beat: 4,
      type: "approach",
    });
  }

  return { chordRoot, quality, notes };
}

export type ProgressionType = "major-251" | "minor-251" | "single";

export function getProgressionChords(
  key: number,
  type: ProgressionType,
): { root: number; quality: ChordQuality; label: string }[] {
  switch (type) {
    case "major-251":
      return [
        { root: (key + 2) % 12, quality: "m7", label: "ii" },
        { root: (key + 7) % 12, quality: "7", label: "V" },
        { root: key, quality: "maj7", label: "I" },
      ];
    case "minor-251":
      return [
        { root: (key + 2) % 12, quality: "m7b5", label: "ii" },
        { root: (key + 7) % 12, quality: "7", label: "V" },
        { root: key, quality: "m7", label: "i" },
      ];
    case "single":
      return [{ root: key, quality: "maj7", label: "I" }];
  }
}
