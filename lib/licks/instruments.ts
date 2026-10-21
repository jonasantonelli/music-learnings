/**
 * The playback instrument: a sampled Fender Rhodes — jRhodes3d, a 1977
 * Rhodes Mark I Stage 73 recorded by Jeff Learman
 * (github.com/sfzinstruments/jlearman.jRhodes3d). The samples are licensed
 * CC BY-NC 4.0: credit the author, non-commercial use only. They are fetched
 * on first play from jsDelivr, pinned to a commit, and only the notes and
 * velocity layers licks need are loaded. Lick, comping and bass all play it.
 */

/** Stops what a play call started (no-op once it has ended). */
export type Stop = (time?: number) => void;

/** A note to play: sounding MIDI pitch, start time, length, MIDI velocity. */
export type NoteEvent = { note: number; time: number; duration: number; velocity: number };

export type Instrument = {
  start: (event: NoteEvent) => Stop;
  /** Silences everything sounding now. */
  stop: () => void;
};

export const SAMPLES_CREDIT = {
  name: "jRhodes3d",
  author: "Jeff Learman",
  license: "CC BY-NC 4.0",
  url: "https://github.com/sfzinstruments/jlearman.jRhodes3d",
};

const BASE =
  "https://cdn.jsdelivr.net/gh/sfzinstruments/jlearman.jRhodes3d@aea5b8d3e11e2f7102593789a4e0a0e41b30271a/jRhodes3d-mono/";

/**
 * The jRhodes3d regions that cover the licks' range (sounding E2–B5), as in
 * its SFZ: sample key, the keys it plays, and its release time.
 */
const REGIONS = [
  { name: "A_040__E2", key: 40, lo: 38, hi: 42, release: 0.5 },
  { name: "A_045__A2", key: 45, lo: 43, hi: 47, release: 0.4 },
  { name: "A_050__D3", key: 50, lo: 48, hi: 52, release: 0.4 },
  { name: "A_055__G3", key: 55, lo: 53, hi: 57, release: 0.4 },
  { name: "A_059__B3", key: 59, lo: 58, hi: 60, release: 0.4 },
  { name: "A_062__D4", key: 62, lo: 61, hi: 63, release: 0.3 },
  { name: "A_065__F4", key: 65, lo: 64, hi: 68, release: 0.3 },
  { name: "A_071__B4", key: 71, lo: 69, hi: 73, release: 0.3 },
  { name: "A_076__E5", key: 76, lo: 74, hi: 78, release: 0.3 },
  { name: "A_081__A5", key: 81, lo: 79, hi: 83, release: 0.3 },
] as const;

/**
 * Velocity layers, numbered as in jRhodes3d (higher number = softer): "_4"
 * plays velocities 48–72 and "_3" 73–95, except that B4 and up reuse "_4".
 */
type Layer = "soft" | "medium";
const layerFile = (region: (typeof REGIONS)[number], layer: Layer) =>
  `${region.name}_${layer === "soft" || region.key >= 71 ? 4 : 3}.flac`;
const layerFor = (velocity: number): Layer => (velocity <= 72 ? "soft" : "medium");

/** MIDI velocities: the lick leads, the comping stays underneath. */
export const VELOCITY = { lead: 84, chord: 56, bass: 66 } as const;

const instruments = new WeakMap<BaseAudioContext, Promise<Instrument>>();

/** Loads the Rhodes once per audio context; rejects if the samples can't be fetched. */
export function loadInstrument(ctx: AudioContext, destination: AudioNode): Promise<Instrument> {
  let instrument = instruments.get(ctx);
  if (!instrument) {
    instrument = loadRhodes(ctx, destination);
    // Allow a retry after a failed download.
    instrument.catch(() => instruments.delete(ctx));
    instruments.set(ctx, instrument);
  }
  return instrument;
}

