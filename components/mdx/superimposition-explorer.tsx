"use client";

import { useState } from "react";
import { usePracticeNote } from "@/lib/use-practice-note";
import { KEY_OPTIONS, keyName, type DegreeSpeller } from "@/lib/music";
import {
  ARPEGGIO_FORMULAS,
  ARPEGGIO_INTERVAL_LABELS,
  ARPEGGIO_SUFFIXES,
  TRIAD_FORMULAS,
  getCagedShapes,
  getFullNeckArpeggio,
  type ArpeggioMarker,
} from "@/lib/arpeggios";
import {
  BASE_SUFFIXES,
  SUPERIMPOSITIONS,
  baseDegree,
  getSuperimposition,
  isBaseChordTone,
  superimpositionSpeller,
  type BaseQuality,
  type Superimposition,
} from "@/lib/superimposition";
import { NoteText } from "@/components/note-text";
import { Fretboard } from "./fretboard";
import { ChipGroup, ControlBar, NoteGrid, SegmentedControl } from "./control-group";
import { defineMessages } from "@/lib/i18n";
import { useMessages } from "@/components/locale-provider";

type SoundKey = `${BaseQuality}:${string}`;

const messages = defineMessages<{
  chordRoot: string;
  chord: string;
  playOver: string;
  labels: string;
  overChord: string;
  arpeggio: string;
  notes: string;
  view: string;
  fullNeck: string;
  triad: string;
  over: string;
  legend: (chord: string) => string;
  captionFull: (arp: string, chord: string) => string;
  captionShape: (arp: string, shape: string) => string;
  sounds: Record<SoundKey, string>;
}>({
  en: {
    chordRoot: "Chord root",
    chord: "Chord",
    playOver: "Play over it",
    labels: "Labels",
    overChord: "Over chord",
    arpeggio: "Arpeggio",
    notes: "Notes",
    view: "View",
    fullNeck: "Full neck",
    triad: "triad",
    over: "over",
    legend: (chord) =>
      `The purple dot is the root of ${chord}, plain dots are its other chord tones, peach dots are the tensions the arpeggio adds.`,
    captionFull: (arp, chord) => `${arp} arpeggio over ${chord} — full neck`,
    captionShape: (arp, shape) => `${arp} — ${shape} shape`,
    sounds: {
      "maj7:iii-m7": "Ionian — drops the root, adds the 9",
      "maj7:V-maj7": "Lydian — the ♯11 appears",
      "maj7:vii-m7": "Lydian — pure upper extensions",
      "maj7:II-triad": "Lydian upper-structure triad",
      "maj7:vi-m7": "Major 6 — the relative minor",
      "m7:bIII-maj7": "Dorian / Aeolian — adds the 9",
      "m7:v-m7": "Dorian / Aeolian — adds the 9 and 11",
      "m7:bVII-maj7": "Dorian — the natural 13",
      "m7:ii-triad": "Dorian upper-structure triad",
      "7:iii-m7b5": "Mixolydian — the classic rootless 9",
      "7:v-m7": "Mixolydian — 9 and 11 on top, a sus flavour",
      "7:bii-dim7": "Half-whole diminished",
      "7:bV-7": "Tritone substitution",
      "7:II-triad": "Lydian dominant upper structure",
      "7:bVI-triad": "Altered — ♭13 and ♯9",
    },
  },
  pt: {
    chordRoot: "Fundamental do acorde",
    chord: "Acorde",
    playOver: "Tocar por cima",
    labels: "Rótulos",
    overChord: "Sobre o acorde",
    arpeggio: "Arpejo",
    notes: "Notas",
    view: "Visualização",
    fullNeck: "Braço inteiro",
    triad: "tríade",
    over: "sobre",
    legend: (chord) =>
      `O ponto roxo é a fundamental de ${chord}, pontos lisos são as outras notas do acorde, pontos pêssego são as tensões que o arpejo acrescenta.`,
    captionFull: (arp, chord) => `Arpejo de ${arp} sobre ${chord} — braço inteiro`,
    captionShape: (arp, shape) => `${arp} — forma de ${shape}`,
    sounds: {
      "maj7:iii-m7": "Jônio — tira a fundamental, acrescenta a 9",
      "maj7:V-maj7": "Lídio — aparece a ♯11",
      "maj7:vii-m7": "Lídio — só extensões superiores",
      "maj7:II-triad": "Tríade de estrutura superior lídia",
      "maj7:vi-m7": "Maior com 6 — o relativo menor",
      "m7:bIII-maj7": "Dórico / Eólio — acrescenta a 9",
      "m7:v-m7": "Dórico / Eólio — acrescenta a 9 e a 11",
      "m7:bVII-maj7": "Dórico — a 13 natural",
      "m7:ii-triad": "Tríade de estrutura superior dórica",
      "7:iii-m7b5": "Mixolídio — o clássico 9 sem fundamental",
      "7:v-m7": "Mixolídio — 9 e 11 em cima, sabor sus",
      "7:bii-dim7": "Diminuta semitom-tom",
      "7:bV-7": "Substituição de trítono",
      "7:II-triad": "Estrutura superior lídio ♭7",
      "7:bVI-triad": "Alterado — ♭13 e ♯9",
    },
  },
  es: {
    chordRoot: "Fundamental del acorde",
    chord: "Acorde",
    playOver: "Tocar encima",
    labels: "Etiquetas",
    overChord: "Sobre el acorde",
    arpeggio: "Arpegio",
    notes: "Notas",
    view: "Vista",
    fullNeck: "Mástil completo",
    triad: "tríada",
    over: "sobre",
    legend: (chord) =>
      `El punto morado es la fundamental de ${chord}, los puntos lisos son sus otras notas, los puntos durazno son las tensiones que añade el arpegio.`,
    captionFull: (arp, chord) => `Arpegio de ${arp} sobre ${chord} — mástil completo`,
    captionShape: (arp, shape) => `${arp} — forma de ${shape}`,
    sounds: {
      "maj7:iii-m7": "Jónico — quita la fundamental, añade la 9",
      "maj7:V-maj7": "Lidio — aparece la ♯11",
      "maj7:vii-m7": "Lidio — solo extensiones superiores",
      "maj7:II-triad": "Tríada de estructura superior lidia",
      "maj7:vi-m7": "Mayor con 6 — el relativo menor",
      "m7:bIII-maj7": "Dórico / Eólico — añade la 9",
      "m7:v-m7": "Dórico / Eólico — añade la 9 y la 11",
      "m7:bVII-maj7": "Dórico — la 13 natural",
      "m7:ii-triad": "Tríada de estructura superior dórica",
      "7:iii-m7b5": "Mixolidio — el clásico 9 sin fundamental",
      "7:v-m7": "Mixolidio — 9 y 11 arriba, sabor sus",
      "7:bii-dim7": "Disminuida semitono-tono",
      "7:bV-7": "Sustitución tritonal",
      "7:II-triad": "Estructura superior lidio ♭7",
      "7:bVI-triad": "Alterado — ♭13 y ♯9",
    },
  },
});

