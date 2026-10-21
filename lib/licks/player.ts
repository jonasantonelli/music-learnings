"use client";

import { BEATS_PER_BAR } from "./notation";
import {
  VELOCITY,
  createMixBus,
  loadInstrument,
  playBass,
  playChord,
  playNote,
  type MixBus,
  type Instrument,
  type Stop,
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

/**
 * Settings that can change while playing: the metronome and comping switch
 * on or off at once; loop is checked when the pass ends.
 */
export type LiveSettings = {
  loop: boolean;
  metronome: boolean;
  comping: boolean;
};

export type PlayOptions = LiveSettings & {
  bpm: number;
  countIn: boolean;
  /** Sequence for each pass; lets callers change key between loops. */
  sequence: (pass: number) => PlaySequence;
  /** Current note index (null between notes or during the count-in). */
  onNote: (pass: number, index: number | null) => void;
  onEnd: () => void;
};

const LOOKAHEAD = 0.25; // seconds of audio scheduled ahead of the clock
const TICK_MS = 50;

/**
 * Something scheduled in the current pass, positioned in beats from the
 * pass start (the count-in sits at negative beats), so it can be moved
 * when the tempo changes.
 */
type Planned = {
  beat: number;
  /** Set on events a live toggle adds or removes (metronome, comping). */
  kind?: Toggled;
  /** Starts the sound at `time`, given the length of a beat in seconds. */
  play: (time: number, beatSeconds: number) => Stop;
  /** Lick note this event highlights, and for how many beats. */
  cue?: { index: number; beats: number };
  time: number;
  stop?: Stop;
};

type Toggled = "click" | "comp";

type Cue = { time: number; end: number; pass: number; index: number };

/** Where playback is: which pass, and how many beats into it. */
export type Position = { pass: number; beat: number };

const silent: Stop = () => {};

/**
 * One audio context, mix bus and instrument for the whole site, so the samples
 * loads once rather than on every lick page.
 */
let shared: { ctx: AudioContext; bus: MixBus } | null = null;

function sharedAudio() {
  if (!shared || shared.ctx.state === "closed") {
    const ctx = new AudioContext();
    shared = { ctx, bus: createMixBus(ctx) };
  }
  return shared;
}

/**
 * A small Web Audio player for licks. Each pass is planned in beats and
 * scheduled slightly ahead of the audio clock; a frame loop reports which
 * note is sounding so the staff and fretboard can follow along. The tempo
 * can change mid-pass: whatever hasn't sounded yet is rescheduled from the
 * current beat, so playback never restarts.
 */
export class LickPlayer {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private bus: MixBus | null = null;
  /** Stop functions for everything scheduled since Play (pruned as it plays). */
  private handles: { time: number; stop: Stop; kind?: Toggled }[] = [];
  private piano: Instrument | null = null;
  private onStateChange: (() => void) | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private frame = 0;
  private options: PlayOptions | null = null;
  private bpm = 100;
  private pass = 0;
  private passStart = 0;
  private plan: Planned[] = [];
  private cues: Cue[] = [];
  private current: PlaySequence | null = null;
  private lastReported: string | null = null;
  /** Noise burst for the metronome tick (built on first use). */
  private tick_: AudioBuffer | null = null;

  private context(): AudioContext {
    if (!this.ctx) {
      const audio = sharedAudio();
      this.ctx = audio.ctx;
      this.bus = audio.bus;
      // If the browser suspends audio mid-play (tab in the background, a
      // call on a phone), stop cleanly so the next Play — a user gesture —
      // can resume it, instead of sitting silently on "Stop".
      this.onStateChange = () => {
        if (this.ctx?.state !== "running" && this.options) {
          const { onEnd, onNote } = this.options;
          this.stop();
          onNote(this.pass, null);
          onEnd();
        }
      };
      this.ctx.addEventListener("statechange", this.onStateChange);
    }
    // Safari also has an "interrupted" state, so resume from anything but running.
    if (this.ctx.state !== "running") void this.ctx.resume();
    return this.ctx;
  }

  /**
   * Resumes audio (must be called from a user gesture); resolves to whether
   * the clock is actually running, giving up after a short wait.
   */
  async resume(): Promise<boolean> {
    const ctx = this.context();
    if (ctx.state === "running") return true;
    await Promise.race([ctx.resume().catch(() => {}), new Promise((r) => setTimeout(r, 400))]);
    // The state may have changed while awaiting.
    return (ctx.state as AudioContextState) === "running";
  }

  private freshOutput(): GainNode {
    const ctx = this.context();
    this.out?.disconnect();
    const gain = ctx.createGain();
    gain.gain.value = 0.9;
    // Only the metronome plays here: straight to the output, no reverb.
    gain.connect(this.bus!.dry);
    this.out = gain;
    return gain;
  }

  private get beatSeconds(): number {
    return 60 / this.bpm;
  }

  get playing(): boolean {
    return this.options !== null;
  }

  /** True once the instrument's samples are loaded. */
  get ready(): boolean {
    return this.piano !== null;
  }

  /** Loads the instrument (fetching samples the first time). */
  async load(): Promise<void> {
    const ctx = this.context();
    this.piano ??= await loadInstrument(ctx, this.bus!.input);
  }

  /**
   * Starts playback; call `load()` first. With `from`, resumes at that pass
   * and beat (no count-in), e.g. after a pause or from a chosen note.
   */
  start(options: PlayOptions, from?: Position) {
    if (!this.piano) throw new Error("LickPlayer.start() before load()");
    this.stop();
    const ctx = this.context();
    this.unmute();
    this.freshOutput();
    this.options = { ...options };
    this.bpm = options.bpm;
    this.pass = from?.pass ?? 0;
    this.cues = [];
    this.lastReported = null;
    const countIn = options.countIn && !from ? BEATS_PER_BAR : 0;
    const fromBeat = from?.beat ?? 0;
    this.passStart = ctx.currentTime + 0.08 + (countIn - fromBeat) * this.beatSeconds;
    const clicks: Planned[] = Array.from({ length: countIn }, (_, b) => ({
      beat: b - countIn,
      play: (time) => this.click(time, b === 0),
      time: 0,
    }));
    this.schedulePass(clicks, from ? fromBeat : -Infinity);
    this.timer = setInterval(() => this.tick(), TICK_MS);
    const follow = () => {
      this.report();
      this.frame = requestAnimationFrame(follow);
    };
    this.frame = requestAnimationFrame(follow);
  }

  /**
   * Stops at once and returns where it was, so `start(options, position)`
   * can pick up from the same beat. Returns null if nothing was playing.
   */
  pause(): Position | null {
    if (!this.options || !this.ctx) return null;
    const beat = (this.ctx.currentTime - this.passStart) / this.beatSeconds;
    const position = { pass: this.pass, beat: Math.max(0, beat) };
    this.stop();
    return position;
  }

  /** Changes loop, metronome or comping without restarting. */
  update(settings: LiveSettings) {
    const opts = this.options;
    if (!opts) return;
    const { metronome, comping } = opts;
    Object.assign(opts, settings);
    if (settings.metronome !== metronome) this.toggle("click", settings.metronome);
    if (settings.comping !== comping) this.toggle("comp", settings.comping);
  }

  /**
   * Switches the metronome or comping mid-pass: off cancels what is queued
   * and damps what rings; on schedules the rest of the pass from this beat.
   */
  private toggle(kind: Toggled, on: boolean) {
    const ctx = this.ctx;
    const seq = this.current;
    if (!ctx || !seq) return;
    const now = ctx.currentTime;
    if (!on) {
      for (const h of this.handles) if (h.kind === kind) h.stop(now);
      this.handles = this.handles.filter((h) => h.kind !== kind);
      this.plan = this.plan.filter((item) => item.kind !== kind);
      return;
    }
    // A little margin so nothing is scheduled in the past.
    const beat = (now + 0.02 - this.passStart) / this.beatSeconds;
    const all = kind === "click" ? this.clicks(seq) : seq.chords.flatMap((c) => this.comp(c));
    const events = all.filter((item) => item.beat >= beat);
    for (const item of events) this.schedule(item);
    this.plan.push(...events);
  }

  /**
   * Changes the tempo without restarting: the pass is re-anchored so the
   * current beat stays put, and everything not yet sounding is rescheduled.
   */
  setBpm(bpm: number) {
    const ctx = this.ctx;
    if (!this.options || !ctx || bpm === this.bpm) {
      this.bpm = bpm;
      return;
    }
    const now = ctx.currentTime;
    const beat = (now - this.passStart) / this.beatSeconds;
    this.bpm = bpm;
    this.passStart = now - beat * this.beatSeconds;
    for (const item of this.plan) {
      if (item.time <= now + 0.005) continue;
      item.stop?.(now);
      this.schedule(item);
    }
    this.cues = this.cues.filter((c) => c.pass !== this.pass);
    this.addCues();
  }

  /**
   * Stops playback. By default it cuts the sound at once (the Stop button);
   * `ringOut` only ends scheduling and lets the last notes ring, for a lick
   * that reached its end.
   */
  stop(ringOut = false) {
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
    // Cancel every scheduled note through its own stop function (those not
    // started yet never sound), damp what rings, and pull the master down so
    // the reverb tail goes too.
    const now = this.ctx?.currentTime;
    if (!ringOut) for (const h of this.handles) h.stop(now);
    this.handles = [];
    if (!ringOut) this.piano?.stop();
    if (!ringOut && this.ctx && this.bus && this.options) {
      this.bus.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.bus.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.015);
    }
    this.options = null;
    this.plan = [];
    this.cues = [];
  }

  /** Plays a single note now (for stepping through a lick). */
  preview(midi: number, seconds = 0.8) {
    void this.load()
      .then(() => {
        this.unmute();
        playNote(this.piano!, this.ctx!.currentTime + 0.01, midi, seconds, VELOCITY.lead);
      })
      .catch(() => {
        // No samples (e.g. offline): stepping still works, silently.
      });
  }

  /** Stops and detaches; the shared context and instrument stay for the next page. */
  dispose() {
    this.stop();
    if (this.onStateChange) this.ctx?.removeEventListener("statechange", this.onStateChange);
    this.ctx = null;
    this.bus = null;
    this.piano = null;
  }

  private schedule(item: Planned) {
    item.time = this.passStart + item.beat * this.beatSeconds;
    item.stop = item.play(item.time, this.beatSeconds);
    this.handles.push({ time: item.time, stop: item.stop, kind: item.kind });
  }

  /** Brings the master back up (after a Stop pulled it to silence). */
  private unmute() {
    if (!this.ctx || !this.bus) return;
    const gain = this.bus.master.gain;
    const now = this.ctx.currentTime;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(1, now + 0.01);
  }

  private addCues() {
    for (const item of this.plan) {
      if (!item.cue) continue;
      const time = this.passStart + item.beat * this.beatSeconds;
      this.cues.push({
        time,
        end: time + item.cue.beats * this.beatSeconds,
        pass: this.pass,
        index: item.cue.index,
      });
    }
  }

  /** Plans the current pass (plus any extra events, e.g. the count-in) and schedules it. */
  private schedulePass(extra: Planned[] = [], fromBeat = -Infinity) {
    const opts = this.options!;
    const piano = this.piano!;
    const seq = opts.sequence(this.pass);
    this.current = seq;
    const plan: Planned[] = [...extra];

    seq.notes.forEach((n, k) => {
      let play: Planned["play"] = () => silent;
      if (n.midi !== null && !n.tied) {
        // Extend through any tied continuations.
        let length = n.beats;
        for (let j = k + 1; seq.notes[j]?.tied; j++) length += seq.notes[j].beats;
        const midi = n.midi;
        play = (time, b) => playNote(piano, time, midi, length * b, VELOCITY.lead);
      }
      plan.push({ beat: n.start, play, cue: { index: n.index, beats: n.beats }, time: 0 });
    });

    if (opts.comping) {
      for (const c of seq.chords) plan.push(...this.comp(c));
    }
    if (opts.metronome) plan.push(...this.clicks(seq));

    // When resuming mid-pass, skip what came before the resume point.
    this.plan = plan.filter((item) => item.beat >= fromBeat - 1e-6);
    for (const item of this.plan) this.schedule(item);
    this.addCues();
  }

  private tick() {
    const opts = this.options;
    const ctx = this.ctx;
    if (!opts || !ctx || !this.current) return;
    const passEnd = this.passStart + this.current.beats * this.beatSeconds;
    if (ctx.currentTime + LOOKAHEAD < passEnd) return;
    if (!opts.loop) {
      if (ctx.currentTime >= passEnd) {
        const onEnd = opts.onEnd;
        const onNote = opts.onNote;
        this.stop(true);
        onNote(this.pass, null);
        onEnd();
      }
      return;
    }
    this.pass += 1;
    this.passStart = passEnd;
    this.cues = this.cues.filter((c) => c.end > ctx.currentTime);
    this.handles = this.handles.filter((h) => h.time > ctx.currentTime - 10);
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

  /** A metronome tick on every beat of the pass, accented on each downbeat. */
  private clicks(seq: PlaySequence): Planned[] {
    return Array.from({ length: seq.beats }, (_, b) => ({
      beat: b,
      kind: "click",
      play: (time) => this.click(time, b % BEATS_PER_BAR === 0),
      time: 0,
    }));
  }

  /**
   * Comping for one chord span: the Charleston (beat 1 and the "and" of 2)
   * in a bar-long span, one hit in a shorter one, with the root on 1 in the
   * bass. Lengths are in beats so they follow tempo changes.
   */
  private comp(chord: PlayChord): Planned[] {
    const piano = this.piano!;
    const events: Planned[] = [];
    const hit = (beat: number, beats: number, sound: (time: number, seconds: number) => Stop) =>
      events.push({ beat: chord.start + beat, kind: "comp", time: 0, play: (time, b) => sound(time, beats * b) });
    if (chord.bass !== null) {
      const bass = chord.bass;
      hit(0, Math.min(chord.beats, 2) * 0.95, (t, s) => playBass(piano, t, bass, s));
    }
    if (chord.voicing.length > 0) {
      const voicing = chord.voicing;
      if (chord.beats >= BEATS_PER_BAR) {
        hit(0, 1.2, (t, s) => playChord(piano, t, voicing, s));
        hit(1.5, 1.6, (t, s) => playChord(piano, t, voicing, s));
      } else {
        hit(0, chord.beats * 0.85, (t, s) => playChord(piano, t, voicing, s));
      }
    }
    return events;
  }

  /**
   * Metronome tick: a few ms of filtered noise, unpitched, so it reads as a
   * click and not as a note (a short sine blip sounds like a xylophone).
   */
  private click(time: number, accent: boolean): Stop {
    const ctx = this.ctx!;
    const out = this.out!;
    if (!this.tick_ || this.tick_.sampleRate !== ctx.sampleRate) {
      const length = Math.floor(ctx.sampleRate * 0.012);
      this.tick_ = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = this.tick_.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
    }
    const src = ctx.createBufferSource();
    src.buffer = this.tick_;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = accent ? 3200 : 2400;
    band.Q.value = 0.9;
    const level = ctx.createGain();
    level.gain.value = accent ? 0.9 : 0.55;
    src.connect(band).connect(level).connect(out);
    src.start(time);
    // A tick cancelled before it sounds is stopped at (or before) its start.
    return (at) => src.stop(Math.max(at ?? ctx.currentTime, ctx.currentTime));
  }
}
