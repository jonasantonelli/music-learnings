/**
 * Synthesised instruments for lick playback — no samples to download.
 *
 * Strings use Karplus–Strong: a short burst of filtered noise circulates in a
 * delay line tuned to the note, losing a little high end on every pass,
 * which is how a plucked string decays. The electric piano is two-operator
 * FM (a sine modulated at the same frequency, with a decaying index), the
 * classic recipe for a Rhodes-like tine.
 */

export type LeadSound = "nylon" | "jazz-guitar" | "electric-piano";
export type CompSound = "piano" | "guitar";

export const LEAD_SOUNDS: readonly LeadSound[] = ["nylon", "jazz-guitar", "electric-piano"];
export const COMP_SOUNDS: readonly CompSound[] = ["piano", "guitar"];

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

type StringModel = {
  /** Seconds of sound rendered per note (later notes are cut by the envelope). */
  length: number;
  /** Seconds to fade by 60 dB at 130 Hz; higher notes ring a little shorter. */
  sustain: number;
  /** 0–1: how much high end the pluck starts with. */
  brightness: number;
  /** Where along the string it is plucked (0–0.5); fills in a comb notch. */
  pick: number;
  /** Tone shaping after the string: lowpass cutoff and a body resonance. */
  lowpass: number;
  body: { freq: number; gain: number; q: number };
};

const STRINGS: Record<"nylon" | "jazz-guitar" | "bass", StringModel> = {
  nylon: {
    length: 2.6,
    sustain: 6,
    brightness: 0.55,
    pick: 0.18,
    lowpass: 4200,
    body: { freq: 210, gain: 5, q: 1.1 },
  },
  "jazz-guitar": {
    length: 3,
    sustain: 8,
    brightness: 0.32,
    pick: 0.3,
    lowpass: 2000,
    body: { freq: 160, gain: 4, q: 0.9 },
  },
  bass: {
    length: 2.2,
    sustain: 5,
    brightness: 0.22,
    pick: 0.25,
    lowpass: 900,
    body: { freq: 90, gain: 6, q: 0.8 },
  },
};

const bufferCache = new WeakMap<BaseAudioContext, Map<string, AudioBuffer>>();

/** Renders one plucked string note into a buffer (cached per context). */
export function stringBuffer(ctx: BaseAudioContext, model: keyof typeof STRINGS, midi: number): AudioBuffer {
  let cache = bufferCache.get(ctx);
  if (!cache) bufferCache.set(ctx, (cache = new Map()));
  const id = `${model}:${midi}`;
  const hit = cache.get(id);
  if (hit) return hit;

  const m = STRINGS[model];
  const sr = ctx.sampleRate;
  const total = Math.floor(sr * m.length);
  const buffer = ctx.createBuffer(1, total, sr);
  const out = buffer.getChannelData(0);

  // The loop's averaging filter adds half a sample of delay; the rest is
  // split into whole samples plus an allpass for the fraction, so high notes
  // stay in tune.
  const period = sr / hz(midi) - 0.5;
  const n = Math.max(2, Math.floor(period));
  const frac = period - n;
  const c = (1 - frac) / (1 + frac);
  // Loss per trip round the loop for the note's 60 dB decay time. A fixed
  // loss would kill high notes far too fast, since they loop more often.
  const f = hz(midi);
  const t60 = m.sustain * (130 / f) ** 0.4;
  const decay = 10 ** (-3 / (t60 * f));

  // Excitation: lowpassed noise, then a comb for the pick position.
  const noise = new Float32Array(n);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    lp += m.brightness * (Math.random() * 2 - 1 - lp);
    noise[i] = lp;
  }
  const offset = Math.max(1, Math.round(m.pick * n));
  const line = new Float32Array(n);
  let mean = 0;
  for (let i = 0; i < n; i++) {
    line[i] = noise[i] - noise[(i - offset + n) % n];
    mean += line[i] / n;
  }
  let peak = 0;
  for (let i = 0; i < n; i++) {
    line[i] -= mean;
    peak = Math.max(peak, Math.abs(line[i]));
  }
  for (let i = 0; i < n; i++) line[i] /= peak || 1;

  let idx = 0;
  let prev = 0;
  let apIn = 0;
  let apOut = 0;
  for (let i = 0; i < total; i++) {
    const x = line[idx];
    out[i] = x;
    const avg = decay * 0.5 * (x + prev);
    prev = x;
    const ap = c * avg + apIn - c * apOut;
    apIn = avg;
    apOut = ap;
    line[idx] = ap;
    idx = idx + 1 === n ? 0 : idx + 1;
  }
  cache.set(id, buffer);
  return buffer;
}

/** Plays a plucked string note, damped (like lifting the finger) after `seconds`. */
function playString(
  ctx: BaseAudioContext,
  dest: AudioNode,
  model: keyof typeof STRINGS,
  time: number,
  midi: number,
  seconds: number,
  velocity: number,
) {
  const m = STRINGS[model];
  const src = ctx.createBufferSource();
  src.buffer = stringBuffer(ctx, model, midi);
  const body = ctx.createBiquadFilter();
  body.type = "peaking";
  body.frequency.value = m.body.freq;
  body.gain.value = m.body.gain;
  body.Q.value = m.body.q;
  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = m.lowpass;
  tone.Q.value = 0.5;
  const env = ctx.createGain();
  const hold = Math.min(seconds, m.length - 0.1);
  env.gain.setValueAtTime(velocity, time);
  env.gain.setValueAtTime(velocity, time + hold);
  env.gain.setTargetAtTime(0, time + hold, 0.035);
  src.connect(body).connect(tone).connect(env).connect(dest);
  src.start(time);
  src.stop(time + hold + 0.3);
}

/** Rhodes-style electric piano: FM tine plus a short bell partial. */
function playElectricPiano(
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

/** A lead note in the chosen sound. */
export function playLead(
  ctx: BaseAudioContext,
  dest: AudioNode,
  sound: LeadSound,
  time: number,
  midi: number,
  seconds: number,
) {
  if (sound === "electric-piano") playElectricPiano(ctx, dest, time, midi, seconds, 0.32);
  else playString(ctx, dest, sound, time, midi, seconds, sound === "nylon" ? 0.55 : 0.6);
}

/** A chord voicing hit; guitar strums low to high a few ms apart. */
export function playChord(
  ctx: BaseAudioContext,
  dest: AudioNode,
  sound: CompSound,
  time: number,
  midis: number[],
  seconds: number,
) {
  midis.forEach((midi, i) => {
    if (sound === "piano") playElectricPiano(ctx, dest, time + i * 0.004, midi, seconds, 0.11);
    else playString(ctx, dest, "jazz-guitar", time + i * 0.012, midi, seconds, 0.2);
  });
}

/** Upright-bass-like root under the chords. */
export function playBass(ctx: BaseAudioContext, dest: AudioNode, time: number, midi: number, seconds: number) {
  playString(ctx, dest, "bass", time, midi, seconds, 0.55);
}

/**
 * Master chain: a little room reverb and gentle compression so the lead,
 * comping and bass sit together. Returns the node instruments play into.
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
