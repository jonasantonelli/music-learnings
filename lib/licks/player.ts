"use client";

import { BEATS_PER_BAR } from "./notation";
import {
  VELOCITY,
  createMixBus,
  loadPiano,
  playBass,
  playChord,
  playNote,
  type Piano,
} from "./instruments";

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

/** A chord span: the voicing to comp with and the bass root (sounding MIDI). */
export type PlayChord = { start: number; beats: number; voicing: number[]; bass: number | null };

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
  private bus: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private frame = 0;
  private cues: Cue[] = [];
  private options: PlayOptions | null = null;
  private pass = 0;
  private passStart = 0;
  private lastReported: string | null = null;
  private current: PlaySequence | null = null;
  private piano: Piano | null = null;

  private context(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private freshOutput(): GainNode {
    const ctx = this.context();
    this.out?.disconnect();
    this.bus ??= createMixBus(ctx);
    const gain = ctx.createGain();
    gain.gain.value = 0.9;
    gain.connect(this.bus);
    this.out = gain;
    return gain;
  }

  get playing(): boolean {
    return this.options !== null;
  }

  /** True once the piano samples are loaded. */
  get ready(): boolean {
    return this.piano !== null;
  }

  /** Loads the piano (fetching samples the first time). */
  async load(): Promise<void> {
    const ctx = this.context();
    this.bus ??= createMixBus(ctx);
    this.piano ??= await loadPiano(ctx, this.bus);
  }

  /** Starts playback; call `load()` first. */
  start(options: PlayOptions) {
    if (!this.piano) throw new Error("LickPlayer.start() before load()");
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
    // Lift the dampers on anything still ringing (scheduled notes too).
    this.piano?.stop();
    this.options = null;
    this.cues = [];
  }

  /** Plays a single note now (for stepping through a lick). */
  preview(midi: number, seconds = 0.8) {
    void this.load()
      .then(() => playNote(this.piano!, this.ctx!.currentTime + 0.01, midi, seconds, VELOCITY.lead))
      .catch(() => {
        // No samples (e.g. offline): stepping still works, silently.
      });
  }

  dispose() {
    this.stop();
    void this.ctx?.close();
    this.ctx = null;
    this.bus = null;
    this.piano = null;
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
        playNote(this.piano!, time, n.midi, length * beat, VELOCITY.lead);
      }
    }
    if (opts.comping) {
      for (const c of seq.chords) this.comp(t0, beat, c);
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

  /**
   * Comps one chord span: the Charleston (beat 1 and the "and" of 2) in a
   * bar-long span, one hit in a shorter one, with the root on 1 in the bass.
   */
  private comp(t0: number, beat: number, chord: PlayChord) {
    const piano = this.piano!;
    const at = (b: number) => t0 + (chord.start + b) * beat;
    if (chord.bass !== null) playBass(piano, at(0), chord.bass, Math.min(chord.beats, 2) * beat * 0.95);
    if (chord.voicing.length === 0) return;
    if (chord.beats >= BEATS_PER_BAR) {
      playChord(piano, at(0), chord.voicing, beat * 1.2);
      playChord(piano, at(1.5), chord.voicing, beat * 1.6);
    } else {
      playChord(piano, at(0), chord.voicing, chord.beats * beat * 0.85);
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
