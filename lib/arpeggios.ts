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

const CAGED_NAMES = ["C", "A", "G", "E", "D"];

// CAGED shapes are derived by finding the 5 root positions on the low strings
// and building an arpeggio shape around each one within a 4-5 fret span.
export function getCagedShapes(
  quality: ArpeggioQuality,
  root: number,
): CagedShape[] {
  const formula = ARPEGGIO_FORMULAS[quality];
  const pcSet = new Set(formula.map((i) => (root + i) % 12));

  // Find root positions on strings 6, 5, 4 (indices 0, 1, 2)
  const rootFrets: { si: number; fret: number }[] = [];
  for (let si = 0; si < 3; si++) {
    const openMidi = STRING_MIDI[si];
    let baseFret = ((root - (openMidi % 12)) % 12 + 12) % 12;
    if (baseFret === 0) baseFret = 12;
    for (let fret = baseFret; fret <= 15; fret += 12) {
      rootFrets.push({ si, fret });
    }
  }

  rootFrets.sort((a, b) => a.fret - b.fret || a.si - b.si);

  // Take 5 unique positions by fret region
  const seen = new Set<number>();
  const anchors: { si: number; fret: number }[] = [];
  for (const rf of rootFrets) {
    const region = Math.floor(rf.fret / 3);
    if (!seen.has(region) && anchors.length < 5) {
      seen.add(region);
      anchors.push(rf);
    }
  }

  return anchors.map((anchor, idx): CagedShape => {
    const centerFret = anchor.fret;
    const lowFret = Math.max(1, centerFret - 2);
    const highFret = centerFret + 3;

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
      name: CAGED_NAMES[idx % CAGED_NAMES.length],
      markers,
      minFret: Math.min(...frets),
      maxFret: Math.max(...frets),
    };
  });
}
