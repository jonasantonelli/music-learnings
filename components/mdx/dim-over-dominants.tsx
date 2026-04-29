"use client";

import { useEffect, useState } from "react";
import { usePracticeNote } from "@/lib/use-practice-note";
import { KEY_OPTIONS, noteName } from "@/lib/music";
import { Fretboard } from "./fretboard";
import { ControlBar, NoteGrid } from "./control-group";

const TARGET_INTERVALS = [1, 4, 7, 10] as const;

const INTERVAL_LABEL: Record<number, string> = {
  1: "♭9",
  4: "3",
  7: "5",
  10: "♭7",
};

// Fretboard string numbering: 1 = high e ... 6 = low E.
// Open-string pitch classes for strings 2 (B), 3 (G), 4 (D).
const STRING_OPEN_PC: Record<number, number> = {
  2: 11,
  3: 7,
  4: 2,
};

const STRING_NUMBERS = [2, 3, 4] as const;
const FRET_COUNT = 15;

type Marker = {
  string: number;
  fret: number;
  label: string;
  color?: string;
  labelColor?: string;
};

function buildMarkers(root: number): Marker[] {
  const targets = new Set<number>(TARGET_INTERVALS);
  const markers: Marker[] = [];
  for (const stringNum of STRING_NUMBERS) {
    const openPc = STRING_OPEN_PC[stringNum];
    for (let fret = 1; fret <= FRET_COUNT; fret++) {
      const interval = ((openPc + fret - root) % 12 + 12) % 12;
      if (!targets.has(interval)) continue;
      const isB9 = interval === 1;
      markers.push({
        string: stringNum,
        fret,
        label: INTERVAL_LABEL[interval],
        color: isB9 ? "var(--accent-9)" : "currentColor",
        labelColor: isB9 ? "var(--accent-contrast)" : undefined,
      });
    }
  }
  return markers;
}

export function DimOverDominants() {
  const [practiceNote, setPracticeNote] = usePracticeNote();
  const [root, setRootLocal] = useState(0);

  const setRoot = (n: number) => {
    setRootLocal(n);
    setPracticeNote(n);
  };

  useEffect(() => {
    if (practiceNote !== null) setRootLocal(practiceNote);
  }, [practiceNote]);

  const rootName = noteName(root, root);
  const dimRootName = noteName((root + 1) % 12, root);
  const caption = `${rootName}7♭9 — ${dimRootName}°7 arpeggio on strings 2–3–4`;

  return (
    <div className="my-8">
      <ControlBar>
        <NoteGrid
          label="V7 Root"
          options={KEY_OPTIONS.map((k) => ({ label: k.name, value: k.value }))}
          value={root}
          onChange={setRoot}
        />
      </ControlBar>

      <Fretboard
        frets={FRET_COUNT}
        startFret={0}
        markers={buildMarkers(root)}
        caption={caption}
      />
    </div>
  );
}
