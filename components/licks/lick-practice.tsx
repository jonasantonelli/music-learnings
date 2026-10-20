"use client";

import * as React from "react";
import { Check, ChevronLeft, ChevronRight, Play, Square, Star } from "lucide-react";
import { Fretboard } from "@/components/mdx/fretboard";
import { NoteText } from "@/components/note-text";
import { LickStaff } from "@/components/licks/lick-staff";
import { useMessages } from "@/components/locale-provider";
import { defineMessages } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { degreeMarkerStyle } from "@/lib/degree-roles";
import { useStoredState } from "@/lib/use-stored-state";
import { CHORD_FORMULAS } from "@/lib/music";
import { chordQuality, lickDegrees } from "@/lib/licks/analysis";
import { lickFingerings } from "@/lib/licks/fingering";
import {
  BEATS_PER_BAR,
  displayChord,
  keyForPitchClass,
  keyName,
  midiOf,
  parseKey,
  parseLick,
  pitchClassOf,
  pitchName,
  timedChords,
  toAbc,
  transposeChord,
  transposeLick,
  type LickKey,
  type ParsedLick,
  type TimedChord,
} from "@/lib/licks/notation";
import { LickPlayer, type PlaySequence } from "@/lib/licks/player";
import type { LickDefinition } from "@/lib/licks/catalog";
import { FAVORITES_KEY, LEARNED_KEY } from "@/lib/licks/storage";

const messages = defineMessages({
  en: {
    play: "Play",
    stop: "Stop",
    tempo: "Tempo",
    key: "Key",
    original: (k: string) => `Original (${k})`,
    cycle: "Cycle of 4ths (all keys)",
    position: "Position",
    positionOption: (fret: number) => `Fret ${fret}`,
    loop: "Loop",
    countIn: "Count-in",
    metronome: "Metronome",
    comping: "Chords",
    view: "View",
    fretboard: "Fretboard",
    staff: "Notation",
    both: "Both",
    labels: "Labels",
    degree: "Degree",
    note: "Note",
    order: "Order",
    prev: "Previous note",
    next: "Next note",
    stepHint: "Step with ← → · Space plays/stops",
    noteOf: (i: number, n: number) => `Note ${i} of ${n}`,
    favorite: "Favorite",
    learned: "Learned",
    nowIn: (k: string) => `Now in ${k}`,
    sequence: "Note sequence",
    fretboardCaption: (k: string, fret: number) => `${k} · position at fret ${fret}`,
  },
  pt: {
    play: "Tocar",
    stop: "Parar",
    tempo: "Andamento",
    key: "Tom",
    original: (k: string) => `Original (${k})`,
    cycle: "Ciclo de 4ªs (todos os tons)",
    position: "Posição",
    positionOption: (fret: number) => `${fret}ª casa`,
    loop: "Loop",
    countIn: "Contagem",
    metronome: "Metrônomo",
    comping: "Acordes",
    view: "Visualização",
    fretboard: "Braço",
    staff: "Partitura",
    both: "Ambos",
    labels: "Rótulos",
    degree: "Grau",
    note: "Nota",
    order: "Ordem",
    prev: "Nota anterior",
    next: "Próxima nota",
    stepHint: "Avance com ← → · Espaço toca/para",
    noteOf: (i: number, n: number) => `Nota ${i} de ${n}`,
    favorite: "Favorito",
    learned: "Aprendido",
    nowIn: (k: string) => `Agora em ${k}`,
    sequence: "Sequência de notas",
    fretboardCaption: (k: string, fret: number) => `${k} · posição na ${fret}ª casa`,
  },
  es: {
    play: "Tocar",
    stop: "Parar",
    tempo: "Tempo",
    key: "Tonalidad",
    original: (k: string) => `Original (${k})`,
    cycle: "Ciclo de 4as (todas las tonalidades)",
    position: "Posición",
    positionOption: (fret: number) => `Traste ${fret}`,
    loop: "Bucle",
    countIn: "Cuenta",
    metronome: "Metrónomo",
    comping: "Acordes",
    view: "Vista",
    fretboard: "Mástil",
    staff: "Partitura",
    both: "Ambos",
    labels: "Etiquetas",
    degree: "Grado",
    note: "Nota",
    order: "Orden",
    prev: "Nota anterior",
    next: "Nota siguiente",
    stepHint: "Avanza con ← → · Espacio toca/para",
    noteOf: (i: number, n: number) => `Nota ${i} de ${n}`,
    favorite: "Favorito",
    learned: "Aprendido",
    nowIn: (k: string) => `Ahora en ${k}`,
    sequence: "Secuencia de notas",
    fretboardCaption: (k: string, fret: number) => `${k} · posición en el traste ${fret}`,
  },
});

