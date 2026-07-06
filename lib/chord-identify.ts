import { STRING_MIDI, noteName, type Spelling } from "./music";

export type Fret = number | "x"; // 0 = open string, "x" = muted, n>0 = fretted
export type FretInput = readonly Fret[]; // length 6, low E → high E

/*
 * Generative "stacked thirds" chord identifier.
 *
 * Rather than matching against a fixed dictionary of chord shapes, we treat a
 * chord as a root plus a set of scale degrees stacked in thirds. For every
 * candidate root we classify each sounding note into a slot — third, fifth,
 * seventh, and the upper tensions (9/11/13 and their alterations) — then build
 * a chord symbol from those slots. This names *any* combination of notes
 * (maj13, 7♭9♯11, m(maj9), slash chords with a foreign bass, …) instead of
 * giving up when a voicing isn't in a lookup table. Interpretations are then
 * ranked by how simple/well-formed the resulting chord is, with a tie-break
 * favouring the reading whose root is the actual bass note.
 */

type Third = "maj" | "min" | "sus2" | "sus4" | "none";
type Fifth = "perf" | "dim" | "aug" | "none";
type Seventh = "maj7" | "b7" | "6" | "none";

/** Result of analysing one candidate root against the played pitch classes. */
export type ChordMatch = {
  rootPc: number;
  bassPc: number;
  /** Chord-symbol suffix appended after the root name (e.g. "m7♭5", "13♭9"). */
  symbol: string;
  /** Degree label for every distinct played pitch class, root → up. */
  degreeLabels: string[];
  /** Chord tones implied by the symbol but not actually played (e.g. ["5"]). */
  omissions: string[];
  /** Lower = simpler / more likely. Sorted descending elsewhere as `score`. */
  score: number;
};

export type IdentifyResult = {
  /** Sounding pitches, low → high. Empty if nothing is played. */
  midi: number[];
  /** Unique pitch classes present in the voicing. */
  pitchClasses: number[];
  bassPc: number | null;
  matches: ChordMatch[];
};

export function fretsToMidi(frets: FretInput): number[] {
  const out: number[] = [];
  for (let i = 0; i < frets.length; i++) {
    const f = frets[i];
    if (typeof f === "number") out.push(STRING_MIDI[i] + f);
  }
  return out.sort((a, b) => a - b);
}

/** Fixed display order for tensions when appended to a symbol / listed. */
const TENSION_ORDER = ["♭9", "9", "♯9", "11", "♯11", "♭13", "13"] as const;

type Analysis = {
  symbol: string;
  labels: Map<number, string>; // interval (0–11) → degree label
  omissions: string[];
  /** Structural complexity used for scoring (lower = simpler). */
  complexity: number;
};

/**
 * Analyse the interval set (relative to a root) as a stacked-thirds chord.
 * `intervals` is the set of pitch classes present, reduced so the root is 0.
 * Always returns an analysis for 3+ notes — the point is that nothing is
 * "unnameable".
 */
