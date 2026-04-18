"use client";

import { useEffect, useState } from "react";
import { usePracticeNote } from "@/lib/use-practice-note";
import { KEY_OPTIONS, noteName } from "@/lib/music";
import {
  ARPEGGIO_SUFFIXES,
  ARPEGGIO_INTERVAL_LABELS,
  getFullNeckArpeggio,
  getCagedShapes,
  type ArpeggioQuality,
  type ArpeggioMarker,
} from "@/lib/arpeggios";
import { Fretboard } from "./fretboard";
import {
  ControlBar,
  NoteGrid,
  SegmentedControl,
  ToggleSwitch,
} from "./control-group";

type ArpeggioExplorerProps = {
  mode: "triads" | "tetrads";
};

const TRIAD_OPTIONS: { label: string; value: ArpeggioQuality }[] = [
  { label: "Major", value: "major" },
  { label: "Minor", value: "minor" },
  { label: "Dim", value: "dim" },
  { label: "Aug", value: "aug" },
];

const TETRAD_OPTIONS: { label: string; value: ArpeggioQuality }[] = [
  { label: "Maj7", value: "maj7" },
  { label: "m7", value: "m7" },
  { label: "Dom7", value: "7" },
  { label: "m7♭5", value: "m7b5" },
  { label: "°7", value: "dim7" },
];

type ViewMode = "full" | "caged";

function markerLabelColor(intervalPc: number): string | undefined {
  return intervalPc === 0 ? "var(--accent-contrast)" : undefined;
}

function buildFretboardMarkers(
  markers: ArpeggioMarker[],
  root: number,
  showNotes: boolean,
) {
  return markers.map((m) => {
    const isRoot = m.intervalPc === 0;
    return {
      string: m.string,
      fret: m.fret,
      label: showNotes
        ? noteName((root + m.intervalPc) % 12, root)
        : ARPEGGIO_INTERVAL_LABELS[m.intervalPc] ?? String(m.intervalPc),
      color: isRoot ? "var(--accent-9)" : "currentColor",
      labelColor: markerLabelColor(m.intervalPc),
    };
  });
}

export function ArpeggioExplorer({ mode }: ArpeggioExplorerProps) {
  const [practiceNote, setPracticeNote] = usePracticeNote();
  const [root, setRootLocal] = useState(0);
  const [quality, setQuality] = useState<ArpeggioQuality>(
    mode === "triads" ? "major" : "maj7",
  );
  const [view, setView] = useState<ViewMode>("full");
  const [showNotes, setShowNotes] = useState(false);

  const setRoot = (n: number) => {
    setRootLocal(n);
    setPracticeNote(n);
  };

  useEffect(() => {
    if (practiceNote !== null) setRootLocal(practiceNote);
  }, [practiceNote]);

  const qualityOptions =
    mode === "triads" ? TRIAD_OPTIONS : TETRAD_OPTIONS;

  const rootName = noteName(root, root);
  const suffix = ARPEGGIO_SUFFIXES[quality];

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
          options={qualityOptions}
          value={quality}
          onChange={(v) => setQuality(v as ArpeggioQuality)}
        />

        <SegmentedControl
          label="View"
          options={[
            { label: "Full neck", value: "full" as ViewMode },
            { label: "CAGED", value: "caged" as ViewMode },
          ]}
          value={view}
          onChange={setView}
        />

        <ToggleSwitch
          labelOff="Intervals"
          labelOn="Notes"
          value={showNotes}
          onChange={setShowNotes}
        />
      </ControlBar>

      {view === "full" ? (
        <Fretboard
          frets={15}
          startFret={0}
          markers={buildFretboardMarkers(
            getFullNeckArpeggio(quality, root, 15, 0),
            root,
            showNotes,
          )}
          caption={`${rootName}${suffix} arpeggio — full neck`}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {getCagedShapes(quality, root).map((shape) => {
            const spanFrets = shape.maxFret - shape.minFret + 3;
            const displayStart = Math.max(0, shape.minFret - 2);
            return (
              <div key={shape.name}>
                <Fretboard
                  frets={Math.max(5, spanFrets)}
                  startFret={displayStart}
                  markers={buildFretboardMarkers(
                    shape.markers,
                    root,
                    showNotes,
                  )}
                  caption={`${shape.name} shape`}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
