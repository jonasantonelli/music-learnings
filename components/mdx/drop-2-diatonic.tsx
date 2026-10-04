"use client";

import { useState, useEffect, useMemo } from "react";
import { usePracticeNote } from "@/lib/use-practice-note";
import {
  KEY_OPTIONS,
  STRING_SETS,
  HARMONIZED_SCALES,
  diatonicDrop2Run,
  chordLabel,
  chordSpeller,
  noteName,
  type HarmonizedScaleId,
} from "@/lib/music";
import { VoicingDiagram } from "./voicing-diagram";
import { drop2DiagramMarks, drop2Messages } from "./drop-2-shared";
import {
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
    scale: "Scale",
    bassNote: "Bass note",
    everyChordIn: "Every chord in",
    stepsUp: "— each voice steps up to the next note of the scale.",
  },
  pt: {
    scale: "Escala",
    bassNote: "Nota no baixo",
    everyChordIn: "Todos os acordes em",
    stepsUp: "— cada voz sobe para a próxima nota da escala.",
  },
  es: {
    scale: "Escala",
    bassNote: "Nota en el bajo",
    everyChordIn: "Todos los acordes en",
    stepsUp: "— cada voz sube a la siguiente nota de la escala.",
  },
});

export function Drop2Diatonic() {
  const t = useMessages(messages);
  const s = useMessages(drop2Messages);
  const [practiceNote, setPracticeNote] = usePracticeNote();
  const [key, setKeyLocal] = useState(0);

  const setKey = (n: number) => {
    setKeyLocal(n);
    setPracticeNote(n);
  };

  useEffect(() => {
    if (practiceNote !== null) setKeyLocal(practiceNote);
  }, [practiceNote]);
  const [scale, setScale] = useState<HarmonizedScaleId>("major");
  const [inversion, setInversion] = useState(0);
  const [stringSet, setStringSet] = useState(1);
  const [showNotes, setShowNotes] = useState(false);

  const run = useMemo(
    () => diatonicDrop2Run(key, scale, inversion, stringSet),
    [key, scale, inversion, stringSet],
  );

  return (
    <div className="my-8">
      <ControlBar>
        <NoteGrid
          label={s.key}
          options={KEY_OPTIONS.map((k) => ({ label: k.name, value: k.value }))}
          value={key}
          onChange={setKey}
        />

        <SegmentedControl
          label={t.scale}
          options={HARMONIZED_SCALES.map((sc) => ({
            label: s.scales[sc.id] ?? sc.label,
            value: sc.id,
          }))}
          value={scale}
          onChange={setScale}
        />

        <SegmentedControl
          label={t.bassNote}
          options={["R", "3", "5", "7"].map((label, i) => ({ label, value: i }))}
          value={inversion}
          onChange={setInversion}
        />

        <StringSetControl
          label={s.strings}
          options={STRING_SETS.map((set, i) => ({ label: set.label, value: i }))}
          value={stringSet}
          onChange={setStringSet}
        />

        <ToggleSwitch
          labelOff={s.intervals}
          labelOn={s.notes}
          value={showNotes}
          onChange={setShowNotes}
        />
      </ControlBar>

      <p className="mb-4 text-sm text-muted-foreground">
        {t.everyChordIn} <strong>{s.inversionNames[inversion]}</strong> {t.stepsUp}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 justify-items-center">
        {run.map(({ chord, voicing }, i) => {
          const speller = chordSpeller(chord.root, chord.quality, noteName(chord.root, key));
          const marks = drop2DiagramMarks(voicing, stringSet, speller, showNotes);
          const droppedOctave = i > 0 && voicing.midi[0] < run[i - 1].voicing.midi[0];
          return (
            <VoicingDiagram
              key={i}
              name={chordLabel(chord.root, chord.quality, key)}
              subtitle={droppedOctave ? `${chord.degree} · 8va↓` : chord.degree}
              frets={voicing.frets}
              labels={marks.labels}
              highlights={marks.highlights}
            />
          );
        })}
      </div>
    </div>
  );
}
