"use client";

import { useState, useEffect } from "react";
import { usePracticeNote } from "@/lib/use-practice-note";
import {
  KEY_OPTIONS,
  QUALITY_LABELS,
  STRING_SETS,
  INVERSION_NAMES,
  INTERVAL_LABELS,
  computeDrop2Voicing,
  noteName,
  type ChordQuality,
  type Voicing,
} from "@/lib/music";
import { VoicingDiagram } from "./voicing-diagram";
import {
  NoteGrid,
  SegmentedControl,
  StringSetControl,
  ToggleSwitch,
  ControlBar,
} from "./control-group";

const QUALITIES: ChordQuality[] = [
  "maj7",
  "m7",
  "7",
  "m7b5",
  "dim7",
  "mMaj7",
];

function buildLabels(
  voicing: Voicing,
  root: number,
  stringSetIndex: number,
  showNotes: boolean,
): (string | null)[] {
  const labels: (string | null)[] = [null, null, null, null, null, null];
  const indices = STRING_SETS[stringSetIndex].indices;
  for (let i = 0; i < 4; i++) {
    const si = indices[i];
    labels[si] = showNotes
      ? noteName((root + voicing.intervals[i]) % 12, root)
      : (INTERVAL_LABELS[voicing.intervals[i]] ?? String(voicing.intervals[i]));
  }
  return labels;
}

function buildHighlights(voicing: Voicing, stringSetIndex: number): (boolean | null)[] {
  const highlights: (boolean | null)[] = [null, null, null, null, null, null];
  const indices = STRING_SETS[stringSetIndex].indices;
  for (let i = 0; i < 4; i++) {
    highlights[indices[i]] = voicing.toneIndices[i] === 0;
  }
  return highlights;
}

export function Drop2Explorer() {
  const practiceNote = usePracticeNote();
  const [root, setRoot] = useState(0);

  useEffect(() => {
    if (practiceNote !== null) setRoot(practiceNote);
  }, [practiceNote]);
  const [quality, setQuality] = useState<ChordQuality>("maj7");
  const [stringSet, setStringSet] = useState(1);
  const [showNotes, setShowNotes] = useState(false);

  const voicings = [0, 1, 2, 3]
    .map((inv) => computeDrop2Voicing(root, quality, inv, stringSet))
    .sort((a, b) => a.midi[a.midi.length - 1] - b.midi[b.midi.length - 1]);

  const chordName = `${noteName(root, root)}${QUALITY_LABELS[quality]}`;

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
          label="Quality"
          options={QUALITIES.map((q) => ({ label: QUALITY_LABELS[q], value: q }))}
          value={quality}
          onChange={setQuality}
          size="sm"
        />

        <StringSetControl
          label="Strings"
          options={STRING_SETS.map((s, i) => ({ label: s.label, value: i }))}
          value={stringSet}
          onChange={setStringSet}
        />

        <ToggleSwitch
          labelOff="Intervals"
          labelOn="Notes"
          value={showNotes}
          onChange={setShowNotes}
        />
      </ControlBar>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 justify-items-center">
        {voicings.map((v, i) => (
          <VoicingDiagram
            key={i}
            name={chordName}
            subtitle={INVERSION_NAMES[v.inversionIndex]}
            frets={v.frets}
            labels={buildLabels(v, root, stringSet, showNotes)}
            highlights={buildHighlights(v, stringSet)}
          />
        ))}
      </div>
    </div>
  );
}