type SuperimpositionExplorerProps = {
  base?: BaseQuality;
};

type LabelMode = "chord" | "arpeggio" | "notes";
type ViewMode = "full" | "caged";

const BASE_OPTIONS: { label: string; value: BaseQuality }[] = [
  { label: "Maj7", value: "maj7" },
  { label: "m7", value: "m7" },
  { label: "Dom7", value: "7" },
];

const FRET_COUNT = 15;

type Tone = "root" | "chord" | "tension";

function toneOf(base: BaseQuality, interval: number): Tone {
  if (interval === 0) return "root";
  return isBaseChordTone(base, interval) ? "chord" : "tension";
}

const TONE_STYLE: Record<Tone, { color: string; labelColor: string; stroke?: string }> = {
  root: { color: "var(--degree-root-bg)", labelColor: "var(--degree-root-fg)" },
  chord: {
    color: "var(--arpeggio-tone-bg)",
    labelColor: "var(--arpeggio-tone-fg)",
    stroke: "var(--arpeggio-tone-border)",
  },
  tension: {
    color: "var(--degree-color-bg)",
    labelColor: "var(--degree-color-fg)",
    stroke: "var(--degree-color-border)",
  },
};

// Arpeggio markers are relative to the superimposed arpeggio's own root;
// re-measure them from the base chord's root before labelling.
function buildMarkers(
  markers: ArpeggioMarker[],
  base: BaseQuality,
  s: Superimposition,
  speller: DegreeSpeller,
  labelMode: LabelMode,
) {
  return markers.map((m) => {
    const interval = (s.interval + m.intervalPc) % 12;
    const label =
      labelMode === "chord"
        ? baseDegree(base, s, interval)
        : labelMode === "arpeggio"
          ? ARPEGGIO_INTERVAL_LABELS[m.intervalPc]
          : speller.spell(interval);
    return {
      string: m.string,
      fret: m.fret,
      label,
      ...TONE_STYLE[toneOf(base, interval)],
    };
  });
}

