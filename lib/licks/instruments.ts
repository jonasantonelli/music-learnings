/**
 * The playback instrument: a sampled acoustic grand piano, played with
 * smplr and voiced dark and round, toward a Rhodes: soft-layer samples, a
 * mellow EQ, a slow stereo tremolo and some room. The samples are the
 * Splendid Grand Piano set — public-domain Akai recordings packaged at
 * github.com/sfzinstruments/SplendidGrandPiano — fetched on first use.
 * Lick, comping and bass all play it.
 */

import type { SplendidGrandPiano } from "smplr";

export type Piano = Pick<SplendidGrandPiano, "start" | "stop">;

/** Stops what a play call started (no-op once it has ended). */
export type Stop = (time?: number) => void;

/**
 * MIDI velocities: the lick leads, the comping stays underneath. All sit in
 * the soft "p" layer (41–67), whose recordings are darker than the harder
 * ones; the mix makes up the level.
 */
export const VELOCITY = { lead: 66, chord: 48, bass: 60 } as const;

// Only what licks use: the sounding range of lick, comping and bass, in the
// one velocity layer above.
const NOTES = Array.from({ length: 53 }, (_, i) => 36 + i);
const VELOCITY_RANGE: [number, number] = [41, 67];

const pianos = new WeakMap<BaseAudioContext, Promise<Piano>>();

/** Loads the piano once per audio context; rejects if the samples can't be fetched. */
export function loadPiano(ctx: AudioContext, destination: AudioNode): Promise<Piano> {
  let piano = pianos.get(ctx);
  if (!piano) {
    piano = import("smplr").then(
      ({ SplendidGrandPiano }) =>
        SplendidGrandPiano(ctx, {
          destination,
          decayTime: 0.35,
          notesToLoad: { notes: NOTES, velocityRange: VELOCITY_RANGE },
        }).load,
    );
    // Allow a retry after a failed download.
    piano.catch(() => pianos.delete(ctx));
    pianos.set(ctx, piano);
  }
  return piano;
}

/** One note; the damper falls after `seconds`. */
export function playNote(piano: Piano, time: number, midi: number, seconds: number, velocity: number): Stop {
  return piano.start({ note: midi, time, duration: seconds, velocity });
}

/** A chord voicing, rolled a few ms low to high like a pianist's hand. */
export function playChord(piano: Piano, time: number, midis: number[], seconds: number): Stop {
  const stops = midis.map((midi, i) => playNote(piano, time + i * 0.006, midi, seconds, VELOCITY.chord));
  return (at) => stops.forEach((stop) => stop(at));
}

/** The root under the chords, in the left hand. */
export function playBass(piano: Piano, time: number, midi: number, seconds: number): Stop {
  return playNote(piano, time, midi, seconds, VELOCITY.bass);
}

/** The mix: `input` is where notes play into, `master` the final level. */
export type MixBus = { input: GainNode; master: GainNode };

/**
 * Master chain: a little room reverb and gentle compression so the lick,
 * comping and bass sit together, then a master gain that Stop can pull to
 * silence at once (reverb tail included).
 */
export function createMixBus(ctx: AudioContext): MixBus {
  const input = ctx.createGain();
  // The soft layer plays quieter; bring it back up.
  input.gain.value = 1.6;

  // Rhodes-like voicing: round low-mid body, little top end, and a roll-off
  // that takes the edge off the hammer.
  const body = ctx.createBiquadFilter();
  body.type = "peaking";
  body.frequency.value = 300;
  body.Q.value = 0.8;
  body.gain.value = 2;
  const shelf = ctx.createBiquadFilter();
  shelf.type = "highshelf";
  shelf.frequency.value = 1800;
  shelf.gain.value = -6;
  const rolloff = ctx.createBiquadFilter();
  rolloff.type = "lowpass";
  rolloff.frequency.value = 2600;
  rolloff.Q.value = 0.6;

  // The suitcase Rhodes sway: a slow, shallow left-right tremolo.
  const pan = ctx.createStereoPanner();
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 4.5;
  const depth = ctx.createGain();
  depth.gain.value = 0.22;
  lfo.connect(depth).connect(pan.pan);
  lfo.start();

  input.connect(body).connect(shelf).connect(rolloff).connect(pan);
  const tone = pan;

  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 3;
  comp.attack.value = 0.01;
  comp.release.value = 0.2;

  const reverb = ctx.createConvolver();
  reverb.buffer = roomImpulse(ctx, 2.2);
  const wet = ctx.createGain();
  wet.gain.value = 0.3;

  tone.connect(comp);
  tone.connect(reverb).connect(wet).connect(comp);
  const master = ctx.createGain();
  comp.connect(master).connect(ctx.destination);
  return { input, master };
}

/** Synthetic room response: decaying stereo noise, darker as it fades. */
function roomImpulse(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < length; i++) {
      const t = i / length;
      lp += (0.6 - 0.5 * t) * (Math.random() * 2 - 1 - lp);
      data[i] = lp * (1 - t) ** 3;
    }
  }
  return buffer;
}
