"use client";

import { useEffect, useState } from "react";
import { usePracticeNote } from "@/lib/use-practice-note";
import { KEY_OPTIONS, noteName } from "@/lib/music";
import { VoicingDiagram } from "./voicing-diagram";
import { ControlBar, NoteGrid, SegmentedControl } from "./control-group";

const V7_INTERVAL_LABEL: Record<number, string> = {
  1: "♭9",
  4: "3",
  7: "5",
  10: "♭7",
};

// Open string pitch classes, indexed [low E, A, D, G, B, e]
const OPEN_PC = [4, 9, 2, 7, 11, 4];

type StringSetKey = "1-2-3-4" | "2-3-4-5";

const STRING_SET_OPTIONS: { label: string; value: StringSetKey }[] = [
  { label: "1-2-3-4", value: "1-2-3-4" },
  { label: "2-3-4-5", value: "2-3-4-5" },
];

type Shape = {
  // String indices in OPEN_PC, low-to-high. First entry is the bass string.
  strings: number[];
  // Fret offsets from the base fret on the bass string.
  offsets: number[];
};

const SHAPES: Record<StringSetKey, Shape> = {
  // D-G-B-e (top 4): f, f+1, f, f+1
  "1-2-3-4": { strings: [2, 3, 4, 5], offsets: [0, 1, 0, 1] },
  // A-D-G-B: f, f+1, f-1, f+1
  "2-3-4-5": { strings: [1, 2, 3, 4], offsets: [0, 1, -1, 1] },
};

function basesForString(root: number, openPc: number): number[] {
  // Frets on the bass string that land on a dim7 chord tone (♭9, 3, 5, ♭7 of V7).
  return [1, 4, 7, 10]
    .map((interval) => ((root + interval - openPc) + 12) % 12)
    .sort((a, b) => a - b);
}

function buildVoicing(root: number, shape: Shape, base: number) {
  // If any offset would push a string below fret 0, bump the position up an octave.
  let actualBase = base;
  while (shape.offsets.some((off) => actualBase + off < 0)) {
    actualBase += 12;
  }

  const frets: (number | null)[] = [null, null, null, null, null, null];
  const labels: (string | null)[] = [null, null, null, null, null, null];
  const highlights: (boolean | null)[] = [null, null, null, null, null, null];

  for (let i = 0; i < shape.strings.length; i++) {
    const si = shape.strings[i];
    const fret = actualBase + shape.offsets[i];
    frets[si] = fret;
    const pc = (OPEN_PC[si] + fret) % 12;
    const interval = ((pc - root) + 12) % 12;
    labels[si] = V7_INTERVAL_LABEL[interval] ?? "";
    highlights[si] = interval === 1;
  }

  const bassStringIdx = shape.strings[0];
  const bassPc = (OPEN_PC[bassStringIdx] + actualBase) % 12;

  return { frets, labels, highlights, bassPc };
}

export function DimChordPositions() {
  const [practiceNote, setPracticeNote] = usePracticeNote();
  const [root, setRootLocal] = useState(0);
  const [stringSet, setStringSet] = useState<StringSetKey>("1-2-3-4");

  const setRoot = (n: number) => {
    setRootLocal(n);
    setPracticeNote(n);
  };

  useEffect(() => {
    if (practiceNote !== null) setRootLocal(practiceNote);
  }, [practiceNote]);

  const shape = SHAPES[stringSet];
  const bassStringIdx = shape.strings[0];
  const bases = basesForString(root, OPEN_PC[bassStringIdx]);

  const dimRootName = noteName((root + 1) % 12, root);

  return (
    <div className="my-8">
      <ControlBar>
        <NoteGrid
          label="V7 Root"
          options={KEY_OPTIONS.map((k) => ({ label: k.name, value: k.value }))}
          value={root}
          onChange={setRoot}
        />
        <SegmentedControl
          label="Strings"
          options={STRING_SET_OPTIONS}
          value={stringSet}
          onChange={setStringSet}
          size="sm"
        />
      </ControlBar>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 justify-items-center">
        {bases.map((base, i) => {
          const v = buildVoicing(root, shape, base);
          const bassName = noteName(v.bassPc, root);
          return (
            <VoicingDiagram
              key={i}
              name={`${dimRootName}°7`}
              subtitle={`bass: ${bassName}`}
              frets={v.frets}
              labels={v.labels}
              highlights={v.highlights}
            />
          );
        })}
      </div>
    </div>
  );
}
