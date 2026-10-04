import { STRING_MIDI } from "./music";

export type ScaleDefinition = {
  slug: string;
  name: string;
  altNames: string[];
  intervals: number[];
  degrees: string[];
  parent?: { slug: string; name: string; degree: number };
  /**
   * Pitch classes (semitones from root) that are chromatic passing tones rather
   * than chord/scale tones — e.g. the added note in a bebop scale. Rendered
   * with a muted marker in the explorer.
   */
  passingTones?: number[];
  /**
   * Pitch classes that give the scale its character (Dorian's natural 6,
   * Lydian's ♯4…). Highlighted as "color tones" in the explorer.
   */
  colorTones?: number[];
  /** Per-pitch-class label overrides, taking precedence over SCALE_INTERVAL_LABELS. */
  labels?: Record<number, string>;
};

export const SCALES: Record<string, ScaleDefinition> = {
  ionian: {
    slug: "ionian",
    name: "Ionian",
    altNames: ["Major Scale"],
    intervals: [0, 2, 4, 5, 7, 9, 11],
    degrees: ["R", "2", "3", "4", "5", "6", "7"],
    colorTones: [5],
  },
  dorian: {
    slug: "dorian",
    name: "Dorian",
    altNames: [],
    intervals: [0, 2, 3, 5, 7, 9, 10],
    degrees: ["R", "2", "♭3", "4", "5", "6", "♭7"],
    colorTones: [9],
    parent: { slug: "ionian", name: "Ionian", degree: 2 },
  },
  phrygian: {
    slug: "phrygian",
    name: "Phrygian",
    altNames: [],
    intervals: [0, 1, 3, 5, 7, 8, 10],
    degrees: ["R", "♭2", "♭3", "4", "5", "♭6", "♭7"],
    colorTones: [1],
    parent: { slug: "ionian", name: "Ionian", degree: 3 },
  },
  lydian: {
    slug: "lydian",
    name: "Lydian",
    altNames: [],
    intervals: [0, 2, 4, 6, 7, 9, 11],
    degrees: ["R", "2", "3", "♯4", "5", "6", "7"],
    colorTones: [6],
    parent: { slug: "ionian", name: "Ionian", degree: 4 },
  },
  mixolydian: {
    slug: "mixolydian",
    name: "Mixolydian",
    altNames: [],
    intervals: [0, 2, 4, 5, 7, 9, 10],
    degrees: ["R", "2", "3", "4", "5", "6", "♭7"],
    colorTones: [10],
    parent: { slug: "ionian", name: "Ionian", degree: 5 },
  },
  aeolian: {
    slug: "aeolian",
    name: "Aeolian",
    altNames: ["Natural Minor"],
    intervals: [0, 2, 3, 5, 7, 8, 10],
    degrees: ["R", "2", "♭3", "4", "5", "♭6", "♭7"],
    colorTones: [8],
    parent: { slug: "ionian", name: "Ionian", degree: 6 },
  },
  locrian: {
    slug: "locrian",
    name: "Locrian",
    altNames: [],
    intervals: [0, 1, 3, 5, 6, 8, 10],
    degrees: ["R", "♭2", "♭3", "4", "♭5", "♭6", "♭7"],
    colorTones: [6],
    parent: { slug: "ionian", name: "Ionian", degree: 7 },
  },
  "melodic-minor": {
    slug: "melodic-minor",
    name: "Melodic Minor",
    altNames: [],
    intervals: [0, 2, 3, 5, 7, 9, 11],
    degrees: ["R", "2", "♭3", "4", "5", "6", "7"],
    colorTones: [11],
  },
  "lydian-b7": {
    slug: "lydian-b7",
    name: "Lydian ♭7",
    altNames: ["Lydian Dominant"],
    intervals: [0, 2, 4, 6, 7, 9, 10],
    degrees: ["R", "2", "3", "♯4", "5", "6", "♭7"],
    colorTones: [6],
    parent: { slug: "melodic-minor", name: "Melodic Minor", degree: 4 },
  },
  "harmonic-minor": {
    slug: "harmonic-minor",
    name: "Harmonic Minor",
    altNames: [],
    intervals: [0, 2, 3, 5, 7, 8, 11],
    degrees: ["R", "2", "♭3", "4", "5", "♭6", "7"],
    colorTones: [11],
  },
  "mixolydian-b9-b13": {
    slug: "mixolydian-b9-b13",
    name: "Mixolydian ♭9 ♭13",
    altNames: ["Phrygian Dominant"],
    intervals: [0, 1, 4, 5, 7, 8, 10],
    degrees: ["R", "♭9", "3", "4", "5", "♭13", "♭7"],
    colorTones: [1],
    parent: { slug: "harmonic-minor", name: "Harmonic Minor", degree: 5 },
  },
  "bebop-dominant": {
    slug: "bebop-dominant",
    name: "Bebop Dominant",
    altNames: [],
    intervals: [0, 2, 4, 5, 7, 9, 10, 11],
    degrees: ["R", "2", "3", "4", "5", "6", "♭7", "7"],
    passingTones: [11],
    colorTones: [10],
  },
  "bebop-major": {
    slug: "bebop-major",
    name: "Bebop Major",
    altNames: [],
    intervals: [0, 2, 4, 5, 7, 8, 9, 11],
    degrees: ["R", "2", "3", "4", "5", "♯5", "6", "7"],
    passingTones: [8],
    colorTones: [5],
    labels: { 8: "♯5" },
  },
  "bebop-dorian": {
    slug: "bebop-dorian",
    name: "Bebop Dorian",
    altNames: ["Bebop Minor"],
    intervals: [0, 2, 3, 5, 7, 9, 10, 11],
    degrees: ["R", "2", "♭3", "4", "5", "6", "♭7", "7"],
    passingTones: [11],
    colorTones: [9],
  },
  "bebop-melodic-minor": {
    slug: "bebop-melodic-minor",
    name: "Bebop Melodic Minor",
    altNames: [],
    intervals: [0, 2, 3, 5, 7, 8, 9, 11],
    degrees: ["R", "2", "♭3", "4", "5", "♯5", "6", "7"],
    passingTones: [8],
    colorTones: [11],
    labels: { 8: "♯5" },
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

export type Finger = 1 | 2 | 3 | 4;

export type NPS3Position = {
  index: number;
  markers: (ScaleMarker & { finger: Finger })[];
  minFret: number;
  maxFret: number;
  /** Fret of finger 1 in its natural (unstretched) place. */
  handFret: number;
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

/**
 * 3NPS fingerings built on a fixed hand frame. Fingers 2 and 3 always sit on
 * `handFret + 1` and `handFret + 2` — adjacent frets, never spread, nothing
 * played between them. Only the outer fingers stretch: finger 1 plays
 * `handFret` or one fret back, finger 4 plays `handFret + 3` or one fret up.
 * Each finger plays at most one note per string, so the hand never shifts
 * inside a position.
 *
 * Strings aim for three notes; where the frame can't fit a third the string
 * takes two (or four), keeping the scale continuous from the low E to the
 * high E without repeating a pitch. Among valid fingerings the one with the
 * fewest stretches wins.
 *
 * There is one position per scale degree (7 in total), each starting on that
 * degree on the low E string. Passing tones (bebop scales) don't start a
 * position but are played wherever the frame reaches them.
 */
export function get3NPSPositions(
  scale: ScaleDefinition,
  root: number,
): NPS3Position[] {
  const passing = new Set(scale.passingTones ?? []);
  const core = scale.intervals.filter((i) => !passing.has(i));
  const corePcs = new Set(core.map((i) => (root + i) % 12));
  const passingPcs = new Set([...passing].map((i) => (root + i) % 12));
  const nextScaleMidi = (midi: number) => {
    let m = midi + 1;
    while (!corePcs.has(m % 12)) m++;
    return m;
  };

  const fingerFor = (fret: number, hand: number): Finger =>
    fret <= hand ? 1 : fret === hand + 1 ? 2 : fret === hand + 2 ? 3 : 4;

  type StringPlan = { frets: number[]; cost: number };

  // Cheapest fingering from string `si` upward, given the pitch it starts on.
  const solve = (hand: number, si: number, startMidi: number): StringPlan[] | null => {
    if (si === 6) return [];
    const open = STRING_MIDI[si];
    const lowest = Math.max(1, hand - 1);
    if (startMidi - open < lowest || startMidi - open > hand + 4) return null;

    let best: StringPlan[] | null = null;
    let bestCost = Infinity;
    const frets: number[] = [];
    const used = new Set<Finger>();
    for (let midi = startMidi; midi - open <= hand + 4; midi = nextScaleMidi(midi)) {
      const fret = midi - open;
      const finger = fingerFor(fret, hand);
      if (used.has(finger)) break;
      used.add(finger);
      frets.push(fret);

      const stretches = frets.filter((f) => f === hand - 1 || f === hand + 4).length;
      const cost = Math.abs(frets.length - 3) * 4 + stretches;
      const rest = solve(hand, si + 1, nextScaleMidi(midi));
      if (!rest) continue;
      const total = rest.reduce((sum, r) => sum + r.cost, cost);
      if (total < bestCost) {
        bestCost = total;
        best = [{ frets: [...frets], cost }, ...rest];
      }
    }
    return best;
  };

  const positions: NPS3Position[] = [];
  for (const interval of core) {
    const targetPc = (root + interval) % 12;
    const lowestFret = ((targetPc - STRING_MIDI[0]) % 12 + 12) % 12 || 12;

    // The first note is finger 1, either in place or stretched back. Near the
    // nut the frame may not fit, so fall back to the octave above.
    let best: { hand: number; plan: StringPlan[]; cost: number } | null = null;
    for (const firstFret of [lowestFret, lowestFret + 12]) {
      for (const hand of [firstFret, firstFret + 1]) {
        const plan = solve(hand, 0, STRING_MIDI[0] + firstFret);
        if (!plan) continue;
        const cost = plan.reduce((sum, r) => sum + r.cost, 0);
        if (!best || cost < best.cost) best = { hand, plan, cost };
      }
      if (best) break;
    }
    if (!best) continue;

    const { hand, plan } = best;
    const strings = plan.map((s) => [...s.frets]);

    // Slot each passing tone onto a string where the frame reaches it with a
    // free finger, without breaking the ascending order across strings.
    const lowMidi = STRING_MIDI[0] + strings[0][0];
    const highMidi = STRING_MIDI[5] + strings[5][strings[5].length - 1];
    for (let midi = lowMidi + 1; midi < highMidi; midi++) {
      if (!passingPcs.has(midi % 12)) continue;
      for (let si = 0; si < 6; si++) {
        const fret = midi - STRING_MIDI[si];
        if (fret < Math.max(1, hand - 1) || fret > hand + 4) continue;
        const below = si > 0 ? STRING_MIDI[si - 1] + strings[si - 1].at(-1)! : -Infinity;
        const above = si < 5 ? STRING_MIDI[si + 1] + strings[si + 1][0] : Infinity;
        if (midi <= below || midi >= above) continue;
        const finger = fingerFor(fret, hand);
        if (strings[si].some((f) => fingerFor(f, hand) === finger)) continue;
        strings[si] = [...strings[si], fret].sort((a, b) => a - b);
        break;
      }
    }

    const markers = strings.flatMap((frets, si) =>
      frets.map((fret) => ({
        string: 6 - si,
        fret,
        intervalPc: intervalFromRoot(STRING_MIDI[si] + fret, root),
        finger: fingerFor(fret, hand),
      })),
    );
    const frets = markers.map((m) => m.fret);
    positions.push({
      index: positions.length + 1,
      markers,
      minFret: Math.min(...frets),
      maxFret: Math.max(...frets),
      handFret: hand,
    });
  }

  return positions;
}
