"use client";

import * as React from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Guitar,
  ListMusic,
  Metronome,
  Piano,
  Play,
  Repeat,
  Square,
  Star,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { Fretboard } from "@/components/mdx/fretboard";
import { NoteText } from "@/components/note-text";
import { LickStaff, type TabNote } from "@/components/licks/lick-staff";
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
import { COMP_SOUNDS, LEAD_SOUNDS, type CompSound, type LeadSound } from "@/lib/licks/instruments";
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
    leadSound: "Lick sound",
    compSound: "Backing",
    sounds: {
      nylon: "Nylon guitar",
      "jazz-guitar": "Jazz guitar",
      "electric-piano": "Electric piano",
      piano: "Piano",
      guitar: "Guitar",
    } as Record<LeadSound | CompSound, string>,
    view: "View",
    fretboard: "Fretboard",
    score: "Notation + TAB",
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
    current: (note: string, degree: string, chord: string) => `${note} · ${degree} over ${chord}`,
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
    leadSound: "Timbre do lick",
    compSound: "Acompanhamento",
    sounds: {
      nylon: "Violão nylon",
      "jazz-guitar": "Guitarra jazz",
      "electric-piano": "Piano elétrico",
      piano: "Piano",
      guitar: "Guitarra",
    } as Record<LeadSound | CompSound, string>,
    view: "Visualização",
    fretboard: "Braço",
    score: "Partitura + TAB",
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
    current: (note: string, degree: string, chord: string) => `${note} · ${degree} sobre ${chord}`,
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
    leadSound: "Timbre del lick",
    compSound: "Acompañamiento",
    sounds: {
      nylon: "Guitarra de nylon",
      "jazz-guitar": "Guitarra jazz",
      "electric-piano": "Piano eléctrico",
      piano: "Piano",
      guitar: "Guitarra",
    } as Record<LeadSound | CompSound, string>,
    view: "Vista",
    fretboard: "Mástil",
    score: "Partitura + TAB",
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
    current: (note: string, degree: string, chord: string) => `${note} · ${degree} sobre ${chord}`,
    fretboardCaption: (k: string, fret: number) => `${k} · posición en el traste ${fret}`,
  },
});

type View = "score" | "fretboard" | "both";
type Labels = "degree" | "note" | "order";
type Prefs = {
  bpm: number;
  view: View;
  labels: Labels;
  loop: boolean;
  countIn: boolean;
  metronome: boolean;
  comping: boolean;
  lead: LeadSound;
  comp: CompSound;
};

const DEFAULT_PREFS: Prefs = {
  bpm: 100,
  view: "score",
  labels: "degree",
  loop: true,
  countIn: true,
  metronome: false,
  comping: true,
  lead: "nylon",
  comp: "piano",
};


/** Everything needed to show and play a lick in one key. */
type Arrangement = {
  key: LickKey;
  lick: ParsedLick;
  chords: TimedChord[];
  midis: (number | null)[];
  degrees: ReturnType<typeof lickDegrees>;
  fingerings: ReturnType<typeof lickFingerings>;
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
  };
}

/** Places a pitch class in the octave starting at `low` (MIDI). */
const place = (pc: number, low: number) => low + ((((pc - low) % 12) + 12) % 12);

/**
 * Backing for a chord: a rootless voicing as a jazz pianist would play it
 * (3rd, 7th, 9th, 5th — ♭9 on altered dominants) around middle C, and the
 * root low for the bass. Diminished chords keep all four tones.
 */
function compingVoicing(symbol: string): { voicing: number[]; bass: number | null } {
  const chord = chordQuality(symbol);
  if (!chord) return { voicing: [], bass: null };
  const [, third, fifth, seventh] = CHORD_FORMULAS[chord.quality];
  const ninth = /b9|alt/.test(symbol) ? 1 : 2;
  const tones =
    chord.quality === "m7b5" || chord.quality === "dim7"
      ? [0, third, fifth, seventh]
      : [third, seventh, ninth, fifth];
  return {
    voicing: tones.map((t) => place(chord.root + t, 52)).sort((a, b) => a - b),
    bass: place(chord.root, 40),
  };
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
    chords: a.chords.map((c) => ({ start: c.start, beats: c.beats, ...compingVoicing(c.symbol) })),
    beats: a.lick.bars * BEATS_PER_BAR,
  };
}