export function SuperimpositionExplorer({
  base: initialBase = "maj7",
}: SuperimpositionExplorerProps) {
  const t = useMessages(messages);
  // The root follows the shared practice note, so every explorer on the page
  // stays in the same key; the local copy covers blocked storage.
  const [practiceNote, setPracticeNote] = usePracticeNote();
  const [localRoot, setLocalRoot] = useState(0);
  const root = practiceNote ?? localRoot;

  const setRoot = (n: number) => {
    setLocalRoot(n);
    setPracticeNote(n);
  };
  const [base, setBaseLocal] = useState<BaseQuality>(initialBase);
  const [optionId, setOptionId] = useState(SUPERIMPOSITIONS[initialBase][0].id);
  const [labelMode, setLabelMode] = useState<LabelMode>("chord");
  const [view, setView] = useState<ViewMode>("full");

  const setBase = (b: BaseQuality) => {
    setBaseLocal(b);
    setOptionId(SUPERIMPOSITIONS[b][0].id);
  };

  const optionLabel = (o: Superimposition) =>
    o.quality in TRIAD_FORMULAS ? `${o.degree} ${t.triad}` : o.degree;

  const s = getSuperimposition(base, optionId);
  const speller = superimpositionSpeller(root, base, s, keyName(root));
  const arpRoot = (root + s.interval) % 12;
  const baseName = `${speller.root}${BASE_SUFFIXES[base]}`;
  const arpName = `${speller.spell(s.interval)}${ARPEGGIO_SUFFIXES[s.quality]}`;
  const resultName = `${speller.root}${s.result}`;

  const arpTones = ARPEGGIO_FORMULAS[s.quality].map((iv) => {
    const interval = (s.interval + iv) % 12;
    return {
      note: speller.spell(interval),
      degree: baseDegree(base, s, interval),
      style: TONE_STYLE[toneOf(base, interval)],
    };
  });

  return (
    <div className="my-8">
      <ControlBar>
        <NoteGrid
          label={t.chordRoot}
          options={KEY_OPTIONS.map((k) => ({ label: k.name, value: k.value }))}
          value={root}
          onChange={setRoot}
        />

        <SegmentedControl
          label={t.chord}
          options={BASE_OPTIONS}
          value={base}
          onChange={(v) => setBase(v as BaseQuality)}
        />

        <ChipGroup
          label={t.playOver}
          options={SUPERIMPOSITIONS[base].map((o) => ({ label: optionLabel(o), value: o.id }))}
          value={s.id}
          onChange={setOptionId}
        />

        <SegmentedControl
          label={t.labels}
          options={[
            { label: t.overChord, value: "chord" as LabelMode },
            { label: t.arpeggio, value: "arpeggio" as LabelMode },
            { label: t.notes, value: "notes" as LabelMode },
          ]}
          value={labelMode}
          onChange={setLabelMode}
        />

        <SegmentedControl
          label={t.view}
          options={[
            { label: t.fullNeck, value: "full" as ViewMode },
            { label: "CAGED", value: "caged" as ViewMode },
          ]}
          value={view}
          onChange={setView}
        />
      </ControlBar>

      <div className="mb-6 rounded-card border border-border bg-card p-4">
        <p className="text-lg font-semibold">
          <NoteText text={arpName} />{" "}
          <span className="font-normal text-muted-foreground">{t.over}</span>{" "}
          <NoteText text={baseName} />{" "}
          <span className="font-normal text-muted-foreground">=</span>{" "}
          <NoteText text={resultName} />
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          <NoteText text={t.sounds[`${base}:${s.id}`]} />
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {arpTones.map((tone) => (
            <span
              key={tone.note}
              className="inline-flex items-center gap-1.5 rounded-control border px-2.5 py-1 text-sm"
              style={{
                background: tone.style.color,
                color: tone.style.labelColor,
                borderColor: tone.style.stroke ?? tone.style.color,
              }}
            >
              <span className="font-medium">
                <NoteText text={tone.note} />
              </span>
              <span className="font-mono text-xs opacity-80">
                <NoteText text={tone.degree} />
              </span>
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          <NoteText text={t.legend(baseName)} />
        </p>
      </div>

      {view === "full" ? (
        <Fretboard
          frets={FRET_COUNT}
          startFret={0}
          markers={buildMarkers(
            getFullNeckArpeggio(s.quality, arpRoot, FRET_COUNT, 0),
            base,
            s,
            speller,
            labelMode,
          )}
          caption={t.captionFull(arpName, baseName)}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {getCagedShapes(s.quality, arpRoot).map((shape) => {
            const spanFrets = shape.maxFret - shape.minFret + 3;
            const displayStart = Math.max(0, shape.minFret - 2);
            return (
              <Fretboard
                key={shape.name}
                frets={Math.max(5, spanFrets)}
                startFret={displayStart}
                markers={buildMarkers(shape.markers, base, s, speller, labelMode)}
                caption={t.captionShape(arpName, shape.name)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