function analyzeRoot(intervals: Set<number>): Analysis {
  const has = (i: number) => intervals.has(i);
  const labels = new Map<number, string>();
  labels.set(0, "R");

  // --- Classify the three core slots -------------------------------------
  let third: Third;
  if (has(4)) third = "maj";
  else if (has(3)) third = "min";
  else if (has(5)) third = "sus4";
  else if (has(2)) third = "sus2";
  else third = "none";

  let fifth: Fifth;
  if (has(7)) fifth = "perf";
  else if (has(6)) fifth = "dim";
  else if (has(8)) fifth = "aug";
  else fifth = "none";

  let seventh: Seventh;
  if (has(11)) seventh = "maj7";
  else if (has(10)) seventh = "b7";
  else if (has(9)) seventh = "6";
  else seventh = "none";

  const hasSeventh = seventh === "maj7" || seventh === "b7";
  const isMin = third === "min";
  const isSus = third === "sus2" || third === "sus4";
  const dimFamily = isMin && fifth === "dim";

  // --- Label the consumed core tones -------------------------------------
  if (third === "maj") labels.set(4, "3");
  else if (third === "min") labels.set(3, "♭3");
  else if (third === "sus2") labels.set(2, "2");
  else if (third === "sus4") labels.set(5, "4");

  if (fifth === "perf") labels.set(7, "5");
  else if (fifth === "dim") labels.set(6, "♭5");
  else if (fifth === "aug") labels.set(8, "♯5");

  if (seventh === "maj7") labels.set(11, "7");
  else if (seventh === "b7") labels.set(10, "♭7");
  else if (seventh === "6") labels.set(9, dimFamily ? "°7" : "6");

  // --- Collect the upper tensions (everything not yet consumed) -----------
  const tension = {
    "♭9": has(1),
    "9": has(2) && third !== "sus2",
    "♯9": has(3) && third === "maj",
    "11": has(5) && third !== "sus4",
    "♯11": has(6) && fifth === "perf",
    "♭13": has(8) && fifth !== "aug",
    "13": has(9) && hasSeventh,
  };
  if (tension["♭9"]) labels.set(1, "♭9");
  if (tension["9"]) labels.set(2, "9");
  if (tension["♯9"]) labels.set(3, "♯9");
  if (tension["11"]) labels.set(5, "11");
  if (tension["♯11"]) labels.set(6, "♯11");
  if (tension["♭13"]) labels.set(8, "♭13");
  if (tension["13"]) labels.set(9, "13");

  // --- Decide the headline extension number (7 → 9 → 11 → 13) -------------
  // The number reflects the highest natural stacking degree present; any lower
  // naturals it implies are "consumed", leftovers become "add" tones, and
  // altered tensions (♭9/♯9/♯11/♭13) are always spelled out explicitly. A
  // dominant 13♭9 still reads as "13♭9" even without the natural 9.
  const consumed = new Set<string>();
  let extNum = 7;
  if (hasSeventh) {
    if (tension["13"]) {
      // Dominant/major 13 conventionally skips the (avoid-note) 11; minor 13
      // stacks the 11 in.
      extNum = 13;
      consumed.add("13");
      if (tension["9"]) consumed.add("9");
      if (isMin && tension["11"]) consumed.add("11");
    } else if (isMin && tension["11"]) {
      extNum = 11;
      consumed.add("11");
      if (tension["9"]) consumed.add("9");
    } else if (tension["9"]) {
      extNum = 9;
      consumed.add("9");
    }
  }

  // --- Build the symbol prefix (quality + fifth alteration) --------------
  const omissions: string[] = [];
  if (fifth === "none") omissions.push("5");
  if (third === "none") omissions.push("3");

  const fifthTag = fifth === "dim" ? "♭5" : fifth === "aug" ? "♯5" : "";

  let symbol: string;
  if (isSus) {
    // Suspended: no third, sits on 2 or 4.
    const s = third; // "sus2" | "sus4"
    if (seventh === "b7") symbol = `${extNum}${s}`;
    else if (seventh === "maj7") symbol = `maj${extNum}${s}`;
    else if (seventh === "6") symbol = `6${s}`;
    else symbol = s;
  } else if (dimFamily && seventh === "6") {
    symbol = "°7"; // diminished seventh
  } else if (dimFamily && seventh === "b7") {
    symbol = `m${extNum}♭5`; // half-diminished (m7♭5 / m9♭5 …)
  } else if (dimFamily && seventh === "maj7") {
    symbol = `m(maj${extNum})♭5`;
  } else if (dimFamily) {
    symbol = "°"; // diminished triad
  } else if (seventh === "maj7") {
    symbol = isMin ? `m(maj${extNum})` : `maj${extNum}`;
    symbol += fifthTag;
  } else if (seventh === "b7") {
    symbol = `${isMin ? "m" : ""}${extNum}${fifthTag}`;
  } else if (seventh === "6") {
    // Sixth chord; a 6 with a 9 becomes 6/9.
    const sixNine = tension["9"];
    if (sixNine) consumed.add("9");
    symbol = `${isMin ? "m" : ""}${sixNine ? "6/9" : "6"}`;
    if (fifthTag) symbol += `(${fifthTag})`;
  } else {
    // Plain triad (no seventh).
    if (!isMin && fifth === "aug") symbol = "+";
    else {
      symbol = isMin ? "m" : "";
      // ♭5/♯5 on a bare triad is ambiguous next to the root name → parenthesise.
      if (fifthTag) symbol += `(${fifthTag})`;
    }
  }

  // --- Append leftover tensions ------------------------------------------
  const altered: string[] = [];
  const added: string[] = [];
  for (const t of TENSION_ORDER) {
    if (!tension[t as keyof typeof tension]) continue;
    if (consumed.has(t)) continue;
    if (t === "9" || t === "11" || t === "13") added.push(t);
    else altered.push(t); // ♭9, ♯9, ♯11, ♭13
  }
  // Altered tensions attach directly (7♭9, maj7♯11, 13♭9♯11).
  if (altered.length) symbol += altered.join("");
  // Natural leftovers are genuine "add" tones.
  for (const a of added) symbol += `add${a}`;

  // --- Structural complexity for ranking ---------------------------------
  let complexity = 0;
  complexity += altered.length * 2;
  complexity += added.length * 2;
  if (extNum === 9) complexity += 1;
  else if (extNum === 11) complexity += 2;
  else if (extNum === 13) complexity += 3;
  if (seventh === "6" && !dimFamily) complexity += 0.5;
  if (third === "none") complexity += 5;
  else if (isSus) complexity += 0.5;
  if (fifth === "aug") complexity += 3;
  else if (fifth === "none") complexity += 1.5;
  else if (fifth === "dim") {
    // Only °7, half-diminished, and the plain diminished triad are idiomatic
    // ♭5 chords; anything else (maj-third ♭5, m(maj7)♭5, dim + tensions) is
    // exotic and should not out-rank a plain-fifth reading of the same notes.
    if (dimFamily && (seventh === "6" || seventh === "b7")) complexity += 0;
    else if (dimFamily && seventh === "none") complexity += 0.5;
    else complexity += 3;
  }

  return { symbol, labels, omissions, complexity };
}

