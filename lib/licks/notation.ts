/**
 * Lick notation: a compact text format for single-line phrases, plus
 * transposition with correct spelling and conversion to ABC for the staff.
 *
 * A lick is written as space-separated tokens, bars split by `|`:
 *
 *   "r/8 D4/8 F4/8 A4/8 C5/8 E5/8 D5/8 C5/8 | B4/8 D5/8 …"
 *
 * Each token is `<pitch>/<duration>`. Pitches are written guitar pitch in
 * scientific notation (`C4` is middle C, as on the treble staff; the guitar
 * sounds an octave lower), with `#`/`##`/`b`/`bb` accidentals; `r` is a rest.
 * Durations are `1 2 4 8 16`, optionally dotted (`4.`) or a triplet (`8t`).
 * A trailing `~` ties the note to the next one. Every bar must add up to 4/4.
 */

export const BEATS_PER_BAR = 4;

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];

/** A spelled pitch: letter index (0 = C … 6 = B), accidental and octave. */
export type Pitch = { letter: number; acc: number; octave: number };

export type LickNote = {
  /** Null for a rest. */
  pitch: Pitch | null;
  /** Start, in beats from the beginning of the lick. */
  start: number;
  /** Actual length in beats (triplets already scaled). */
  beats: number;
  /** Notated length in beats, before triplet scaling. */
  notated: number;
  triplet: boolean;
  /** Tied to the next note (same pitch). */
  tie: boolean;
  bar: number;
};

export type ParsedLick = { notes: LickNote[]; bars: number };