type View = "fretboard" | "staff" | "both";
type Labels = "degree" | "note" | "order";
type Prefs = {
  bpm: number;
  view: View;
  labels: Labels;
  loop: boolean;
  countIn: boolean;
  metronome: boolean;
  comping: boolean;
};

const DEFAULT_PREFS: Prefs = {
  bpm: 100,
  view: "fretboard",
  labels: "degree",
  loop: true,
  countIn: true,
  metronome: false,
  comping: true,
};


/** Everything needed to show and play a lick in one key. */
type Arrangement = {
  key: LickKey;
  lick: ParsedLick;
  chords: TimedChord[];
  midis: (number | null)[];
  degrees: ReturnType<typeof lickDegrees>;
  fingerings: ReturnType<typeof lickFingerings>;
  abc: string;
};

function arrange(source: ParsedLick, from: LickKey, chords: TimedChord[], pc: number | null): Arrangement {
  const key = pc === null ? from : keyForPitchClass(pc, from.mode);
  const { lick, interval } = transposeLick(source, from, key);
  const moved = chords.map((c) => ({ ...c, symbol: transposeChord(c.symbol, interval) }));
  const midis = lick.notes.map((n) => (n.pitch ? midiOf(n.pitch) : null));
  return {
    key,
    lick,
    chords: moved,
    midis,
    degrees: lickDegrees(lick, moved),
    fingerings: lickFingerings(midis),
    abc: toAbc(lick, key, moved),
  };
}

/** Places a pitch class in the octave starting at `low` (MIDI). */
const place = (pc: number, low: number) => low + ((((pc - low) % 12) + 12) % 12);

/** Shell voicing for the backing pad: low root, then 3rd and 7th. */
function compingMidis(symbol: string): number[] {
  const chord = chordQuality(symbol);
  if (!chord) return [];
  const [, third, , seventh] = CHORD_FORMULAS[chord.quality];
  return [
    place(chord.root, 40),
    place(chord.root + third, 52),
    place(chord.root + seventh, 52),
  ];
}

function toSequence(a: Arrangement): PlaySequence {
  return {
    notes: a.lick.notes.map((n, i) => ({
      index: i,
      start: n.start,
      beats: n.beats,
      // Guitar sounds an octave below written pitch.
      midi: a.midis[i] === null ? null : a.midis[i]! - 12,
      tied: i > 0 && a.lick.notes[i - 1].tie,
    })),
    chords: a.chords.map((c) => ({ start: c.start, beats: c.beats, midis: compingMidis(c.symbol) })),
    beats: a.lick.bars * BEATS_PER_BAR,
  };
}