export function identifyChord(frets: FretInput): IdentifyResult {
  const midi = fretsToMidi(frets);
  if (midi.length === 0) {
    return { midi, pitchClasses: [], bassPc: null, matches: [] };
  }
  const bassPc = midi[0] % 12;
  const pcSet = new Set(midi.map((m) => m % 12));
  const pcs = [...pcSet].sort((a, b) => a - b);
  const matches = identifyPitchClasses(pcs, bassPc);
  return { midi, pitchClasses: pcs, bassPc, matches };
}

/**
 * Rank chord interpretations for a bare set of distinct pitch classes and a
 * bass. Returns `[]` for fewer than three distinct pitch classes.
 */
export function identifyPitchClasses(
  pitchClasses: readonly number[],
  bassPc: number,
): ChordMatch[] {
  const pcs = [...new Set(pitchClasses)].sort((a, b) => a - b);
  if (pcs.length < 3) return [];

  const matches: ChordMatch[] = [];

  for (const rootPc of pcs) {
    const intervals = new Set(pcs.map((p) => (p - rootPc + 12) % 12));
    const a = analyzeRoot(intervals);

    // Degree labels for the played notes, ordered by interval from the root.
    const degreeLabels = [...intervals]
      .sort((x, y) => x - y)
      .map((i) => a.labels.get(i) ?? "?");

    const isSlash = rootPc !== bassPc;
    // Simplicity dominates; root-in-the-bass is only a gentle tie-break so
    // inversions read as slash chords rather than exotic re-rootings.
    const score =
      -10 * a.complexity + (isSlash ? -3 : 8) - a.omissions.length * 0.5;

    matches.push({
      rootPc,
      bassPc,
      symbol: a.symbol,
      degreeLabels,
      omissions: a.omissions,
      score,
    });
  }

  matches.sort((a, b) => b.score - a.score);
  return matches;
}

export function chordName(match: ChordMatch, spelling?: Spelling): string {
  const root = noteName(match.rootPc, spelling);
  const bass = noteName(match.bassPc, spelling);
  const slash = match.rootPc !== match.bassPc ? `/${bass}` : "";
  return `${root}${match.symbol}${slash}`;
}

/** Per-note degree labels (root → up) for the played notes. */
export function intervalLabelsForMatch(match: ChordMatch): string[] {
  return match.degreeLabels;
}

/** Human-readable explanation appended to alternate names. */
export function matchExplanation(
  match: ChordMatch,
  spelling?: Spelling,
): string {
  const parts: string[] = [];
  if (match.omissions.length > 0) {
    parts.push(`omits ${match.omissions.join(" + ")}`);
  }
  if (match.rootPc !== match.bassPc) {
    parts.push(`${noteName(match.bassPc, spelling)} in the bass`);
  }
  return parts.join("; ");
}
