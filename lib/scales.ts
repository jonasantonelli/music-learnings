import { STRING_MIDI } from "./music";

export type ScaleDefinition = {
  slug: string;
  name: string;
  altNames: string[];
  intervals: number[];
  degrees: string[];
  parent?: { slug: string; name: string; degree: number };
};

export const SCALES: Record<string, ScaleDefinition> = {
  ionian: {
    slug: "ionian",
    name: "Ionian",
    altNames: ["Major Scale"],
    intervals: [0, 2, 4, 5, 7, 9, 11],
    degrees: ["R", "2", "3", "4", "5", "6", "7"],
  },
  dorian: {
    slug: "dorian",
    name: "Dorian",
    altNames: [],
    intervals: [0, 2, 3, 5, 7, 9, 10],
    degrees: ["R", "2", "♭3", "4", "5", "6", "♭7"],
    parent: { slug: "ionian", name: "Ionian", degree: 2 },
  },
  phrygian: {
    slug: "phrygian",
    name: "Phrygian",
    altNames: [],
    intervals: [0, 1, 3, 5, 7, 8, 10],
    degrees: ["R", "♭2", "♭3", "4", "5", "♭6", "♭7"],
    parent: { slug: "ionian", name: "Ionian", degree: 3 },
  },
  lydian: {
    slug: "lydian",
    name: "Lydian",
    altNames: [],
    intervals: [0, 2, 4, 6, 7, 9, 11],
    degrees: ["R", "2", "3", "♯4", "5", "6", "7"],
    parent: { slug: "ionian", name: "Ionian", degree: 4 },
  },
  mixolydian: {
    slug: "mixolydian",
    name: "Mixolydian",
    altNames: [],
    intervals: [0, 2, 4, 5, 7, 9, 10],
    degrees: ["R", "2", "3", "4", "5", "6", "♭7"],
    parent: { slug: "ionian", name: "Ionian", degree: 5 },
  },
  aeolian: {
    slug: "aeolian",
    name: "Aeolian",
    altNames: ["Natural Minor"],
    intervals: [0, 2, 3, 5, 7, 8, 10],
    degrees: ["R", "2", "♭3", "4", "5", "♭6", "♭7"],
    parent: { slug: "ionian", name: "Ionian", degree: 6 },
  },
  locrian: {
    slug: "locrian",
    name: "Locrian",
    altNames: [],
    intervals: [0, 1, 3, 5, 6, 8, 10],
    degrees: ["R", "♭2", "♭3", "4", "♭5", "♭6", "♭7"],
    parent: { slug: "ionian", name: "Ionian", degree: 7 },
  },
  "melodic-minor": {
    slug: "melodic-minor",
    name: "Melodic Minor",
    altNames: [],
    intervals: [0, 2, 3, 5, 7, 9, 11],
    degrees: ["R", "2", "♭3", "4", "5", "6", "7"],
  },
  "lydian-b7": {
    slug: "lydian-b7",
    name: "Lydian ♭7",
    altNames: ["Lydian Dominant"],
    intervals: [0, 2, 4, 6, 7, 9, 10],
    degrees: ["R", "2", "3", "♯4", "5", "6", "♭7"],
    parent: { slug: "melodic-minor", name: "Melodic Minor", degree: 4 },
  },
  "harmonic-minor": {
    slug: "harmonic-minor",
    name: "Harmonic Minor",
    altNames: [],
    intervals: [0, 2, 3, 5, 7, 8, 11],
    degrees: ["R", "2", "♭3", "4", "5", "♭6", "7"],
  },
  "mixolydian-b9-b13": {
    slug: "mixolydian-b9-b13",
    name: "Mixolydian ♭9 ♭13",
    altNames: ["Phrygian Dominant"],
    intervals: [0, 1, 4, 5, 7, 8, 10],
    degrees: ["R", "♭9", "3", "4", "5", "♭13", "♭7"],
    parent: { slug: "harmonic-minor", name: "Harmonic Minor", degree: 5 },
  },
};

export const SCALE_INTERVAL_LABELS: Record<number, string> = {
  0: "R",
  1: "♭9",
  2: "9",
  3: "♭3",
  4: "3",
  5: "11",
  6: "♯11",
  7: "5",
  8: "♭13",
  9: "13",
  10: "♭7",
  11: "7",
};

export type ScaleMarker = {
  string: number;
  fret: number;
  intervalPc: number;
};

function intervalFromRoot(midi: number, rootPc: number): number {
  return ((midi - rootPc) % 12 + 12) % 12;
}

export function getFullNeckMarkers(
  scale: ScaleDefinition,
  root: number,
  frets: number,
  startFret: number = 0,
): ScaleMarker[] {
  const pcSet = new Set(scale.intervals.map((i) => (root + i) % 12));
  const markers: ScaleMarker[] = [];
  for (let si = 0; si < 6; si++) {
    const openMidi = STRING_MIDI[si];
    const displayString = 6 - si;
    for (let fret = Math.max(1, startFret + 1); fret <= startFret + frets; fret++) {
      const midi = openMidi + fret;
      if (pcSet.has(midi % 12)) {
        markers.push({
          string: displayString,
          fret,
          intervalPc: intervalFromRoot(midi, root),
        });
      }
    }
  }
  return markers;
}

export type NPS3Position = {
  index: number;
  markers: ScaleMarker[];
  minFret: number;
  maxFret: number;
};

export type CAGEDScalePosition = {
  name: string;
  markers: ScaleMarker[];
  minFret: number;
  maxFret: number;
};

