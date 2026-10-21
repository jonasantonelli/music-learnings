/**
 * The playback instrument: an acoustic piano, synthesised additively — no
 * samples to download. Each note is rendered once into a buffer (cached per
 * pitch and dynamic) from the things that make a piano sound like one:
 *
 * - stretched, slightly sharp upper partials (string stiffness)
 * - two strings per note, a hair apart in tune, so the tone beats
 * - a two-stage decay (quick drop, long tail), faster for higher partials
 * - partials shaped by where the hammer strikes, plus a short hammer thump
 *
 * Lick, comping and bass all play it, at different dynamics.
 */

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/** Two dynamics: soft (backing) and medium (lick and bass). */
type Dynamic = "soft" | "medium";

const RENDER_SECONDS = 3;
const cache = new WeakMap<BaseAudioContext, Map<string, AudioBuffer>>();

/** Renders one piano note into a buffer, cached per context. */
export function pianoBuffer(ctx: BaseAudioContext, midi: number, dynamic: Dynamic): AudioBuffer {
  let notes = cache.get(ctx);
  if (!notes) cache.set(ctx, (notes = new Map()));
  const id = `${midi}:${dynamic}`;
  const hit = notes.get(id);
  if (hit) return hit;

  const sr = ctx.sampleRate;
  const length = Math.floor(sr * RENDER_SECONDS);
  const buffer = ctx.createBuffer(1, length, sr);
  const out = buffer.getChannelData(0);

  const f0 = hz(midi);
  const soft = dynamic === "soft";
  // Stiffness grows up the keyboard; partial n sits at n·f·√(1 + B n²).
  const b = Math.min(0.004, 0.00012 * 2 ** ((midi - 48) / 12));
  // Tune so the fundamental itself (not the bare string) is on pitch.
  const f = f0 / Math.sqrt(1 + b);
  // Fundamental decay time (60 dB): long in the bass, short at the top.
  const t60 = Math.min(14, Math.max(1.6, 9 * (130 / f0) ** 0.6));
  // Two strings, a fraction of a cent apart (one string in the low bass).
  const detunes = midi < 40 ? [0] : [-0.7, 0.7];
  const hammer = 1 / 7.5;

  for (let n = 1; n <= 16; n++) {
    const fn = n * f * Math.sqrt(1 + b * n * n);
    if (fn > Math.min(9000, sr * 0.45)) break;
    // Softer playing has fewer, weaker upper partials.
    const tilt = Math.exp(-(n - 1) * (soft ? 0.55 : 0.32));
    const strike = Math.abs(Math.sin(Math.PI * n * hammer));
    const amp = (tilt * strike) / n ** 0.6;
    if (amp < 0.002) continue;
    // Higher partials die sooner; each decays in two stages.
    const tn = t60 / (1 + 0.45 * (n - 1));
    const fast = Math.exp(-6.9 / (sr * tn * 0.18));
    const slow = Math.exp(-6.9 / (sr * tn));
    for (const cents of detunes) {
      const w = (2 * Math.PI * fn * 2 ** (cents / 1200)) / sr;
      // Rotate a phasor instead of calling sin() per sample.
      const cw = Math.cos(w);
      const sw = Math.sin(w);
      let re = 0;
      let im = 1;
      let a1 = (amp * 0.65) / detunes.length;
      let a2 = (amp * 0.35) / detunes.length;
      for (let i = 0; i < length; i++) {
        out[i] += (a1 + a2) * im;
        const r = re * cw - im * sw;
        im = re * sw + im * cw;
        re = r;
        a1 *= fast;
        a2 *= slow;
      }
    }
  }

  // Hammer thump: a few milliseconds of low-passed noise.
  const thump = Math.floor(sr * 0.012);
  let lp = 0;
  for (let i = 0; i < thump; i++) {
    lp += 0.25 * (Math.random() * 2 - 1 - lp);
    out[i] += lp * (soft ? 0.08 : 0.16) * (1 - i / thump);
  }

  // A 2 ms onset (no click), then normalise.
  const ramp = Math.floor(sr * 0.002);
  let peak = 0;
  for (let i = 0; i < length; i++) {
    if (i < ramp) out[i] *= i / ramp;
    peak = Math.max(peak, Math.abs(out[i]));
  }
  for (let i = 0; i < length; i++) out[i] /= peak || 1;

  notes.set(id, buffer);
  return buffer;
}

const dynamicOf = (velocity: number): Dynamic => (velocity < 0.25 ? "soft" : "medium");

/** How hard each part plays: the lick leads, the comping stays underneath. */
export const VELOCITY = { lead: 0.5, chord: 0.16, bass: 0.4 } as const;

/**
 * Renders notes ahead of time, so the first beat of a pass isn't late while
 * its buffers are being built.
 */
export function prepare(ctx: BaseAudioContext, midis: number[], velocity: number) {
  for (const midi of midis) pianoBuffer(ctx, midi, dynamicOf(velocity));
}

/**
 * One piano note; `velocity` (0–1) sets the level, and anything below 0.25
 * uses the softer, darker rendering. After `seconds` the damper falls.
 */
export function playNote(
  ctx: BaseAudioContext,
  dest: AudioNode,
  time: number,
  midi: number,
  seconds: number,
  velocity: number,
) {
  const src = ctx.createBufferSource();
  src.buffer = pianoBuffer(ctx, midi, dynamicOf(velocity));
  const env = ctx.createGain();
  const hold = Math.min(seconds, RENDER_SECONDS - 0.2);
  env.gain.setValueAtTime(velocity, time);
  env.gain.setValueAtTime(velocity, time + hold);
  env.gain.setTargetAtTime(0, time + hold, 0.05);
  src.connect(env).connect(dest);
  src.start(time);
  src.stop(time + hold + 0.4);
}

/** A chord voicing, rolled a few ms low to high like a pianist's hand. */
export function playChord(ctx: BaseAudioContext, dest: AudioNode, time: number, midis: number[], seconds: number) {
  midis.forEach((midi, i) => playNote(ctx, dest, time + i * 0.006, midi, seconds, VELOCITY.chord));
}

/** The root under the chords, in the left hand. */
export function playBass(ctx: BaseAudioContext, dest: AudioNode, time: number, midi: number, seconds: number) {
  playNote(ctx, dest, time, midi, seconds, VELOCITY.bass);
}

/**
 * Master chain: a little room reverb and gentle compression so the lick,
 * comping and bass sit together. Returns the node notes play into.
 */
export function createMixBus(ctx: AudioContext): GainNode {
  const input = ctx.createGain();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 3;
  comp.attack.value = 0.01;
  comp.release.value = 0.2;

  const reverb = ctx.createConvolver();
  reverb.buffer = roomImpulse(ctx, 1.6);
  const wet = ctx.createGain();
  wet.gain.value = 0.22;

  input.connect(comp);
  input.connect(reverb).connect(wet).connect(comp);
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
