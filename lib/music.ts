export const NOTE_NAMES_SHARP = [
  "C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B",
];
export const NOTE_NAMES_FLAT = [
  "C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B",
];

const SHARP_KEYS = new Set([0, 2, 4, 7, 9, 11]); // C, D, E, G, A, B

export function noteName(pc: number, key?: number): string {
  const n = ((pc % 12) + 12) % 12;
  return key !== undefined && SHARP_KEYS.has(key)
    ? NOTE_NAMES_SHARP[n]
    : NOTE_NAMES_FLAT[n];
}

export type ChordQuality = "maj7" | "m7" | "7" | "m7b5" | "dim7" | "mMaj7";

export const CHORD_FORMULAS: Record<ChordQuality, readonly number[]> = {
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  "7": [0, 4, 7, 10],
  m7b5: [0, 3, 6, 10],
  dim7: [0, 3, 6, 9],
  mMaj7: [0, 3, 7, 11],
};

export const QUALITY_LABELS: Record<ChordQuality, string> = {
  maj7: "maj7",
  m7: "m7",
  "7": "7",
  m7b5: "m7♭5",
  dim7: "dim7",
  mMaj7: "m(maj7)",
};

export const QUALITY_SUFFIXES: Record<ChordQuality, string> = {
  maj7: "maj7",
  m7: "m7",
  "7": "7",
  m7b5: "m7♭5",
  dim7: "°7",
  mMaj7: "m(maj7)",
};

export const INTERVAL_LABELS: Record<number, string> = {
  0: "R",
  3: "♭3",
  4: "3",
  6: "♭5",
  7: "5",
  9: "°7",
  10: "♭7",
  11: "7",
};

// Standard tuning MIDI values: string 6 (low E) → string 1 (high E)
export const STRING_MIDI = [40, 45, 50, 55, 59, 64];

export const STRING_SETS = [
  { label: "6-5-4-3", indices: [0, 1, 2, 3] },
  { label: "5-4-3-2", indices: [1, 2, 3, 4] },
  { label: "4-3-2-1", indices: [2, 3, 4, 5] },
];

// Drop-2 voice arrangement per inversion (indices into chord formula)
// Close voicing bottom→top, then drop 2nd-from-top an octave below
export const DROP2_VOICES: readonly (readonly number[])[] = [
  [2, 0, 1, 3], // Root position: 5 R 3 7
  [3, 1, 2, 0], // 1st inversion: 7 3 5 R
  [0, 2, 3, 1], // 2nd inversion: R 5 7 3
  [1, 3, 0, 2], // 3rd inversion: 3 7 R 5
];

export const INVERSION_NAMES = [
  "Root Position",
  "1st Inversion",
  "2nd Inversion",
  "3rd Inversion",
];

export type Voicing = {
  frets: (number | null)[]; // 6 elements, null = muted
  midi: number[]; // 4 pitches (one per voice, bottom→top)
  intervals: number[]; // 4 intervals in semitones from root
  toneIndices: number[]; // which chord-tone index per voice
  inversionIndex: number;
};

type VoiceCandidate = {
  fret: number;
  pitch: number;
  toneIdx: number;
  interval: number;
  si: number;
};

export function computeDrop2Voicing(
  root: number,
  quality: ChordQuality,
  inversionIndex: number,
  stringSetIndex: number,
): Voicing {
  const formula = CHORD_FORMULAS[quality];
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
      voiceCandidates.push({ fret, pitch: open + fret, toneIdx, interval, si });
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
  const toneIndices: number[] = [];

  for (const c of best) {
    frets[c.si] = c.fret;
    midi.push(c.pitch);
    intervals.push(c.interval);
    toneIndices.push(c.toneIdx);
  }

  return { frets, midi, intervals, toneIndices, inversionIndex };
}

function shiftVoicing(v: Voicing, fretShift: number): Voicing {
  return {
    ...v,
    frets: v.frets.map((f) => (f === null ? null : f + fretShift)),
    midi: v.midi.map((m) => m + fretShift),
  };
}

function isPlayable(v: Voicing): boolean {
  const played = v.frets.filter((f): f is number => f !== null);
  return played.length > 0 && played.every((f) => f >= 2) && Math.max(...played) <= 19;
}

export function voiceLeadingDistance(a: Voicing, b: Voicing): number {
  return a.midi.reduce((sum, p, i) => sum + Math.abs(p - b.midi[i]), 0);
}

export function findBestVoiceLeading(
  from: Voicing,
  root: number,
  quality: ChordQuality,
  stringSetIndex: number,
): Voicing {
  const candidates: Voicing[] = [];

  for (let inv = 0; inv < 4; inv++) {
    const base = computeDrop2Voicing(root, quality, inv, stringSetIndex);
    for (const shift of [-12, 0, 12]) {
      const v = shift === 0 ? base : shiftVoicing(base, shift);
      if (isPlayable(v)) candidates.push(v);
    }
  }

  return candidates.reduce((best, v) =>
    voiceLeadingDistance(from, v) < voiceLeadingDistance(from, best) ? v : best,
  );
}

export function chordLabel(root: number, quality: ChordQuality, key?: number): string {
  return noteName(root, key) + QUALITY_SUFFIXES[quality];
}

export type ProgressionChord = {
  root: number;
  quality: ChordQuality;
  degree: string;
};

export function getMajor251(key: number): ProgressionChord[] {
  return [
    { root: (key + 2) % 12, quality: "m7", degree: "ii" },
    { root: (key + 7) % 12, quality: "7", degree: "V" },
    { root: key % 12, quality: "maj7", degree: "I" },
  ];
}

export function getMinor251(key: number, useMmaj7: boolean): ProgressionChord[] {
  return [
    { root: (key + 2) % 12, quality: "m7b5", degree: "ii" },
    { root: (key + 7) % 12, quality: "7", degree: "V" },
    { root: key % 12, quality: useMmaj7 ? "mMaj7" : "m7", degree: "i" },
  ];
}

export const KEY_OPTIONS = NOTE_NAMES_FLAT.map((name, i) => ({
  name,
  value: i,
}));