async function loadRhodes(ctx: AudioContext, destination: AudioNode): Promise<Instrument> {
  const files = [...new Set(REGIONS.flatMap((r) => [layerFile(r, "soft"), layerFile(r, "medium")]))];
  const buffers = new Map<string, AudioBuffer>();
  await Promise.all(
    files.map(async (file) => {
      const response = await fetch(BASE + file);
      if (!response.ok) throw new Error(`Rhodes sample ${file}: HTTP ${response.status}`);
      buffers.set(file, await ctx.decodeAudioData(await response.arrayBuffer()));
    }),
  );

  const voices = new Set<Stop>();

  const start = ({ note, time, duration, velocity }: NoteEvent): Stop => {
    const region =
      REGIONS.find((r) => note >= r.lo && note <= r.hi) ??
      (note < REGIONS[0].lo ? REGIONS[0] : REGIONS[REGIONS.length - 1]);
    const src = ctx.createBufferSource();
    src.buffer = buffers.get(layerFile(region, layerFor(velocity)))!;
    src.playbackRate.value = 2 ** ((note - region.key) / 12);
    const env = ctx.createGain();
    const level = (velocity / 127) ** 1.6;
    const end = time + duration;
    env.gain.setValueAtTime(level, time);
    // The damper: fade over the region's release once the key is let go.
    env.gain.setTargetAtTime(0, end, region.release / 4);
    src.connect(env).connect(destination);
    src.start(time);
    src.stop(end + region.release * 1.5);

    const stop: Stop = (at) => {
      const t = Math.max(at ?? ctx.currentTime, ctx.currentTime);
      voices.delete(stop);
      if (t <= time) {
        // Not started yet: cancel it outright.
        src.stop(t);
        return;
      }
      env.gain.cancelScheduledValues(t);
      env.gain.setTargetAtTime(0, t, 0.02);
      src.stop(t + 0.15);
    };
    voices.add(stop);
    src.onended = () => {
      voices.delete(stop);
      env.disconnect();
    };
    return stop;
  };

  return {
    start,
    stop: () => [...voices].forEach((stop) => stop()),
  };
}

/** One note; the damper falls after `seconds`. */
export function playNote(
  instrument: Instrument,
  time: number,
  midi: number,
  seconds: number,
  velocity: number,
): Stop {
  return instrument.start({ note: midi, time, duration: seconds, velocity });
}

/** A chord voicing, rolled a few ms low to high like a player's hand. */
export function playChord(instrument: Instrument, time: number, midis: number[], seconds: number): Stop {
  const stops = midis.map((midi, i) => playNote(instrument, time + i * 0.006, midi, seconds, VELOCITY.chord));
  return (at) => stops.forEach((stop) => stop(at));
}

/** The root under the chords, in the left hand. */
export function playBass(instrument: Instrument, time: number, midi: number, seconds: number): Stop {
  return playNote(instrument, time, midi, seconds, VELOCITY.bass);
}

/**
 * The mix: `input` is where the Rhodes plays into (tone, tremolo, reverb),
 * `dry` goes straight to the output (the metronome), and `master` is the
 * final level that Stop pulls to silence.
 */
export type MixBus = { input: GainNode; dry: GainNode; master: GainNode };

export function createMixBus(ctx: AudioContext): MixBus {
  const input = ctx.createGain();
  // The Rhodes samples are hot: about -10 dB keeps peaks well clear of clipping.
  input.gain.value = 0.45;

  // The samples are already round; just a touch of body and a softer top.
  const body = ctx.createBiquadFilter();
  body.type = "peaking";
  body.frequency.value = 250;
  body.Q.value = 0.8;
  body.gain.value = 1;
  const shelf = ctx.createBiquadFilter();
  shelf.type = "highshelf";
  shelf.frequency.value = 4000;
  shelf.gain.value = -2;

  // The suitcase Rhodes sway: a slow, shallow left-right tremolo.
  const pan = ctx.createStereoPanner();
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 4.5;
  const depth = ctx.createGain();
  depth.gain.value = 0.18;
  lfo.connect(depth).connect(pan.pan);
  lfo.start();

  input.connect(body).connect(shelf).connect(pan);

  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 3;
  comp.attack.value = 0.01;
  comp.release.value = 0.2;

  const reverb = ctx.createConvolver();
  reverb.buffer = roomImpulse(ctx, 2.2);
  const wet = ctx.createGain();
  wet.gain.value = 0.3;

  pan.connect(comp);
  pan.connect(reverb).connect(wet).connect(comp);

  const master = ctx.createGain();
  comp.connect(master).connect(ctx.destination);

  // Dry path (metronome): no tone, tremolo or reverb.
  const dry = ctx.createGain();
  dry.connect(master);
  return { input, dry, master };
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
