"use client";

import { useState, useEffect } from "react";
import { usePracticeNote } from "@/lib/use-practice-note";
import {
  KEY_OPTIONS,
  QUALITY_LABELS,
  QUALITY_FAMILIES,
  CHORD_COLORS,
  STRING_SETS,
  allDrop2Positions,
  computeDrop2Voicing,
  chordSpeller,
  getChordColor,
  resolveChordTones,
  lowestFret,
  type ChordQuality,
  type Voicing,
} from "@/lib/music";
import { NoteText } from "@/components/note-text";
import { VoicingDiagram } from "./voicing-diagram";
import { drop2DiagramMarks, drop2Messages } from "./drop-2-shared";
import {
  ChipGroup,
  NoteGrid,
  SegmentedControl,
  StringSetControl,
  ToggleSwitch,
  ControlBar,
} from "./control-group";
import { defineMessages } from "@/lib/i18n";
import { useMessages } from "@/components/locale-provider";

const messages = defineMessages({
  en: {
    color: "Color",
    basic: "Basic",
    all: "All",
    view: "View",
    inversions: "Inversions",
    fullNeck: "Full neck",
    fret: (n: number) => `fr ${n}`,
    rootless:
      "Rootless voicing — the 9 takes the root's place; the bass or the harmonic context supplies the root.",
  },
  pt: {
    color: "Cor",
    basic: "Básico",
    all: "Todos",
    view: "Visualização",
    inversions: "Inversões",
    fullNeck: "Braço inteiro",
    fret: (n: number) => `casa ${n}`,
    rootless:
      "Voicing sem fundamental — a 9 ocupa o lugar da fundamental; o baixo ou o contexto harmônico fornece a fundamental.",
  },
  es: {
    color: "Color",
    basic: "Básico",
    all: "Todos",
    view: "Vista",
    inversions: "Inversiones",
    fullNeck: "Mástil completo",
    fret: (n: number) => `traste ${n}`,
    rootless:
      "Voicing sin fundamental — la 9 ocupa el lugar de la fundamental; el bajo o el contexto armónico aporta la fundamental.",
  },
});

const ALL_SETS = -1;
const BASIC = "";

type View = "inversions" | "neck";

export function Drop2Explorer() {
  const t = useMessages(messages);
  const s = useMessages(drop2Messages);
  const [practiceNote, setPracticeNote] = usePracticeNote();
  const [root, setRootLocal] = useState(0);

  const setRoot = (n: number) => {
    setRootLocal(n);
    setPracticeNote(n);
  };

  useEffect(() => {
    if (practiceNote !== null) setRootLocal(practiceNote);
  }, [practiceNote]);
  const [quality, setQualityState] = useState<ChordQuality>("maj7");
  const [color, setColor] = useState(BASIC);
  const [stringSet, setStringSet] = useState(1);
  const [view, setView] = useState<View>("inversions");
  const [showNotes, setShowNotes] = useState(false);

  const setQuality = (q: ChordQuality) => {
    setQualityState(q);
    setColor(BASIC);
  };

  const colorId = color || undefined;
  const colors = CHORD_COLORS[quality] ?? [];
  const speller = chordSpeller(root, quality, undefined, colorId);
  const chordName = speller.root + (getChordColor(quality, colorId)?.suffix ?? QUALITY_LABELS[quality]);
  const tones = resolveChordTones(quality, colorId);

  const setsToShow = stringSet === ALL_SETS ? [0, 1, 2] : [stringSet];

  const voicingsFor = (ss: number): Voicing[] =>
    view === "neck"
      ? allDrop2Positions(root, quality, ss, colorId)
      : [0, 1, 2, 3]
          .map((inv) => computeDrop2Voicing(root, quality, inv, ss, colorId))
          .sort((a, b) => a.midi[a.midi.length - 1] - b.midi[b.midi.length - 1]);

  return (
    <div className="my-8">
      <ControlBar>
        <NoteGrid
          label={s.root}
          options={KEY_OPTIONS.map((k) => ({ label: k.name, value: k.value }))}
          value={root}
          onChange={setRoot}
        />

        {QUALITY_FAMILIES.map((family) => (
          <ChipGroup
            key={family.label}
            label={s.qualityFamilies[family.label] ?? family.label}
            options={family.qualities.map((q) => ({ label: QUALITY_LABELS[q], value: q }))}
            value={quality}
            onChange={setQuality}
          />
        ))}

        {colors.length > 0 && (
          <ChipGroup
            label={t.color}
            options={[
              { label: t.basic, value: BASIC },
              ...colors.map((c) => ({ label: c.suffix, value: c.id })),
            ]}
            value={color}
            onChange={setColor}
          />
        )}

        <StringSetControl
          label={s.strings}
          options={[
            ...STRING_SETS.map((set, i) => ({ label: set.label, value: i })),
            { label: t.all, value: ALL_SETS },
          ]}
          value={stringSet}
          onChange={setStringSet}
        />

        <SegmentedControl
          label={t.view}
          options={[
            { label: t.inversions, value: "inversions" as const },
            { label: t.fullNeck, value: "neck" as const },
          ]}
          value={view}
          onChange={setView}
        />

        <ToggleSwitch
          labelOff={s.intervals}
          labelOn={s.notes}
          value={showNotes}
          onChange={setShowNotes}
        />
      </ControlBar>

      <p className="mb-6 text-sm text-muted-foreground">
        <strong className="text-foreground">
          <NoteText text={chordName} />
        </strong>{" "}
        ={" "}
        {tones.intervals.map((iv, i) => (
          <span key={i}>
            {i > 0 && " · "}
            <NoteText text={tones.labels[i]} /> (<NoteText text={speller.spell(iv)} />)
          </span>
        ))}
        {colorId && !tones.intervals.includes(0) && (
          <span className="block mt-1 text-xs">
            {t.rootless}
          </span>
        )}
      </p>

      {setsToShow.map((ss) => (
        <section key={ss} className="mb-6">
          {setsToShow.length > 1 && (
            <h4 className="mb-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              {s.stringsHeading(STRING_SETS[ss].label)}
            </h4>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center">
            {voicingsFor(ss).map((v) => {
              const marks = drop2DiagramMarks(v, ss, speller, showNotes);
              return (
                <VoicingDiagram
                  key={v.frets.join(",")}
                  name={chordName}
                  subtitle={
                    view === "neck"
                      ? `${s.inversionNames[v.inversionIndex]} · ${t.fret(lowestFret(v))}`
                      : s.inversionNames[v.inversionIndex]
                  }
                  frets={v.frets}
                  labels={marks.labels}
                  highlights={marks.highlights}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