export function getCAGEDScalePositions(
  scale: ScaleDefinition,
  root: number,
): CAGEDScalePosition[] {
  const pcSet = new Set(scale.intervals.map((i) => (root + i) % 12));

  const rootFret = (si: number) =>
    ((root - (STRING_MIDI[si] % 12)) % 12 + 12) % 12;

  const r6 = rootFret(0) || 12;
  const r5 = rootFret(1) || 12;
  const r4 = rootFret(2) || 12;

  const shapeDefs: { name: string; center: number }[] = [
    { name: "C", center: r5 - 1 },
    { name: "A", center: r5 + 2 },
    { name: "G", center: r6 - 1 },
    { name: "E", center: r6 + 2 },
    { name: "D", center: r4 + 1 },
  ];

  for (const s of shapeDefs) {
    if (s.center < 2) s.center += 12;
  }

  shapeDefs.sort((a, b) => a.center - b.center);

  return shapeDefs.map((def): CAGEDScalePosition => {
    const baseLow = def.center - 1;
    const baseHigh = def.center + 2;
    const stretchLow = baseLow - 2;
    const stretchHigh = baseHigh + 2;

    type Candidate = { string: number; fret: number; midi: number };
    const candidates: Candidate[] = [];

    for (let si = 0; si < 6; si++) {
      const openMidi = STRING_MIDI[si];
      const displayString = 6 - si;
      for (let fret = Math.max(1, stretchLow); fret <= stretchHigh; fret++) {
        const midi = openMidi + fret;
        if (pcSet.has(midi % 12)) {
          candidates.push({ string: displayString, fret, midi });
        }
      }
    }

    const byMidi = new Map<number, Candidate[]>();
    for (const c of candidates) {
      const arr = byMidi.get(c.midi) ?? [];
      arr.push(c);
      byMidi.set(c.midi, arr);
    }

    const kept = new Set<Candidate>();
    for (const dupes of byMidi.values()) {
      if (dupes.length === 1) {
        kept.add(dupes[0]);
        continue;
      }
      dupes.sort((a, b) => b.string - a.string);
      kept.add(dupes[0]);
    }

    const dedupedByString = new Map<number, Candidate[]>();
    for (const c of candidates) {
      if (!kept.has(c)) continue;
      const arr = dedupedByString.get(c.string) ?? [];
      arr.push(c);
      dedupedByString.set(c.string, arr);
    }

    const markers: ScaleMarker[] = [];
    for (const [, notes] of dedupedByString) {
      if (notes.length > 3) {
        notes.sort((a, b) => a.fret - b.fret);
        let bestStart = 0;
        let bestSpan = Infinity;
        for (let i = 0; i <= notes.length - 3; i++) {
          const span = notes[i + 2].fret - notes[i].fret;
          if (span < bestSpan || (span === bestSpan && notes[i].fret >= baseLow)) {
            bestSpan = span;
            bestStart = i;
          }
        }
        const trimmed = notes.slice(bestStart, bestStart + 3);
        for (const c of trimmed) {
          markers.push({
            string: c.string,
            fret: c.fret,
            intervalPc: intervalFromRoot(c.midi, root),
          });
        }
      } else {
        for (const c of notes) {
          markers.push({
            string: c.string,
            fret: c.fret,
            intervalPc: intervalFromRoot(c.midi, root),
          });
        }
      }
    }

    const frets = markers.map((m) => m.fret);
    return {
      name: def.name,
      markers,
      minFret: frets.length ? Math.min(...frets) : baseLow,
      maxFret: frets.length ? Math.max(...frets) : baseHigh,
    };
  });
}

export function get3NPSPositions(
  scale: ScaleDefinition,
  root: number,
): NPS3Position[] {
  const n = scale.intervals.length;
  if (n !== 7) return [];

  const positions: NPS3Position[] = [];

  for (let startDegree = 0; startDegree < n; startDegree++) {
    // Build ascending sequence of 18 notes as offsets from the starting note.
    const relOffsets: number[] = [];
    const startInterval = scale.intervals[startDegree];
    for (let i = 0; i < 6 * 3; i++) {
      const deg = (startDegree + i) % n;
      const octave = Math.floor((startDegree + i) / n);
      relOffsets.push(scale.intervals[deg] + octave * 12 - startInterval);
    }

    // Anchor the starting note on the low E string at the lowest fret >= 1.
    const openLowE = STRING_MIDI[0];
    const targetPc = (root + startInterval) % 12;
    let anchorFret = ((targetPc - openLowE) % 12 + 12) % 12;
    if (anchorFret === 0) anchorFret = 12;
    const anchorMidi = openLowE + anchorFret;

    const markers: ScaleMarker[] = [];
    let minFret = Infinity;
    let maxFret = -Infinity;
    let playable = true;

    for (let i = 0; i < 18; i++) {
      const si = Math.floor(i / 3);
      const displayString = 6 - si;
      const openMidi = STRING_MIDI[si];
      const midi = anchorMidi + relOffsets[i];
      const fret = midi - openMidi;
      if (fret < 1 || fret > 22) {
        playable = false;
        break;
      }
      markers.push({
        string: displayString,
        fret,
        intervalPc: intervalFromRoot(midi, root),
      });
      if (fret < minFret) minFret = fret;
      if (fret > maxFret) maxFret = fret;
    }

    if (playable) {
      positions.push({ index: startDegree + 1, markers, minFret, maxFret });
    }
  }

  return positions;
}
