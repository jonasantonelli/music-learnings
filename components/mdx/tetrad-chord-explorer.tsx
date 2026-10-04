"use client";

import { useState, useEffect } from "react";
import { usePracticeNote } from "@/lib/use-practice-note";
import { KEY_OPTIONS, keyName, type DegreeSpeller } from "@/lib/music";
import {
  CHORD_FAMILIES,
  ROOT_STRING_OPTIONS,
  TETRAD_CHORD_LABELS,
  TETRAD_INTERVAL_LABELS,
  chordFamilyName,
  computeTetradVoicing,
  rootStringLabel,
  tetradSpeller,
  type TetradChordQuality,
  type TetradVoicing,
} from "@/lib/tetrad-chords";
import { defineMessages } from "@/lib/i18n";
import { useLocale, useMessages } from "@/components/locale-provider";
import { VoicingDiagram } from "./voicing-diagram";
import {
  NoteGrid,
  SegmentedControl,
  ToggleSwitch,
  ControlBar,
} from "./control-group";

const messages = defineMessages({
  en: {
    root: "Root",
    rootString: "Root String",
    intervals: "Intervals",
    notes: "Notes",
  },
  pt: {
    root: "Fundamental",
    rootString: "Corda da fundamental",
    intervals: "Intervalos",
    notes: "Notas",
  },
  es: {
    root: "Fundamental",
    rootString: "Cuerda de la fundamental",
    intervals: "Intervalos",
    notes: "Notas",
  },
});

function buildLabels(
  voicing: TetradVoicing,
  speller: DegreeSpeller,
  showNotes: boolean,
): (string | null)[] {
  const labels: (string | null)[] = [null, null, null, null, null, null];
  let intervalIdx = 0;
  for (let si = 0; si < 6; si++) {
    if (voicing.frets[si] === null) continue;
    const interval = voicing.intervals[intervalIdx];
    labels[si] = showNotes
      ? speller.spell(interval)
      : (TETRAD_INTERVAL_LABELS[interval] ?? String(interval));
    intervalIdx++;
  }
  return labels;
}

function buildHighlights(voicing: TetradVoicing): (boolean | null)[] {
  const highlights: (boolean | null)[] = [null, null, null, null, null, null];
  let intervalIdx = 0;
  for (let si = 0; si < 6; si++) {
    if (voicing.frets[si] === null) continue;
    highlights[si] = voicing.intervals[intervalIdx] === 0;
    intervalIdx++;
  }
  return highlights;
}

export function TetradChordExplorer() {
  const [practiceNote, setPracticeNote] = usePracticeNote();
  const [root, setRootLocal] = useState(0);
  const [rootString, setRootString] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const locale = useLocale();
  const t = useMessages(messages);

  const setRoot = (n: number) => {
    setRootLocal(n);
    setPracticeNote(n);
  };

  useEffect(() => {
    if (practiceNote !== null) setRootLocal(practiceNote);
  }, [practiceNote]);

  return (
    <div className="my-8">
      <ControlBar>
        <NoteGrid
          label={t.root}
          options={KEY_OPTIONS.map((k) => ({ label: k.name, value: k.value }))}
          value={root}
          onChange={setRoot}
        />

        <SegmentedControl
          label={t.rootString}
          options={ROOT_STRING_OPTIONS.map((s) => ({
            label: rootStringLabel(s.value, locale),
            value: s.value,
          }))}
          value={rootString}
          onChange={setRootString}
          size="sm"
        />

        <ToggleSwitch
          labelOff={t.intervals}
          labelOn={t.notes}
          value={showNotes}
          onChange={setShowNotes}
        />
      </ControlBar>

      {CHORD_FAMILIES.map((family) => (
        <FamilyGroup
          key={family.id}
          familyName={chordFamilyName(family.id, locale)}
          qualities={family.qualities}
          root={root}
          rootString={rootString}
          showNotes={showNotes}
        />
      ))}
    </div>
  );
}

function FamilyGroup({
  familyName,
  qualities,
  root,
  rootString,
  showNotes,
}: {
  familyName: string;
  qualities: TetradChordQuality[];
  root: number;
  rootString: number;
  showNotes: boolean;
}) {
  const voicings: { quality: TetradChordQuality; voicing: TetradVoicing }[] = [];

  for (const q of qualities) {
    const v = computeTetradVoicing(root, q, rootString);
    if (v) voicings.push({ quality: q, voicing: v });
  }

  if (voicings.length === 0) return null;

  return (
    <section className="mb-10">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        {familyName}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 justify-items-center">
        {voicings.map(({ quality, voicing }) => {
          const speller = tetradSpeller(root, quality, keyName(root));
          return (
            <VoicingDiagram
              key={quality}
              name={speller.root + TETRAD_CHORD_LABELS[quality]}
              frets={voicing.frets}
              labels={buildLabels(voicing, speller, showNotes)}
              highlights={buildHighlights(voicing)}
            />
          );
        })}
      </div>
    </section>
  );
}
