"use client";

import * as React from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ListMusic,
  LoaderCircle,
  Metronome,
  Minus,
  Pause,
  Play,
  Plus,
  Repeat,
  Square,
  Star,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { Fretboard } from "@/components/mdx/fretboard";
import { NoteText } from "@/components/note-text";
import { LickStaff, type TabNote } from "@/components/licks/lick-staff";
import { Select } from "@/components/select";
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
import { LickPlayer, type PlaySequence, type Position } from "@/lib/licks/player";
import type { LickDefinition } from "@/lib/licks/catalog";
import { FAVORITES_KEY, LEARNED_KEY } from "@/lib/licks/storage";

const messages = defineMessages({
  en: {
    play: "Play",
    pause: "Pause",
    stop: "Stop",
    stopHint: "Stop (back to the start)",
    ready: "Ready",
    playingNow: "Playing",
    pausedNow: "Paused",
    bars: (n: number) => `${n} bars`,
    at: (bar: number, bars: number, beat: number) => `Bar ${bar} of ${bars} · beat ${beat}`,
    slower: "Slower",
    faster: "Faster",
    keys_: { space: "Space", esc: "Esc" },
    shortcuts: { play: "play/pause", stop: "stop", step: "note by note", tempo: "tempo" },
    loadingPiano: "Loading piano…",
    audioFailed: "Couldn't load the piano sounds. Check your connection and try again.",
    audioLocked: "The browser kept audio paused. Press Play again to start it.",
    tempo: "Tempo",
    key: "Key",
    original: (k: string) => `Original (${k})`,
    cycle: "Cycle of 4ths (all keys)",
    keys: "Keys",
    position: "Position",
    positionOption: (fret: number) => `Fret ${fret}`,
    loop: "Loop",
    countIn: "Count-in",
    metronome: "Metronome",
    comping: "Chords",
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
    pause: "Pausar",
    stop: "Parar",
    stopHint: "Parar (voltar ao início)",
    ready: "Pronto",
    playingNow: "Tocando",
    pausedNow: "Pausado",
    bars: (n: number) => `${n} compassos`,
    at: (bar: number, bars: number, beat: number) => `Compasso ${bar} de ${bars} · tempo ${beat}`,
    slower: "Mais lento",
    faster: "Mais rápido",
    keys_: { space: "Espaço", esc: "Esc" },
    shortcuts: { play: "tocar/pausar", stop: "parar", step: "nota a nota", tempo: "andamento" },
    loadingPiano: "Carregando piano…",
    audioFailed: "Não foi possível carregar o som do piano. Verifique sua conexão e tente de novo.",
    audioLocked: "O navegador deixou o áudio pausado. Aperte Tocar de novo para começar.",
    tempo: "Andamento",
    key: "Tom",
    original: (k: string) => `Original (${k})`,
    cycle: "Ciclo de 4ªs (todos os tons)",
    keys: "Tonalidades",
    position: "Posição",
    positionOption: (fret: number) => `${fret}ª casa`,
    loop: "Loop",
    countIn: "Contagem",
    metronome: "Metrônomo",
    comping: "Acordes",
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
    pause: "Pausar",
    stop: "Parar",
    stopHint: "Parar (volver al inicio)",
    ready: "Listo",
    playingNow: "Tocando",
    pausedNow: "En pausa",
    bars: (n: number) => `${n} compases`,
    at: (bar: number, bars: number, beat: number) => `Compás ${bar} de ${bars} · tiempo ${beat}`,
    slower: "Más lento",
    faster: "Más rápido",
    keys_: { space: "Espacio", esc: "Esc" },
    shortcuts: { play: "tocar/pausar", stop: "parar", step: "nota a nota", tempo: "tempo" },
    loadingPiano: "Cargando piano…",
    audioFailed: "No se pudo cargar el sonido del piano. Revisa tu conexión e inténtalo de nuevo.",
    audioLocked: "El navegador dejó el audio en pausa. Pulsa Tocar de nuevo para empezar.",
    tempo: "Tempo",
    key: "Tonalidad",
    original: (k: string) => `Original (${k})`,
    cycle: "Ciclo de 4as (todas las tonalidades)",
    keys: "Tonalidades",
    position: "Posición",
    positionOption: (fret: number) => `Traste ${fret}`,
    loop: "Bucle",
    countIn: "Cuenta",
    metronome: "Metrónomo",
    comping: "Acordes",
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
};

const DEFAULT_PREFS: Prefs = {
  bpm: 100,
  view: "score",
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
  // Where a paused lick (or a chosen note) will resume from.
  const [resumeAt, setResumeAt] = React.useState<Position | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [audioIssue, setAudioIssue] = React.useState<"failed" | "locked" | null>(null);
  // Set when Stop is pressed while the piano is still loading.
  const cancelLoad = React.useRef(false);

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

  // Latest playback settings, read when playback starts. Tempo and the
  // loop/metronome/chords toggles are then applied live (below), so changing
  // them never restarts the lick; only a key change does.
  const loopOn = p.loop || keyChoice === "cycle";
  const settings = { bpm: p.bpm, countIn: p.countIn, loop: loopOn, metronome: p.metronome, comping: p.comping };
  const settingsRef = React.useRef(settings);
  React.useEffect(() => {
    settingsRef.current = settings;
  });

  const start = React.useCallback(
    async (from?: Position) => {
      const pl = (playerRef.current ??= new LickPlayer());
      // Unlock audio first, while still inside the click or key press.
      const resumed = pl.resume();
      if (!pl.ready) {
        // The first play fetches the piano samples.
        cancelLoad.current = false;
        setLoading(true);
        setAudioIssue(null);
        try {
          await pl.load();
        } catch {
          setAudioIssue("failed");
          return;
        } finally {
          setLoading(false);
        }
        if (cancelLoad.current) return;
      }
      if (!(await resumed)) {
        // The browser kept audio locked; the next click will unlock it.
        setAudioIssue("locked");
        return;
      }
      setAudioIssue(null);
      setResumeAt(null);
      setCyclePass(from?.pass ?? 0);
      pl.start(
        {
          ...settingsRef.current,
          sequence: (pass) => toSequence(arrangementFor(pcForPass(pass))),
          onNote: (pass, index) => {
            setCyclePass(pass);
            if (index !== null) setActive(index);
          },
          onEnd: () => {
            setPlaying(false);
            setActive(null);
            setResumeAt(null);
          },
        },
        from,
      );
      setPlaying(true);
    },
    [arrangementFor, pcForPass],
  );

  /** Stops at once and remembers the spot, so Play continues from there. */
  const pause = React.useCallback(() => {
    const at = playerRef.current?.pause() ?? null;
    setPlaying(false);
    setResumeAt(at);
  }, []);

  /** Stops at once and goes back to the start. */
  const stop = React.useCallback(() => {
    cancelLoad.current = true;
    playerRef.current?.stop();
    setPlaying(false);
    setActive(null);
    setResumeAt(null);
    setCyclePass(0);
  }, []);

  const playingRef = React.useRef(false);
  React.useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  const toggle = React.useCallback(() => {
    if (loading) return; // extra presses while the piano loads are ignored
    if (playingRef.current) pause();
    else void start(resumeAt ?? undefined);
  }, [loading, pause, start, resumeAt]);

  // A new key means new notes: restart from the top. (`start` changes only
  // with the key.)
  React.useEffect(() => {
    if (playingRef.current) void start();
  }, [start]);
  // Tempo and toggles apply while playing, without restarting.
  React.useEffect(() => {
    playerRef.current?.setBpm(p.bpm);
  }, [p.bpm]);
  React.useEffect(() => {
    playerRef.current?.update({ loop: loopOn, metronome: p.metronome, comping: p.comping });
  }, [loopOn, p.metronome, p.comping]);

  const displayPass = keyChoice === "cycle" ? cyclePass : 0;

  /** Selects a note: hear it, and make it the place Play starts from. */
  const select = React.useCallback(
    (index: number) => {
      if (playingRef.current) {
        playerRef.current?.stop();
        setPlaying(false);
      }
      setActive(index);
      setResumeAt({ pass: displayPass, beat: current.lick.notes[index].start });
      const midi = current.midis[index];
      if (midi !== null) player().preview(midi - 12);
    },
    [current, displayPass],
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

  const setTempo = React.useCallback(
    (bpm: number) => update({ bpm: Math.min(TEMPO_MAX, Math.max(TEMPO_MIN, bpm)) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prefs],
  );

  // Keyboard: Space plays/pauses from anywhere on the page (even with a
  // button focused, so it never re-presses that button), Esc stops, arrows
  // step through notes, +/- change the tempo. Text fields and open
  // dropdowns keep their own keys.
  React.useEffect(() => {
    let spaceTaken = false;
    const ownsKeys = (el: Element) =>
      el.closest(
        "textarea, select, [contenteditable], [role=listbox], [aria-haspopup], " +
          "input:not([type=range]):not([type=checkbox]):not([type=radio])",
      );
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as Element;
      if (e.metaKey || e.ctrlKey || e.altKey || ownsKeys(target)) return;
      const onSlider = target.matches("input[type=range]");
      switch (e.key) {
        case " ":
          if (!e.repeat) toggle();
          spaceTaken = true;
          break;
        case "Escape":
          stop();
          break;
        case "ArrowRight":
        case "ArrowLeft":
          if (onSlider) return;
          step(e.key === "ArrowRight" ? 1 : -1);
          break;
        case "+":
        case "=":
          setTempo(p.bpm + 5);
          break;
        case "-":
        case "_":
          setTempo(p.bpm - 5);
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    // A focused button "clicks" on Space key-up; swallow that one.
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === " " && spaceTaken) {
        spaceTaken = false;
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [toggle, stop, step, setTempo, p.bpm]);

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
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggle}
            aria-busy={loading}
            aria-label={`${loading ? t.loadingPiano : playing ? t.pause : t.play} (${t.keys_.space})`}
            title={`${playing ? t.pause : t.play} (${t.keys_.space})`}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-9 text-accent-contrast shadow-sm transition-[background-color,transform] hover:bg-accent-10 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-4"
          >
            {loading ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : playing ? (
              <Pause className="h-5 w-5" fill="currentColor" strokeWidth={0} />
            ) : (
              <Play className="ml-0.5 h-5 w-5" fill="currentColor" strokeWidth={0} />
            )}
          </button>
          <button
            type="button"
            onClick={stop}
            disabled={!playing && !resumeAt && active === null}
            aria-label={`${t.stopHint} (${t.keys_.esc})`}
            title={`${t.stopHint} (${t.keys_.esc})`}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-card-hover focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-4 disabled:opacity-40"
          >
            <Square className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
          </button>
          <div className="ml-1 flex min-w-[9.5rem] flex-col leading-tight" aria-live="polite">
            <span className="text-sm font-medium">
              {loading ? t.loadingPiano : playing ? t.playingNow : resumeAt ? t.pausedNow : t.ready}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {activeNote
                ? t.at(activeNote.bar + 1, current.lick.bars, Math.floor(activeNote.start % BEATS_PER_BAR) + 1)
                : t.bars(current.lick.bars)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">{t.tempo}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTempo(p.bpm - 5)}
              aria-label={`${t.slower} (−)`}
              className={ROUND_BUTTON}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-[4.5rem] text-center font-mono text-sm">
              <span className="font-semibold text-foreground">{p.bpm}</span>{" "}
              <span className="text-xs text-muted-foreground">BPM</span>
            </span>
            <button
              type="button"
              onClick={() => setTempo(p.bpm + 5)}
              aria-label={`${t.faster} (+)`}
              className={ROUND_BUTTON}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <input
              type="range"
              min={TEMPO_MIN}
              max={TEMPO_MAX}
              step={5}
              value={p.bpm}
              aria-label={t.tempo}
              onChange={(e) => setTempo(Number(e.target.value))}
              className="w-24 accent-[var(--accent-9)] sm:w-32"
            />
          </div>
        </div>

        <Field label={t.key}>
          <Select
            label={t.key}
            value={keyChoice}
            onChange={(choice) => {
              setKeyChoice(choice);
              setCyclePass(0);
              setActive(null);
              setResumeAt(null);
            }}
            className="w-56"
            groups={[
              { options: [{ value: "original", label: <NoteText text={t.original(keyLabel(sourceKey))} />, text: "original" }] },
              {
                label: t.keys,
                columns: 4,
                options: Array.from({ length: 12 }, (_, pc) => {
                  const name = keyLabel(keyForPitchClass(pc, sourceKey.mode));
                  return { value: String(pc), label: <NoteText text={name} />, text: name };
                }),
              },
              { options: [{ value: "cycle", label: t.cycle }] },
            ]}
          />
        </Field>

        <Field label={t.position}>
          <Select
            label={t.position}
            value={String(Math.min(positionIndex, current.fingerings.length - 1))}
            onChange={(i) => setPositionIndex(Number(i))}
            className="w-36"
            groups={[
              {
                options: current.fingerings.map((f, i) => ({
                  value: String(i),
                  label: t.positionOption(f.position),
                })),
              },
            ]}
          />
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

      {audioIssue && (
        <p role="alert" className="mt-4 text-sm text-muted-foreground">
          {audioIssue === "failed" ? t.audioFailed : t.audioLocked}
        </p>
      )}

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

      {/* Step through the lick note by note; a selected note is where Play starts. */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <button type="button" onClick={() => step(-1)} aria-label={t.prev} className={ICON_BUTTON}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => step(1)} aria-label={t.next} className={ICON_BUTTON}>
          <ChevronRight className="h-4 w-4" />
        </button>
        {activeOrder && activeNote?.pitch && (
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
        )}
      </div>

      {/* Keyboard shortcuts (not shown on touch-size screens). */}
      <p className="mt-3 hidden flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground sm:flex">
        <span>
          <Kbd>{t.keys_.space}</Kbd> {t.shortcuts.play}
        </span>
        <span>
          <Kbd>{t.keys_.esc}</Kbd> {t.shortcuts.stop}
        </span>
        <span>
          <Kbd>←</Kbd> <Kbd>→</Kbd> {t.shortcuts.step}
        </span>
        <span>
          <Kbd>−</Kbd> <Kbd>+</Kbd> {t.shortcuts.tempo}
        </span>
      </p>
    </section>
  );
}

const NECK_FRETS = 15;
const TEMPO_MIN = 40;
const TEMPO_MAX = 260;

const ROUND_BUTTON =
  "inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-card-hover focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-4";

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.4rem] items-center justify-center rounded-[5px] border border-border bg-muted px-1 font-mono text-[10px] text-foreground">
      {children}
    </kbd>
  );
}

const ICON_BUTTON =
  "inline-flex h-8 w-8 items-center justify-center rounded-control border border-border bg-card text-foreground transition-colors hover:bg-card-hover";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
      <span aria-hidden>{label}</span>
      {children}
    </div>
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
