"use client";

import { BEATS_PER_BAR } from "./notation";

/** One note to play: sounding MIDI pitch (null = rest), timed in beats. */
export type PlayNote = {
  /** Index of the note in the lick, reported back while it sounds. */
  index: number;
  start: number;
  beats: number;
  midi: number | null;
  /** Continuation of a tied note: highlighted, but not re-attacked. */
  tied: boolean;
};

export type PlayChord = { start: number; beats: number; midis: number[] };

export type PlaySequence = { notes: PlayNote[]; chords: PlayChord[]; beats: number };

export type PlayOptions = {
  bpm: number;
  loop: boolean;
  countIn: boolean;
  metronome: boolean;
  comping: boolean;
  /** Sequence for each pass; lets callers change key between loops. */
  sequence: (pass: number) => PlaySequence;
  /** Current note index (null between notes or during the count-in). */
  onNote: (pass: number, index: number | null) => void;
  onEnd: () => void;
};

const LOOKAHEAD = 0.25; // seconds of audio scheduled ahead of the clock
const TICK_MS = 50;

type Cue = { time: number; end: number; pass: number; index: number };

/**
 * A small Web Audio player for licks. Notes are scheduled a pass at a time
 * slightly ahead of the audio clock, and a frame loop reports which note is
 * sounding so the fretboard and staff can follow along.
 */
export class LickPlayer {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private frame = 0;
  private cues: Cue[] = [];
  private options: PlayOptions | null = null;
  private pass = 0;
  private passStart = 0;
  private lastReported: string | null = null;
  private current: PlaySequence | null = null;

  private context(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private freshOutput(): GainNode {
    const ctx = this.context();
    this.out?.disconnect();
    const gain = ctx.createGain();
    gain.gain.value = 0.8;
    gain.connect(ctx.destination);
    this.out = gain;
    return gain;
  }

  get playing(): boolean {
    return this.options !== null;
  }

  start(options: PlayOptions) {
    this.stop();
    const ctx = this.context();
    this.freshOutput();
    this.options = options;
    this.pass = 0;
    this.cues = [];
    this.lastReported = null;
    const beat = 60 / options.bpm;
    let at = ctx.currentTime + 0.08;
    if (options.countIn) {
      for (let b = 0; b < BEATS_PER_BAR; b++) this.click(at + b * beat, b === 0);
      at += BEATS_PER_BAR * beat;
    }
    this.passStart = at;
    this.schedulePass();
    this.timer = setInterval(() => this.tick(), TICK_MS);
    const follow = () => {
      this.report();
      this.frame = requestAnimationFrame(follow);
    };
    this.frame = requestAnimationFrame(follow);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    cancelAnimationFrame(this.frame);
    this.timer = null;
    if (this.out && this.ctx) {
      // Fade out instead of cutting, so stopping mid-note doesn't click.
      const out = this.out;
      out.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02);
      setTimeout(() => out.disconnect(), 200);
      this.out = null;
    }
    this.options = null;
    this.cues = [];
  }

  /** Plays a single note now (for stepping through a lick). */
  preview(midi: number, seconds = 0.6) {
    const ctx = this.context();
    if (!this.out) this.freshOutput();
    this.pluck(ctx.currentTime + 0.01, midi, seconds);
  }

  dispose() {
    this.stop();
    void this.ctx?.close();
    this.ctx = null;
  }

  private passLength(seq: PlaySequence): number {
    return seq.beats * (60 / this.options!.bpm);
  }

  private schedulePass() {
    const opts = this.options!;
    const seq = opts.sequence(this.pass);
    this.current = seq;
    const beat = 60 / opts.bpm;
    const t0 = this.passStart;
    for (const n of seq.notes) {
      const time = t0 + n.start * beat;
      const end = time + n.beats * beat;
      this.cues.push({ time, end, pass: this.pass, index: n.index });
      if (n.midi !== null && !n.tied) {
        // Extend through any tied continuations.
        let length = n.beats;
        for (let k = seq.notes.indexOf(n) + 1; seq.notes[k]?.tied; k++) length += seq.notes[k].beats;
        this.pluck(time, n.midi, length * beat);
      }
    }
    if (opts.comping) {
      for (const c of seq.chords) this.pad(t0 + c.start * beat, c.beats * beat, c.midis);
    }
    if (opts.metronome) {
      for (let b = 0; b < seq.beats; b++) this.click(t0 + b * beat, b % BEATS_PER_BAR === 0);
    }
  }

