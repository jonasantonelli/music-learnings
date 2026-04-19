"use client";

import { useEffect, useState } from "react";
import { usePracticeNote } from "@/lib/use-practice-note";
import { KEY_OPTIONS, noteName, QUALITY_SUFFIXES } from "@/lib/music";
import {
  generateWalkingBassLine,
  getProgressionChords,
  type ProgressionType,
  type BassNote,
} from "@/lib/walking-bass";
import { Fretboard } from "./fretboard";
import {
  ControlBar,
  NoteGrid,
  SegmentedControl,
  ToggleSwitch,
} from "./control-group";

const PROGRESSION_OPTIONS: { label: string; value: ProgressionType }[] = [
  { label: "ii-V-I Major", value: "major-251" },
  { label: "ii-V-I Minor", value: "minor-251" },
  { label: "Single chord", value: "single" },
];

const BEAT_COLORS: Record<BassNote["type"], string> = {
  root: "var(--accent-9)",
  "chord-tone": "var(--accent-11)",
  approach: "var(--gray-8)",
};

function buildMarkers(
  notes: BassNote[],
  chordRoot: number,
  key: number,
  showNotes: boolean,
) {
  return notes.map((n) => ({
    string: n.string,
    fret: n.fret,
    label: showNotes
      ? noteName((chordRoot + n.interval) % 12, key)
      : String(n.beat),
    color: BEAT_COLORS[n.type],
    labelColor: n.type === "root" ? "var(--accent-contrast)" : undefined,
  }));
}

export function WalkingBassExplorer() {
  const [practiceNote, setPracticeNote] = usePracticeNote();
  const [key, setKeyLocal] = useState(0);
  const [progression, setProgression] =
    useState<ProgressionType>("major-251");
  const [showNotes, setShowNotes] = useState(false);
  const [patternIndex, setPatternIndex] = useState(0);

  const setKey = (n: number) => {
    setKeyLocal(n);
    setPracticeNote(n);
  };

  useEffect(() => {
    if (practiceNote !== null) setKeyLocal(practiceNote);
  }, [practiceNote]);

  const chords = getProgressionChords(key, progression);

  const lines = chords.map((chord, i) => {
    const nextRoot =
      chords[(i + 1) % chords.length].root;
    return generateWalkingBassLine(
      chord.root,
      chord.quality,
      nextRoot,
      patternIndex,
    );
  });

  return (
    <div className="my-8">
      <ControlBar>
        <NoteGrid
          label="Key"
          options={KEY_OPTIONS.map((k) => ({ label: k.name, value: k.value }))}
          value={key}
          onChange={setKey}
        />

        <SegmentedControl
          label="Progression"
          options={PROGRESSION_OPTIONS}
          value={progression}
          onChange={setProgression}
        />

        <SegmentedControl
          label="Pattern"
          options={[
            { label: "1", value: 0 },
            { label: "2", value: 1 },
            { label: "3", value: 2 },
            { label: "4", value: 3 },
          ]}
          value={patternIndex}
          onChange={setPatternIndex}
        />

        <ToggleSwitch
          labelOff="Beats"
          labelOn="Notes"
          value={showNotes}
          onChange={setShowNotes}
        />
      </ControlBar>

      <div className="mb-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ background: BEAT_COLORS.root }}
          />
          Root
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ background: BEAT_COLORS["chord-tone"] }}
          />
          Chord tone
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ background: BEAT_COLORS.approach }}
          />
          Approach
        </span>
      </div>

      <div
        className={`grid gap-6 ${
          progression === "single"
            ? "grid-cols-1 max-w-md"
            : "sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {lines.map((line, i) => {
          const chord = chords[i];
          const chordName =
            noteName(chord.root, key) + QUALITY_SUFFIXES[chord.quality];
          const frets = line.notes.map((n) => n.fret);
          const minFret = Math.min(...frets);
          const maxFret = Math.max(...frets);
          const spanFrets = maxFret - minFret + 3;
          const displayStart = Math.max(0, minFret - 2);

          return (
            <div key={`${chord.label}-${i}`}>
              <Fretboard
                frets={Math.max(5, spanFrets)}
                startFret={displayStart}
                markers={buildMarkers(line.notes, chord.root, key, showNotes)}
                caption={`${chord.label} — ${chordName}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
