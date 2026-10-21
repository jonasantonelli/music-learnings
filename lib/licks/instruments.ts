/**
 * The playback instrument: a sampled acoustic grand piano, played with
 * smplr. The samples are the Splendid Grand Piano set — public-domain Akai
 * recordings packaged at github.com/sfzinstruments/SplendidGrandPiano — and
 * are fetched on first use. Lick, comping and bass all play it.
 */

import type { SplendidGrandPiano } from "smplr";

export type Piano = Pick<SplendidGrandPiano, "start" | "stop">;

/** MIDI velocities: the lick leads, the comping stays underneath. */
export const VELOCITY = { lead: 80, chord: 52, bass: 72 } as const;

// Only what licks use: sounding range of lick, comping and bass, and the two
// velocity layers ("p" 41–67, "mf" 68–84) the parts above fall in.
const NOTES = Array.from({ length: 53 }, (_, i) => 36 + i);
const VELOCITY_RANGE: [number, number] = [41, 84];

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
export function playNote(piano: Piano, time: number, midi: number, seconds: number, velocity: number) {
  piano.start({ note: midi, time, duration: seconds, velocity });
}

/** A chord voicing, rolled a few ms low to high like a pianist's hand. */
export function playChord(piano: Piano, time: number, midis: number[], seconds: number) {
  midis.forEach((midi, i) => playNote(piano, time + i * 0.006, midi, seconds, VELOCITY.chord));
}

/** The root under the chords, in the left hand. */
export function playBass(piano: Piano, time: number, midi: number, seconds: number) {
  playNote(piano, time, midi, seconds, VELOCITY.bass);
}

/**
 * Master chain: a little room reverb and gentle compression so the lick,
 * comping and bass sit together. Returns the node instruments play into.
 */
export function createMixBus(ctx: AudioContext): GainNode {
  const input = ctx.createGain();

  // Warmer, less bright piano: a little more body, softer top end, and a
  // gentle roll-off that rounds the hammer attack.
  const body = ctx.createBiquadFilter();
  body.type = "peaking";
  body.frequency.value = 250;
  body.Q.value = 0.8;
  body.gain.value = 1.5;
  const shelf = ctx.createBiquadFilter();
  shelf.type = "highshelf";
  shelf.frequency.value = 2500;
  shelf.gain.value = -4;
  const rolloff = ctx.createBiquadFilter();
  rolloff.type = "lowpass";
  rolloff.frequency.value = 4500;
  rolloff.Q.value = 0.5;
  input.connect(body).connect(shelf).connect(rolloff);
  const tone = rolloff;

  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 3;
  comp.attack.value = 0.01;
  comp.release.value = 0.2;

  const reverb = ctx.createConvolver();
  reverb.buffer = roomImpulse(ctx, 1.6);
  const wet = ctx.createGain();
  wet.gain.value = 0.18;

  tone.connect(comp);
  tone.connect(reverb).connect(wet).connect(comp);
  comp.connect(ctx.destination);
  return input;
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