export function LickPractice({ lick }: { lick: LickDefinition }) {
  const t = useMessages(messages);
  const [prefs, setPrefs] = useStoredState<Prefs>("lick-practice-prefs-v2", DEFAULT_PREFS);
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
  const abcFor = React.useCallback(
    (barsPerLine: number) => toAbc(current.lick, current.key, current.chords, barsPerLine),
    [current],
  );
  const tab = React.useMemo<TabNote[]>(
    () =>
      fingering.spots.map((spot, i) =>
        spot ? { ...spot, tied: i > 0 && current.lick.notes[i - 1].tie } : null,
      ),
    [fingering, current],
  );

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
      lead: p.lead,
      comp: p.comp,
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
  }, [p.bpm, p.loop, p.countIn, p.metronome, p.comping, p.lead, p.comp, keyChoice, arrangementFor, pcForPass]);

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
      if (midi !== null) player().preview(midi - 12, p.lead);
    },
    [current, stop, p.lead],
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
  // Same board as the other explorers: the neck from the nut at its natural
  // size, so every lick and position shows at one standard size.
  const neckFrets = Math.max(NECK_FRETS, ...frets);
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
  const showFretboard = p.view !== "score";
  const showStaff = p.view !== "fretboard";
  const activeOrder = active !== null ? soundingOrder.order[active] : null;
  const activeNote = active !== null ? current.lick.notes[active] : null;
  const activeChord = activeNote ? current.chords.find(
    (c) => activeNote.start >= c.start - 1e-6 && activeNote.start < c.start + c.beats - 1e-6,
  ) : undefined;

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
        <div className="flex divide-x divide-border overflow-hidden rounded-control border border-border">
          <Toggle on={p.loop} icon={Repeat} label={t.loop} onClick={() => update({ loop: !p.loop })} />
          <Toggle on={p.countIn} icon={Timer} label={t.countIn} onClick={() => update({ countIn: !p.countIn })} />
          <Toggle
            on={p.metronome}
            icon={Metronome}
            label={t.metronome}
            onClick={() => update({ metronome: !p.metronome })}
          />
          <Toggle on={p.comping} icon={ListMusic} label={t.comping} onClick={() => update({ comping: !p.comping })} />
        </div>
        <SoundSelect
          label={t.leadSound}
          icon={p.lead === "electric-piano" ? Piano : Guitar}
          value={p.lead}
          options={LEAD_SOUNDS.map((s) => [s, t.sounds[s]])}
          onChange={(lead) => update({ lead })}
        />
        <SoundSelect
          label={t.compSound}
          icon={p.comp === "piano" ? Piano : Guitar}
          value={p.comp}
          disabled={!p.comping}
          options={COMP_SOUNDS.map((s) => [s, t.sounds[s]])}
          onChange={(comp) => update({ comp })}
        />
        <Segmented
          label={t.view}
          value={p.view}
          onChange={(view) => update({ view })}
          options={[
            ["score", t.score],
            ["fretboard", t.fretboard],
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
        <div className="lick-paper mt-5 rounded-card px-3 py-4 sm:px-6 sm:py-6">
          <LickStaff abc={abcFor} tab={tab} active={active} onSelect={select} />
        </div>
      )}

      {showFretboard && (
        <Fretboard
          markers={markers}
          startFret={0}
          frets={neckFrets}
          caption={t.fretboardCaption(keyLabel(current.key), fingering.position)}
        />
      )}

      {/* Step through the lick note by note. */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <button type="button" onClick={() => step(-1)} aria-label={t.prev} className={ICON_BUTTON}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => step(1)} aria-label={t.next} className={ICON_BUTTON}>
          <ChevronRight className="h-4 w-4" />
        </button>
        {activeOrder && activeNote?.pitch ? (
          <span className="font-mono">
            {t.noteOf(activeOrder, soundingOrder.count)} ·{" "}
            <span className="text-foreground">
              <NoteText
                text={t.current(
                  pitchName(activeNote.pitch),
                  current.degrees[active!]?.label ?? "",
                  displayChord(activeChord?.symbol ?? ""),
                )}
              />
            </span>
          </span>
        ) : (
          <span className="font-mono">{t.stepHint}</span>
        )}
      </div>
    </section>
  );
}

const NECK_FRETS = 15;

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

/** One button of the playback toolbar: icon + label, lit when on. */
function Toggle({
  on,
  onClick,
  icon: Icon,
  label,
}: {
  on: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 px-3 text-xs transition-colors",
        on
          ? "bg-accent-3 font-medium text-accent-11"
          : "bg-card text-muted-foreground hover:bg-card-hover hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={on ? 2.4 : 1.8} />
      {/* Icons alone on phones, so the toolbar stays on one row. */}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function SoundSelect<T extends string>({
  label,
  icon: Icon,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  icon: LucideIcon;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <label className={cn("relative flex items-center", disabled && "opacity-50")}>
      <span className="sr-only">{label}</span>
      <Icon className="pointer-events-none absolute left-2.5 h-4 w-4 text-muted-foreground" />
      <select
        value={value}
        disabled={disabled}
        title={label}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-9 rounded-control border border-border bg-card pl-8 pr-3 text-xs text-foreground focus:outline-none focus:border-accent-7"
      >
        {options.map(([v, text]) => (
          <option key={v} value={v}>
            {text}
          </option>
        ))}
      </select>
    </label>
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