export function LickPractice({ lick }: { lick: LickDefinition }) {
  const t = useMessages(messages);
  const [prefs, setPrefs] = useStoredState<Prefs>("lick-practice-prefs", DEFAULT_PREFS);
  const update = (patch: Partial<Prefs>) => setPrefs({ ...DEFAULT_PREFS, ...prefs, ...patch });
  const p = { ...DEFAULT_PREFS, ...prefs };

  const [favorites, setFavorites] = useStoredState<string[]>(FAVORITES_KEY, []);
  const [learned, setLearned] = useStoredState<string[]>(LEARNED_KEY, []);
  const toggleIn = (list: string[], set: (v: string[]) => void) =>
    set(list.includes(lick.slug) ? list.filter((s) => s !== lick.slug) : [...list, lick.slug]);

  const source = React.useMemo(() => parseLick(lick.notes), [lick.notes]);
  const sourceKey = React.useMemo(() => parseKey(lick.key), [lick.key]);
  const sourceChords = React.useMemo(() => timedChords(lick.chords), [lick.chords]);
  const sourcePc = pitchClassOf(sourceKey.tonic);

  // "original", a pitch class as a string, or "cycle".
  const [keyChoice, setKeyChoice] = React.useState("original");
  const [cyclePass, setCyclePass] = React.useState(0);
  const [positionIndex, setPositionIndex] = React.useState(0);
  const [active, setActive] = React.useState<number | null>(null);
  const [playing, setPlaying] = React.useState(false);

  const cache = React.useRef(new Map<string, Arrangement>());
  const arrangementFor = React.useCallback(
    (pc: number | null) => {
      const id = String(pc);
      let a = cache.current.get(id);
      if (!a) {
        a = arrange(source, sourceKey, sourceChords, pc);
        cache.current.set(id, a);
      }
      return a;
    },
    [source, sourceKey, sourceChords],
  );
  const pcForPass = React.useCallback(
    (pass: number): number | null => {
      if (keyChoice === "original") return null;
      if (keyChoice === "cycle") return pass === 0 ? null : (sourcePc + 5 * pass) % 12;
      return Number(keyChoice);
    },
    [keyChoice, sourcePc],
  );

  const current = arrangementFor(pcForPass(keyChoice === "cycle" ? cyclePass : 0));
  const fingering = current.fingerings[Math.min(positionIndex, current.fingerings.length - 1)];

  const playerRef = React.useRef<LickPlayer | null>(null);
  const player = () => (playerRef.current ??= new LickPlayer());
  React.useEffect(() => () => playerRef.current?.dispose(), []);

  const start = React.useCallback(() => {
    const pl = (playerRef.current ??= new LickPlayer());
    setCyclePass(0);
    pl.start({
      bpm: p.bpm,
      loop: p.loop || keyChoice === "cycle",
      countIn: p.countIn,
      metronome: p.metronome,
      comping: p.comping,
      sequence: (pass) => toSequence(arrangementFor(pcForPass(pass))),
      onNote: (pass, index) => {
        setCyclePass(pass);
        setActive(index);
      },
      onEnd: () => {
        setPlaying(false);
        setActive(null);
      },
    });
    setPlaying(true);
  }, [p.bpm, p.loop, p.countIn, p.metronome, p.comping, keyChoice, arrangementFor, pcForPass]);

  const stop = React.useCallback(() => {
    playerRef.current?.stop();
    setPlaying(false);
    setActive(null);
    setCyclePass(0);
  }, []);

  // Changing a setting mid-play restarts with the new one.
  const playingRef = React.useRef(false);
  React.useEffect(() => {
    if (playingRef.current) start();
  }, [start]);
  React.useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  const select = React.useCallback(
    (index: number) => {
      if (playingRef.current) stop();
      setActive(index);
      const midi = current.midis[index];
      if (midi !== null) player().preview(midi - 12);
    },
    [current, stop],
  );

  const step = React.useCallback(
    (delta: number) => {
      const n = current.midis.length;
      let i = active === null ? (delta > 0 ? -1 : n) : active;
      for (let k = 0; k < n; k++) {
        i = (i + delta + n) % n;
        if (current.midis[i] !== null && !(i > 0 && current.lick.notes[i - 1].tie)) break;
      }
      select(i);
    },
    [active, current, select],
  );

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, select, textarea, [contenteditable]")) return;
      if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      // Space on a focused button or link already activates it.
      else if (e.key === " " && !target.closest("button, a")) {
        if (playingRef.current) stop();
        else start();
      } else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, start, stop]);

  // --- Fretboard markers ---------------------------------------------------
  const soundingOrder = React.useMemo(() => {
    const order: (number | null)[] = [];
    let k = 0;
    current.lick.notes.forEach((n, i) => {
      const tied = i > 0 && current.lick.notes[i - 1].tie;
      order.push(n.pitch && !tied ? ++k : null);
    });
    return { order, count: k };
  }, [current]);

  const labelFor = (i: number) => {
    const n = current.lick.notes[i];
    if (!n.pitch) return "";
    if (p.labels === "note") return pitchName(n.pitch);
    if (p.labels === "order") return String(soundingOrder.order[i] ?? "");
    return current.degrees[i]?.label ?? pitchName(n.pitch);
  };

  const spots = fingering.spots;
  const frets = spots.flatMap((s) => (s ? [s.fret] : []));
  const startFret = Math.max(0, Math.min(...frets) - 1);
  const span = Math.max(5, Math.max(...frets) - startFret + 1);
  const activeSpot = active !== null ? spots[active] : null;

  const markers = React.useMemo(() => {
    const seen = new Map<string, number>();
    spots.forEach((s, i) => {
      if (!s) return;
      const id = `${s.string}:${s.fret}`;
      // Label a repeated spot by its occurrence nearest the active note.
      if (!seen.has(id) || (active !== null && i === active)) seen.set(id, i);
    });
    return [...seen.entries()].map(([id, i]) => {
      const s = spots[i]!;
      const isActive = activeSpot !== null && `${activeSpot.string}:${activeSpot.fret}` === id;
      const role = current.degrees[i]?.role ?? "passing";
      return {
        string: s.string,
        fret: s.fret,
        label: labelFor(i),
        ...degreeMarkerStyle(role),
        ring: isActive ? "var(--lick-active)" : undefined,
        opacity: activeSpot === null || isActive ? 1 : 0.35,
      };
    });
    // labelFor reads prefs and the arrangement, both covered here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spots, active, activeSpot, current, p.labels, soundingOrder]);

  const keyLabel = (k: LickKey) => displayChord(keyName(k));
  const bars = Array.from({ length: current.lick.bars }, (_, b) => b);
  const showFretboard = p.view !== "staff";
  const showStaff = p.view !== "fretboard";
  const activeOrder = active !== null ? soundingOrder.order[active] : null;

  return (
    <section className="mt-8 rounded-card border border-border bg-card p-4 sm:p-6">
      {/* Transport */}
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <button
          type="button"
          onClick={playing ? stop : start}
          className="inline-flex h-10 items-center gap-2 rounded-control bg-accent-9 px-4 text-sm font-medium text-accent-contrast transition-colors hover:bg-accent-10"
        >
          {playing ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {playing ? t.stop : t.play}
        </button>

        <label className="flex min-w-[180px] flex-1 flex-col gap-1 text-xs text-muted-foreground sm:flex-none">
          <span>
            {t.tempo} · <span className="font-mono text-foreground">{p.bpm} BPM</span>
          </span>
          <input
            type="range"
            min={40}
            max={260}
            step={5}
            value={p.bpm}
            onChange={(e) => update({ bpm: Number(e.target.value) })}
            className="accent-[var(--accent-9)]"
          />
        </label>

        <Field label={t.key}>
          <select
            value={keyChoice}
            onChange={(e) => {
              setKeyChoice(e.target.value);
              setCyclePass(0);
              setActive(null);
            }}
            className={SELECT}
          >
            <option value="original">{t.original(keyLabel(sourceKey))}</option>
            {Array.from({ length: 12 }, (_, pc) => (
              <option key={pc} value={pc}>
                {keyLabel(keyForPitchClass(pc, sourceKey.mode))}
              </option>
            ))}
            <option value="cycle">{t.cycle}</option>
          </select>
        </Field>

        <Field label={t.position}>
          <select
            value={Math.min(positionIndex, current.fingerings.length - 1)}
            onChange={(e) => setPositionIndex(Number(e.target.value))}
            className={SELECT}
          >
            {current.fingerings.map((f, i) => (
              <option key={f.position} value={i}>
                {t.positionOption(f.position)}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex items-center gap-1.5 sm:ml-auto">
          <StatusToggle
            on={favorites.includes(lick.slug)}
            onClick={() => toggleIn(favorites, setFavorites)}
            icon={<Star className="h-3.5 w-3.5" />}
            label={t.favorite}
          />
          <StatusToggle
            on={learned.includes(lick.slug)}
            onClick={() => toggleIn(learned, setLearned)}
            icon={<Check className="h-3.5 w-3.5" />}
            label={t.learned}
          />
        </div>
      </div>

      {/* Options */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-border pt-4">
        <div className="flex flex-wrap gap-1.5">
          <Chip on={p.loop} onClick={() => update({ loop: !p.loop })}>{t.loop}</Chip>
          <Chip on={p.countIn} onClick={() => update({ countIn: !p.countIn })}>{t.countIn}</Chip>
          <Chip on={p.metronome} onClick={() => update({ metronome: !p.metronome })}>{t.metronome}</Chip>
          <Chip on={p.comping} onClick={() => update({ comping: !p.comping })}>{t.comping}</Chip>
        </div>
        <Segmented
          label={t.view}
          value={p.view}
          onChange={(view) => update({ view })}
          options={[
            ["fretboard", t.fretboard],
            ["staff", t.staff],
            ["both", t.both],
          ]}
        />
        {showFretboard && (
          <Segmented
            label={t.labels}
            value={p.labels}
            onChange={(labels) => update({ labels })}
            options={[
              ["degree", t.degree],
              ["note", t.note],
              ["order", t.order],
            ]}
          />
        )}
      </div>

      {keyChoice === "cycle" && (
        <p className="mt-4 text-sm font-medium" aria-live="polite">
          {t.nowIn(keyLabel(current.key))}
        </p>
      )}

      {showStaff && (
        <div className="mt-5">
          <LickStaff abc={current.abc} active={active} onSelect={select} />
        </div>
      )}

      {showFretboard && (
        <Fretboard
          markers={markers}
          startFret={startFret}
          frets={span}
          fill
          caption={t.fretboardCaption(keyLabel(current.key), fingering.position)}
        />
      )}

      {/* Note sequence, bar by bar: also the step-through control. */}
      <div className="mt-2" aria-label={t.sequence} role="group">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bars.map((b) => (
            <div key={b} className="rounded-lg border border-border p-2.5">
              <div className="mb-2 flex gap-3 font-mono text-xs text-muted-foreground">
                {current.chords
                  .filter((c) => Math.floor(c.start / BEATS_PER_BAR) === b)
                  .map((c) => (
                    <span key={c.start} className="text-foreground">
                      <NoteText text={displayChord(c.symbol)} />
                    </span>
                  ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {current.lick.notes.map((n, i) =>
                  n.bar !== b ? null : (
                    <button
                      key={i}
                      type="button"
                      disabled={!n.pitch}
                      onClick={() => select(i)}
                      className={cn(
                        "flex min-w-[2.1rem] flex-col items-center rounded-md px-1.5 py-1 font-mono text-[11px] leading-tight transition-colors",
                        !n.pitch && "text-muted-foreground/50",
                        n.pitch && "bg-muted hover:bg-card-hover",
                        i === active && "ring-2 ring-[var(--lick-active)]",
                      )}
                    >
                      <span className="text-[12px] text-foreground">
                        {n.pitch ? <NoteText text={pitchName(n.pitch)} /> : "·"}
                      </span>
                      <span className="text-muted-foreground">
                        {n.pitch ? <NoteText text={current.degrees[i]?.label ?? ""} /> : ""}
                      </span>
                    </button>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <button type="button" onClick={() => step(-1)} aria-label={t.prev} className={ICON_BUTTON}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => step(1)} aria-label={t.next} className={ICON_BUTTON}>
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="font-mono">
            {activeOrder ? t.noteOf(activeOrder, soundingOrder.count) : t.stepHint}
          </span>
        </div>
      </div>
    </section>
  );
}

const SELECT =
  "h-10 rounded-control border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:border-accent-7";
const ICON_BUTTON =
  "inline-flex h-8 w-8 items-center justify-center rounded-control border border-border bg-card text-foreground transition-colors hover:bg-card-hover";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
      {label}
      {children}
    </label>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        on
          ? "border-accent-7 bg-accent-3 text-accent-11"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function StatusToggle({
  on,
  onClick,
  icon,
  label,
}: {
  on: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-control border px-2.5 text-xs transition-colors",
        on
          ? "border-transparent bg-tone-butter text-tone-butter-fg"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex rounded-control border border-border p-0.5">
        {options.map(([v, text]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(v)}
            className={cn(
              "rounded-[6px] px-2.5 py-1 text-xs transition-colors",
              value === v ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
