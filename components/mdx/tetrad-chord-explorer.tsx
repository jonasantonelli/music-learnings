"use client";

import { useState, useEffect } from "react";
import { usePracticeNote } from "@/lib/use-practice-note";
import { KEY_OPTIONS, noteName } from "@/lib/music";
import {
  CHORD_FAMILIES,
  ROOT_STRING_OPTIONS,
  TETRAD_INTERVAL_LABELS,
  computeTetradVoicing,
  tetradChordLabel,
  type TetradChordQuality,
  type TetradVoicing,
} from "@/lib/tetrad-chords";
import { VoicingDiagram } from "./voicing-diagram";
import {
  NoteGrid,
  SegmentedControl,
  ToggleSwitch,
  ControlBar,
} from "./control-group";

function buildLabels(
  voicing: TetradVoicing,
  root: number,
  showNotes: boolean,
): (string | null)[] {
  const labels: (string | null)[] = [null, null, null, null, null, null];
  let intervalIdx = 0;
  for (let si = 0; si < 6; si++) {
    if (voicing.frets[si] === null) continue;
    const interval = voicing.intervals[intervalIdx];
    labels[si] = showNotes
      ? noteName((root + interval) % 12, root)
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
          label="Root"
          options={KEY_OPTIONS.map((k) => ({ label: k.name, value: k.value }))}
          value={root}
          onChange={setRoot}
        />

        <SegmentedControl
          label="Root String"
          options={ROOT_STRING_OPTIONS.map((s) => ({ label: s.label, value: s.value }))}
          value={rootString}
          onChange={setRootString}
          size="sm"
        />

        <ToggleSwitch
          labelOff="Intervals"
          labelOn="Notes"
          value={showNotes}
          onChange={setShowNotes}
        />
      </ControlBar>

      {CHORD_FAMILIES.map((family) => (
        <FamilyGroup
          key={family.name}
          familyName={family.name}
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
        {voicings.map(({ quality, voicing }) => (
          <VoicingDiagram
            key={quality}
            name={tetradChordLabel(root, quality)}
            frets={voicing.frets}
            labels={buildLabels(voicing, root, showNotes)}
            highlights={buildHighlights(voicing)}
          />
        ))}
      </div>
    </section>
  );
}
