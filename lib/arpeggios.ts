import { STRING_MIDI } from "./music";

export type TriadQuality = "major" | "minor" | "dim" | "aug";
export type TetradQuality = "maj7" | "m7" | "7" | "m7b5" | "dim7";
export type ArpeggioQuality = TriadQuality | TetradQuality;

export const TRIAD_FORMULAS: Record<TriadQuality, readonly number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
};

export const TETRAD_FORMULAS: Record<TetradQuality, readonly number[]> = {
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  "7": [0, 4, 7, 10],
  m7b5: [0, 3, 6, 10],
  dim7: [0, 3, 6, 9],
};

export const ARPEGGIO_FORMULAS: Record<ArpeggioQuality, readonly number[]> = {
  ...TRIAD_FORMULAS,
  ...TETRAD_FORMULAS,
};

export const ARPEGGIO_LABELS: Record<ArpeggioQuality, string> = {
  major: "Major",
  minor: "Minor",
  dim: "Diminished",
  aug: "Augmented",
  maj7: "Major 7",
  m7: "Minor 7",
  "7": "Dominant 7",
  m7b5: "Minor 7♭5",
  dim7: "Diminished 7",
};

export const ARPEGGIO_SUFFIXES: Record<ArpeggioQuality, string> = {
  major: "",
  minor: "m",
  dim: "°",
  aug: "+",
  maj7: "maj7",
  m7: "m7",
  "7": "7",
  m7b5: "m7♭5",
  dim7: "°7",
};

export const ARPEGGIO_INTERVAL_LABELS: Record<number, string> = {
  0: "R",
  3: "♭3",
  4: "3",
  6: "♭5",
  7: "5",
  8: "♯5",
  9: "°7",
  10: "♭7",
  11: "7",
};

export type ArpeggioMarker = {
  string: number;
  fret: number;
  intervalPc: number;
};

function intervalFromRoot(midi: number, rootPc: number): number {
  return (((midi - rootPc) % 12) + 12) % 12;
}

export function getFullNeckArpeggio(
  quality: ArpeggioQuality,
  root: number,
  frets: number,
  startFret: number = 0,
): ArpeggioMarker[] {
  const formula = ARPEGGIO_FORMULAS[quality];
  const pcSet = new Set(formula.map((i) => (root + i) % 12));
  const markers: ArpeggioMarker[] = [];
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

export type CagedShape = {
  name: string;
  markers: ArpeggioMarker[];
  minFret: number;
  maxFret: number;
};

export function getCagedShapes(
  quality: ArpeggioQuality,
  root: number,
): CagedShape[] {
  const formula = ARPEGGIO_FORMULAS[quality];
  const pcSet = new Set(formula.map((i) => (root + i) % 12));

  const rootFret = (si: number) =>
    ((root - (STRING_MIDI[si] % 12)) % 12 + 12) % 12;

  const r6 = rootFret(0) || 12;
  const r5 = rootFret(1) || 12;
  const r4 = rootFret(2) || 12;

  const shapeDefs: { name: string; low: number; high: number }[] = [
    { name: "C", low: r5 - 3, high: r5 + 1 },
    { name: "A", low: r5, high: r5 + 4 },
    { name: "G", low: r6 - 3, high: r6 + 1 },
    { name: "E", low: r6, high: r6 + 4 },
    { name: "D", low: r4 - 1, high: r4 + 3 },
  ];

  for (const s of shapeDefs) {
    if (s.low < 0) {
      s.low += 12;
      s.high += 12;
    }
  }

  shapeDefs.sort((a, b) => a.low - b.low);

  return shapeDefs.map((def): CagedShape => {
    const lowFret = Math.max(1, def.low);
    const highFret = def.high;

    const markers: ArpeggioMarker[] = [];
    for (let si = 0; si < 6; si++) {
      const openMidi = STRING_MIDI[si];
      const displayString = 6 - si;
      for (let fret = lowFret; fret <= highFret; fret++) {
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

    const frets = markers.map((m) => m.fret);
    return {
      name: def.name,
      markers,
      minFret: frets.length ? Math.min(...frets) : lowFret,
      maxFret: frets.length ? Math.max(...frets) : highFret,
    };
  });
}