const EPS = 1e-6;
const TOKEN = /^(r|([A-G])(##|#|bb|b)?(\d))\/(1|2|4|8|16)(\.)?(t)?(~)?$/;
const ACC_VALUE: Record<string, number> = { "##": 2, "#": 1, b: -1, bb: -2 };

export function midiOf(p: Pitch): number {
  return (p.octave + 1) * 12 + LETTER_PC[p.letter] + p.acc;
}

export function pitchClassOf(p: Pitch): number {
  return (((LETTER_PC[p.letter] + p.acc) % 12) + 12) % 12;
}

const ACC_SYMBOL: Record<number, string> = { [-2]: "𝄫", [-1]: "♭", 0: "", 1: "♯", 2: "𝄪" };

/** Display name without octave: "B♭", "F♯". */
export function pitchName(p: Pitch): string {
  return LETTERS[p.letter] + ACC_SYMBOL[p.acc];
}

/** Parses and validates a lick; throws with the bar and token on any error. */
export function parseLick(source: string): ParsedLick {
  const bars = source.split("|").map((b) => b.trim());
  const notes: LickNote[] = [];
  let start = 0;

  bars.forEach((bar, barIndex) => {
    const tokens = bar.split(/\s+/).filter(Boolean);
    let barBeats = 0;
    for (const token of tokens) {
      const m = token.match(TOKEN);
      if (!m) throw new Error(`Bar ${barIndex + 1}: invalid token "${token}"`);
      const [, , letter, acc, octave, den, dot, triplet, tie] = m;
      const notated = (BEATS_PER_BAR / Number(den)) * (dot ? 1.5 : 1);
      const beats = triplet ? (notated * 2) / 3 : notated;
      notes.push({
        pitch: letter
          ? {
              letter: LETTERS.indexOf(letter as (typeof LETTERS)[number]),
              acc: acc ? ACC_VALUE[acc] : 0,
              octave: Number(octave),
            }
          : null,
        start,
        beats,
        notated,
        triplet: Boolean(triplet),
        tie: Boolean(tie),
        bar: barIndex,
      });
      start += beats;
      barBeats += beats;
    }
    if (Math.abs(barBeats - BEATS_PER_BAR) > EPS) {
      throw new Error(
        `Bar ${barIndex + 1} has ${+barBeats.toFixed(3)} beats, expected ${BEATS_PER_BAR}`,
      );
    }
  });

  tripletGroups(notes); // validates grouping
  notes.forEach((n, i) => {
    if (!n.tie) return;
    const next = notes[i + 1];
    if (!n.pitch || !next?.pitch || midiOf(n.pitch) !== midiOf(next.pitch)) {
      throw new Error(`Tie at note ${i + 1} must join two notes of the same pitch`);
    }
  });

  return { notes, bars: bars.length };
}

/**
 * Splits consecutive triplet notes into groups of "three in the time of two".
 * A group closes once it fills two of its shortest notated value (one beat
 * for eighth-note triplets), so mixed groups like quarter + eighth work too.
 */
export function tripletGroups(notes: LickNote[]): { first: number; count: number }[] {
  const groups: { first: number; count: number }[] = [];
  let i = 0;
  while (i < notes.length) {
    if (!notes[i].triplet) {
      i++;
      continue;
    }
    const first = i;
    let actual = 0;
    let shortest = Infinity;
    while (i < notes.length && notes[i].triplet) {
      actual += notes[i].beats;
      shortest = Math.min(shortest, notes[i].notated);
      i++;
      if (Math.abs(actual - shortest * 2) < EPS) break;
    }
    if (Math.abs(actual - shortest * 2) > EPS) {
      throw new Error(`Triplet group starting at note ${first + 1} is incomplete`);
    }
    groups.push({ first, count: i - first });
  }
  return groups;
}

// --- Keys and transposition ------------------------------------------------

export type KeyMode = "major" | "minor";

/** A key centre: spelled tonic plus mode. */
export type LickKey = { tonic: Pitch; mode: KeyMode };

/** Conventional tonic spellings for the 12 keys, indexed by pitch class. */
const MAJOR_TONICS = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const MINOR_TONICS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "G#", "A", "Bb", "B"];

/** Parses "C", "Bb", "F# minor", "Cm" into a key. */
export function parseKey(name: string): LickKey {
  const m = name.trim().match(/^([A-G])(#|b)?\s*(m|minor|major)?$/);
  if (!m) throw new Error(`Invalid key "${name}"`);
  const [, letter, acc, mode] = m;
  return {
    tonic: { letter: LETTERS.indexOf(letter as (typeof LETTERS)[number]), acc: acc ? ACC_VALUE[acc] : 0, octave: 4 },
    mode: mode === "m" || mode === "minor" ? "minor" : "major",
  };
}

/** The key with the given tonic pitch class, spelled conventionally. */
export function keyForPitchClass(pc: number, mode: KeyMode): LickKey {
  const names = mode === "minor" ? MINOR_TONICS : MAJOR_TONICS;
  return parseKey(names[((pc % 12) + 12) % 12] + (mode === "minor" ? "m" : ""));
}

export function keyName(key: LickKey): string {
  return pitchName(key.tonic) + (key.mode === "minor" ? "m" : "");
}

/** Interval as letter steps plus semitones, so spelling survives transposition. */
export type Interval = { letters: number; semitones: number };

export function intervalBetween(from: LickKey, to: LickKey): Interval {
  const letters = (((to.tonic.letter - from.tonic.letter) % 7) + 7) % 7;
  const semitones = (((pitchClassOf(to.tonic) - pitchClassOf(from.tonic)) % 12) + 12) % 12;
  return { letters, semitones };
}

export function transposePitch(p: Pitch, iv: Interval): Pitch {
  const absLetter = p.octave * 7 + p.letter + iv.letters;
  const letter = absLetter % 7;
  const octave = Math.floor(absLetter / 7);
  const target = midiOf(p) + iv.semitones;
  const natural = (octave + 1) * 12 + LETTER_PC[letter];
  return { letter, acc: target - natural, octave };
}

// Written range of a guitar (low E3 open … about the 17th fret on the top string).
const WRITTEN_LOW = 52;
const WRITTEN_HIGH = 93;

/**
 * Transposes a lick to another key, choosing the octave that keeps it on the
 * guitar and closest to where it was written.
 */
export function transposeLick(lick: ParsedLick, from: LickKey, to: LickKey): {
  lick: ParsedLick;
  interval: Interval;
} {
  const up = intervalBetween(from, to);
  const options = [up, { letters: up.letters - 7, semitones: up.semitones - 12 }];
  const midis = lick.notes.flatMap((n) => (n.pitch ? [midiOf(n.pitch)] : []));
  const lo = Math.min(...midis);
  const hi = Math.max(...midis);
  const fits = (iv: Interval) => lo + iv.semitones >= WRITTEN_LOW && hi + iv.semitones <= WRITTEN_HIGH;
  const interval =
    options.filter(fits).sort((a, b) => Math.abs(a.semitones) - Math.abs(b.semitones))[0] ??
    options.sort((a, b) => Math.abs(a.semitones) - Math.abs(b.semitones))[0];
  return {
    interval,
    lick: {
      ...lick,
      notes: lick.notes.map((n) => {
        if (!n.pitch) return n;
        const p = transposePitch(n.pitch, interval);
        // Remote keys produce double accidentals (E𝄫 for a ♭9); read them enharmonically.
        return { ...n, pitch: Math.abs(p.acc) > 1 ? respell(p) : p };
      }),
    },
  };
}

// --- Chord symbols ---------------------------------------------------------

/** One chord with its span, in beats from the start of the lick. */
export type TimedChord = { symbol: string; start: number; beats: number };

/** Expands per-bar chord strings ("Dm7", "Dm7 G7") into timed chords. */
export function timedChords(bars: string[]): TimedChord[] {
  return bars.flatMap((bar, b) => {
    const symbols = bar.trim().split(/\s+/).filter(Boolean);
    const span = BEATS_PER_BAR / symbols.length;
    return symbols.map((symbol, i) => ({
      symbol,
      start: b * BEATS_PER_BAR + i * span,
      beats: span,
    }));
  });
}

export function chordAt(chords: TimedChord[], beat: number): TimedChord | undefined {
  return chords.find((c) => beat >= c.start - EPS && beat < c.start + c.beats - EPS);
}

/** Transposes a chord symbol's root by the interval, keeping its suffix. */
export function transposeChord(symbol: string, iv: Interval): string {
  const m = symbol.match(/^([A-G])(#|b)?(.*)$/);
  if (!m) return symbol;
  const [, letter, acc, suffix] = m;
  const root = transposePitch(
    { letter: LETTERS.indexOf(letter as (typeof LETTERS)[number]), acc: acc ? ACC_VALUE[acc] : 0, octave: 4 },
    iv,
  );
  // A double accidental on a root reads badly; respell it on a neighbour letter.
  const spelled = Math.abs(root.acc) > 1 ? respell(root) : root;
  return LETTERS[spelled.letter] + (spelled.acc === 1 ? "#" : spelled.acc === -1 ? "b" : "") + suffix;
}

function respell(p: Pitch): Pitch {
  const step = p.acc > 0 ? 1 : -1;
  const letter = (p.letter + step + 7) % 7;
  const octave = p.octave + (p.letter + step > 6 ? 1 : p.letter + step < 0 ? -1 : 0);
  const natural = (octave + 1) * 12 + LETTER_PC[letter];
  return { letter, acc: midiOf(p) - natural, octave };
}

/** Chord symbol for display: ASCII accidentals become ♭/♯. */
export function displayChord(symbol: string): string {
  return symbol.replace(/^([A-G])b/, "$1♭").replace(/b(?=\d)/g, "♭").replace(/#/g, "♯");
}

// --- ABC export ------------------------------------------------------------

const SHARP_ORDER = [3, 0, 4, 1, 5, 2, 6]; // F C G D A E B
const FLAT_ORDER = [6, 2, 5, 1, 4, 0, 3]; // B E A D G C F
const MAJOR_SIGNATURES: Record<string, number> = {
  C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, "F#": 6, "C#": 7,
  F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7,
};

function asciiName(p: Pitch): string {
  return LETTERS[p.letter] + (p.acc > 0 ? "#".repeat(p.acc) : "b".repeat(-p.acc));
}

/** Accidental per letter implied by the key signature. */
function signature(key: LickKey): number[] {
  const major =
    key.mode === "minor" ? transposePitch(key.tonic, { letters: 2, semitones: 3 }) : key.tonic;
  const count = MAJOR_SIGNATURES[asciiName(major)] ?? 0;
  const acc = Array(7).fill(0);
  (count > 0 ? SHARP_ORDER : FLAT_ORDER)
    .slice(0, Math.abs(count))
    .forEach((letter) => (acc[letter] = count > 0 ? 1 : -1));
  return acc;
}

const ABC_ACC: Record<number, string> = { [-2]: "__", [-1]: "_", 0: "=", 1: "^", 2: "^^" };

function abcPitch(p: Pitch, accidental: string): string {
  const letter = LETTERS[p.letter];
  const body =
    p.octave >= 5
      ? letter.toLowerCase() + "'".repeat(p.octave - 5)
      : letter + ",".repeat(Math.max(0, 4 - p.octave));
  return accidental + body;
}

/** ABC length relative to L:1/8 (one eighth = 1). */
function abcLength(beats: number): string {
  const eighths = beats * 2;
  if (Math.abs(eighths - 1) < EPS) return "";
  if (Number.isInteger(+eighths.toFixed(6))) return String(Math.round(eighths));
  const half = eighths * 2; // sixteenths
  if (Number.isInteger(+half.toFixed(6))) return `${Math.round(half)}/2`;
  return `${Math.round(eighths * 4)}/4`;
}

/**
 * Builds an ABC tune (one staff, treble clef) for the lick and its chords,
 * starting a new line every `barsPerLine` bars.
 */
export function toAbc(
  lick: ParsedLick,
  key: LickKey,
  chords: TimedChord[],
  barsPerLine = Infinity,
): string {
  const sig = signature(key);
  const groups = new Map(tripletGroups(lick.notes).map((g) => [g.first, g.count]));
  const chordStarts = [...chords];
  let out = "";
  let barState = new Map<string, number>();
  let currentBar = 0;
  let tiedIn = false;

  lick.notes.forEach((n, i) => {
    if (n.bar !== currentBar) {
      out += n.bar % barsPerLine === 0 ? " |\n" : " | ";
      currentBar = n.bar;
      barState = new Map();
    } else if (i > 0) {
      // Beam eighths in half-bar groups and shorter notes by the beat.
      const boundary = n.notated < 0.5 && !n.triplet ? 1 : 2;
      const pos = n.start - n.bar * BEATS_PER_BAR;
      if (Math.abs(pos / boundary - Math.round(pos / boundary)) < EPS) out += " ";
    }

    const chord = chordStarts[0];
    if (chord && n.start >= chord.start - EPS) {
      while (chordStarts[0] && n.start >= chordStarts[0].start - EPS) chordStarts.shift();
      // abcjs typesets the root's accidental itself; only the suffix gets ♭/♯.
      const [, root, suffix] = chord.symbol.match(/^([A-G][#b]?)(.*)$/) ?? ["", chord.symbol, ""];
      out += `"${root}${suffix.replace(/b(?=\d)/g, "♭").replace(/#/g, "♯")}"`;
    }

    const triplet = groups.get(i);
    if (triplet) out += `(3:2:${triplet}`;

    const length = abcLength(n.notated);
    if (!n.pitch) {
      out += "z" + length;
    } else {
      const slot = `${n.pitch.letter}:${n.pitch.octave}`;
      const current = barState.get(slot) ?? sig[n.pitch.letter];
      const accidental = n.pitch.acc !== current && !tiedIn ? ABC_ACC[n.pitch.acc] : "";
      barState.set(slot, n.pitch.acc);
      out += abcPitch(n.pitch, accidental) + length + (n.tie ? "-" : "");
    }
    tiedIn = n.tie;
  });

  return [
    "X:1",
    "M:4/4",
    "L:1/8",
    `K:${asciiName(key.tonic)}${key.mode === "minor" ? "m" : ""}`,
    out.trim() + " |]",
  ].join("\n");
}

// --- Rhythm features -------------------------------------------------------

export type RhythmFeature = "eighths" | "triplets" | "sixteenths" | "offbeat-start" | "ties";

/** Rhythmic traits read off the notes, used as search filters. */
export function rhythmFeatures(lick: ParsedLick): RhythmFeature[] {
  const out = new Set<RhythmFeature>();
  for (const n of lick.notes) {
    if (n.triplet) out.add("triplets");
    else if (Math.abs(n.notated - 0.5) < EPS) out.add("eighths");
    else if (n.notated < 0.5 - EPS) out.add("sixteenths");
    if (n.tie) out.add("ties");
  }
  const first = lick.notes.find((n) => n.pitch);
  if (first && Math.abs(first.start - Math.round(first.start)) > EPS) out.add("offbeat-start");
  return [...out];
}
