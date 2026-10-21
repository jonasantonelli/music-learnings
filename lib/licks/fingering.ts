import { STRING_MIDI } from "@/lib/music";

/** A spot on the neck: string 1 = high e … 6 = low E, fret ≥ 1. */
export type FretSpot = { string: number; fret: number };

export type Fingering = {
  /** Fret under the index finger. */
  position: number;
  /** One spot per note; null for rests. */
  spots: (FretSpot | null)[];
  cost: number;
};

// Open-string pitches (sounding), string 1 (high e) first.
const OPEN = [...STRING_MIDI].reverse();
const MAX_FRET = 20;

/** Every place a written pitch can be played (guitar sounds an octave lower). */
function candidates(writtenMidi: number): FretSpot[] {
  const sounding = writtenMidi - 12;
  return OPEN.flatMap((open, i) => {
    const fret = sounding - open;
    return fret >= 1 && fret <= MAX_FRET ? [{ string: i + 1, fret }] : [];
  });
}

/**
 * Best fingering with the hand anchored at `position`: notes may reach one
 * fret below the index finger or one above the pinky, at a cost. Returns null
 * if some note can't be reached from there.
 */
function fingerAt(midis: (number | null)[], position: number): Fingering | null {
  const lo = position - 1;
  const hi = position + 4;
  // Dynamic programming over notes: best[cand] = cheapest path ending there.
  let prev: { spot: FretSpot; cost: number; path: FretSpot[] }[] = [];
  let first = true;
  for (const midi of midis) {
    if (midi === null) continue;
    const options = candidates(midi).filter((c) => c.fret >= lo && c.fret <= hi);
    if (options.length === 0) return null;
    const stretch = (c: FretSpot) => (c.fret < position || c.fret > position + 3 ? 1.5 : 0);
    if (first) {
      prev = options.map((spot) => ({ spot, cost: stretch(spot), path: [spot] }));
      first = false;
      continue;
    }
    prev = options.map((spot) => {
      let best = prev[0];
      let bestCost = Infinity;
      for (const p of prev) {
        const move =
          Math.abs(p.spot.string - spot.string) * 0.4 +
          Math.abs(p.spot.fret - spot.fret) * 0.15 +
          // Same string, different fret in a row is fine; repeated spot is free.
          (p.spot.string === spot.string && p.spot.fret === spot.fret ? -0.1 : 0);
        const c = p.cost + move;
        if (c < bestCost) {
          bestCost = c;
          best = p;
        }
      }
      return { spot, cost: bestCost + stretch(spot), path: [...best.path, spot] };
    });
  }
  if (prev.length === 0) return null;
  const best = prev.reduce((a, b) => (b.cost < a.cost ? b : a));
  let k = 0;
  return {
    position,
    // Lower positions are slightly preferred, as players usually learn them first.
    cost: best.cost + position * 0.02,
    spots: midis.map((m) => (m === null ? null : best.path[k++])),
  };
}

/**
 * Playable positions for a line of written pitches, best first, keeping only
 * positions at least three frets apart so each option is a different region.
 */
export function lickFingerings(midis: (number | null)[], max = 4): Fingering[] {
  const all: Fingering[] = [];
  for (let position = 1; position <= 15; position++) {
    const f = fingerAt(midis, position);
    if (f) all.push(f);
  }
  const chosen: Fingering[] = [];
  for (const f of [...all].sort((a, b) => a.cost - b.cost)) {
    if (chosen.every((c) => Math.abs(c.position - f.position) >= 3)) chosen.push(f);
    if (chosen.length === max) break;
  }
  if (chosen.length > 0) return chosen.sort((a, b) => a.position - b.position);
  return [freeFingering(midis)];
}

/** Fallback for lines wider than one position: shift as little as possible. */
function freeFingering(midis: (number | null)[]): Fingering {
  let prev: { spot: FretSpot; cost: number; path: FretSpot[] }[] = [];
  for (const midi of midis) {
    if (midi === null) continue;
    const options = candidates(midi);
    prev =
      prev.length === 0
        ? options.map((spot) => ({ spot, cost: spot.fret * 0.05, path: [spot] }))
        : options.map((spot) => {
            const best = prev.reduce((a, b) => {
              const ca = a.cost + Math.abs(a.spot.fret - spot.fret) + Math.abs(a.spot.string - spot.string) * 0.4;
              const cb = b.cost + Math.abs(b.spot.fret - spot.fret) + Math.abs(b.spot.string - spot.string) * 0.4;
              return cb < ca ? b : a;
            });
            const cost = best.cost + Math.abs(best.spot.fret - spot.fret) + Math.abs(best.spot.string - spot.string) * 0.4;
            return { spot, cost, path: [...best.path, spot] };
          });
  }
  const best = prev.reduce((a, b) => (b.cost < a.cost ? b : a));
  let k = 0;
  const spots = midis.map((m) => (m === null ? null : best.path[k++]));
  return {
    position: Math.min(...best.path.map((s) => s.fret)),
    spots,
    cost: best.cost,
  };
}