  private tick() {
    const opts = this.options;
    const ctx = this.ctx;
    if (!opts || !ctx || !this.current) return;
    const passEnd = this.passStart + this.passLength(this.current);
    if (ctx.currentTime + LOOKAHEAD < passEnd) return;
    if (!opts.loop) {
      if (ctx.currentTime >= passEnd) {
        const onEnd = opts.onEnd;
        const onNote = opts.onNote;
        this.stop();
        onNote(this.pass, null);
        onEnd();
      }
      return;
    }
    this.pass += 1;
    this.passStart = passEnd;
    this.cues = this.cues.filter((c) => c.end > ctx.currentTime);
    this.schedulePass();
  }

  private report() {
    const opts = this.options;
    const ctx = this.ctx;
    if (!opts || !ctx) return;
    const now = ctx.currentTime;
    const cue = this.cues.find((c) => now >= c.time && now < c.end);
    const key = cue ? `${cue.pass}:${cue.index}` : "none";
    if (key === this.lastReported) return;
    this.lastReported = key;
    if (cue) opts.onNote(cue.pass, cue.index);
    else opts.onNote(this.pass, null);
  }

  // --- Sounds --------------------------------------------------------------

  private pluck(time: number, midi: number, seconds: number) {
    const ctx = this.ctx!;
    const out = this.out!;
    const freq = 440 * 2 ** ((midi - 69) / 12);
    const body = ctx.createOscillator();
    body.type = "triangle";
    body.frequency.value = freq;
    const edge = ctx.createOscillator();
    edge.type = "sawtooth";
    edge.frequency.value = freq;
    const edgeGain = ctx.createGain();
    edgeGain.gain.value = 0.18;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 1;
    filter.frequency.setValueAtTime(Math.min(6000, freq * 8), time);
    filter.frequency.exponentialRampToValueAtTime(Math.max(400, freq * 2), time + 0.25);
    const env = ctx.createGain();
    const release = Math.min(0.12, seconds * 0.3);
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(0.32, time + 0.006);
    env.gain.exponentialRampToValueAtTime(0.14, time + 0.18);
    env.gain.setValueAtTime(0.14, Math.max(time + 0.18, time + seconds - release));
    env.gain.exponentialRampToValueAtTime(0.0001, time + seconds + 0.05);
    body.connect(filter);
    edge.connect(edgeGain).connect(filter);
    filter.connect(env).connect(out);
    for (const osc of [body, edge]) {
      osc.start(time);
      osc.stop(time + seconds + 0.1);
    }
  }

  private pad(time: number, seconds: number, midis: number[]) {
    const ctx = this.ctx!;
    const out = this.out!;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(0.05, time + 0.04);
    env.gain.setTargetAtTime(0.03, time + 0.1, 0.4);
    env.gain.setTargetAtTime(0.0001, time + seconds - 0.08, 0.03);
    env.connect(out);
    for (const midi of midis) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 440 * 2 ** ((midi - 69) / 12);
      osc.connect(env);
      osc.start(time);
      osc.stop(time + seconds + 0.2);
    }
  }

  private click(time: number, accent: boolean) {
    const ctx = this.ctx!;
    const out = this.out!;
    const osc = ctx.createOscillator();
    osc.frequency.value = accent ? 1600 : 1100;
    const env = ctx.createGain();
    env.gain.setValueAtTime(accent ? 0.25 : 0.14, time);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
    osc.connect(env).connect(out);
    osc.start(time);
    osc.stop(time + 0.05);
  }
}
