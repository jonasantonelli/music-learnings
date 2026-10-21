/**
 * The playback instrument: a Rhodes-style electric piano, synthesised with
 * two-operator FM (a sine modulated at its own frequency, with a decaying
 * index) plus a short bell partial for the tine. Lick, comping and bass all
 * use it, at different strengths. No samples to download.
 */

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/** One electric-piano note; `velocity` (0–1) sets both level and brightness. */
export function playNote(
  ctx: BaseAudioContext,
  dest: AudioNode,
  time: number,
  midi: number,
  seconds: number,
  velocity: number,
) {
  const f = hz(midi);
  const carrier = ctx.createOscillator();
  carrier.frequency.value = f;
  const mod = ctx.createOscillator();
  mod.frequency.value = f;
  const index = ctx.createGain();
  // Harder notes are brighter: a larger starting index.
  index.gain.setValueAtTime(f * (0.9 + velocity * 2.2), time);
  index.gain.setTargetAtTime(f * 0.15, time, 0.25);
  mod.connect(index).connect(carrier.frequency);

  const bell = ctx.createOscillator();
  bell.frequency.value = f * 7;
  const bellEnv = ctx.createGain();
  bellEnv.gain.setValueAtTime(velocity * 0.05, time);
  bellEnv.gain.setTargetAtTime(0, time, 0.03);

  const env = ctx.createGain();
  // Low notes ring longer, as on the real instrument.
  const ring = 1.6 - Math.min(1, Math.max(0, (midi - 48) / 36));
  const end = time + seconds;
  env.gain.setValueAtTime(0, time);
  env.gain.linearRampToValueAtTime(velocity, time + 0.004);
  env.gain.setTargetAtTime(velocity * 0.35, time + 0.004, ring);
  env.gain.cancelScheduledValues(end);
  env.gain.setTargetAtTime(0, end, 0.06);

  carrier.connect(env);
  bell.connect(bellEnv).connect(env);
  env.connect(dest);
  for (const o of [carrier, mod, bell]) {
    o.start(time);
    o.stop(end + 0.4);
  }
}

/** Lead strength for lick notes. */
export const LEAD_VELOCITY = 0.32;

/** A chord voicing, rolled a few ms low to high like a pianist's hand. */
export function playChord(ctx: BaseAudioContext, dest: AudioNode, time: number, midis: number[], seconds: number) {
  midis.forEach((midi, i) => playNote(ctx, dest, time + i * 0.004, midi, seconds, 0.11));
}

/** The root under the chords, in the left hand. */
export function playBass(ctx: BaseAudioContext, dest: AudioNode, time: number, midi: number, seconds: number) {
  playNote(ctx, dest, time, midi, seconds, 0.28);
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
  reverb.buffer = roomImpulse(ctx, 1.4);
  const wet = ctx.createGain();
  wet.gain.value = 0.18;

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
