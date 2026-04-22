"use client";

import { useEffect, useState } from "react";
import { usePracticeNote } from "@/lib/use-practice-note";
import { KEY_OPTIONS, noteName } from "@/lib/music";
import {
  SCALES,
  SCALE_INTERVAL_LABELS,
  get3NPSPositions,
  getCAGEDScalePositions,
  getFullNeckMarkers,
  type ScaleMarker,
} from "@/lib/scales";
import { Fretboard } from "./fretboard";
import {
  ControlBar,
  NoteGrid,
  SegmentedControl,
  ToggleSwitch,
} from "./control-group";

type ScaleExplorerProps = {
  scale: string;
};

type ViewMode = "full" | "position" | "caged";

export function ScaleExplorer({ scale: scaleSlug }: ScaleExplorerProps) {
  const [practiceNote, setPracticeNote] = usePracticeNote();
  const [root, setRootLocal] = useState(0);
  const [view, setView] = useState<ViewMode>("full");
  const [position, setPosition] = useState(1);
  const [cagedIndex, setCagedIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(false);

  const setRoot = (n: number) => {
    setRootLocal(n);
    setPracticeNote(n);
  };

  useEffect(() => {
    if (practiceNote !== null) setRootLocal(practiceNote);
  }, [practiceNote]);

  const definition = SCALES[scaleSlug];
  if (!definition) {
    return (
      <div className="my-8 rounded-3xl border border-border bg-card p-4 text-sm text-muted-foreground">
        Unknown scale: <code>{scaleSlug}</code>
      </div>
    );
  }

  const labelFor = (marker: ScaleMarker): string => {
    if (showNotes) {
      return noteName((root + marker.intervalPc) % 12, root);
    }
    return SCALE_INTERVAL_LABELS[marker.intervalPc] ?? String(marker.intervalPc);
  };

  let scaleMarkers: ScaleMarker[];
  let caption: string;

  if (view === "full") {
    scaleMarkers = getFullNeckMarkers(definition, root, 15, 0);
    caption = `${noteName(root, root)} ${definition.name} — full neck`;
  } else if (view === "caged") {
    const shapes = getCAGEDScalePositions(definition, root);
    const chosen = shapes[cagedIndex] ?? shapes[0];
    scaleMarkers = chosen?.markers ?? [];
    caption = `${noteName(root, root)} ${definition.name} — ${chosen?.name ?? "C"} shape (CAGED)`;
  } else {
    const positions = get3NPSPositions(definition, root);
    const safeIndex = Math.min(position, positions.length) - 1;
    const chosen = positions[safeIndex];
    scaleMarkers = chosen?.markers ?? [];
    caption = `${noteName(root, root)} ${definition.name} — position ${position} (3NPS)`;
  }

  const fretboardMarkers = scaleMarkers.map((m) => {
    const isRoot = m.intervalPc === 0;
    return {
      string: m.string,
      fret: m.fret,
      label: labelFor(m),
      color: isRoot ? "var(--accent-9)" : undefined,
      labelColor: isRoot ? "var(--accent-contrast)" : undefined,
    };
  });

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
          label="View"
          options={[
            { label: "Full neck", value: "full" },
            { label: "3NPS", value: "position" },
            { label: "CAGED", value: "caged" },
          ]}
          value={view}
          onChange={setView}
          size="sm"
        />

        {view === "caged" && (
          <SegmentedControl
            label="Shape"
            options={getCAGEDScalePositions(definition, root).map((s, i) => ({
              label: s.name,
              value: i,
            }))}
            value={cagedIndex}
            onChange={setCagedIndex}
            size="sm"
          />
        )}

        {view === "position" && (
          <SegmentedControl
            label="Position"
            options={definition.intervals.map((_, i) => ({
              label: String(i + 1),
              value: i + 1,
            }))}
            value={position}
            onChange={setPosition}
            size="sm"
          />
        )}

        <ToggleSwitch
          labelOff="Intervals"
          labelOn="Notes"
          value={showNotes}
          onChange={setShowNotes}
        />
      </ControlBar>

      <Fretboard frets={15} startFret={0} markers={fretboardMarkers} caption={caption} />
    </div>
  );
}
