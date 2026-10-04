"use client";

import { useEffect, useState } from "react";
import { usePracticeNote } from "@/lib/use-practice-note";
import { useStoredState } from "@/lib/use-stored-state";
import { KEY_OPTIONS, degreeSpeller, keyName } from "@/lib/music";
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
const VIEW_MODES: ViewMode[] = ["full", "position", "caged"];

export function ScaleExplorer({ scale: scaleSlug }: ScaleExplorerProps) {
  const [practiceNote, setPracticeNote] = usePracticeNote();
  const [root, setRootLocal] = useState(0);
  // View and label choices persist across visits and scale pages.
  const [storedView, setView] = useStoredState<ViewMode>("scale-explorer:view", "full");
  const [storedPosition, setPosition] = useStoredState("scale-explorer:position", 1);
  const [cagedIndex, setCagedIndex] = useState(0);
  const [storedShowNotes, setShowNotes] = useStoredState("scale-explorer:notes", true);
  const [storedShowFingers, setShowFingers] = useStoredState("scale-explorer:fingers", false);
  const view = VIEW_MODES.includes(storedView) ? storedView : "full";
  const position =
    Number.isInteger(storedPosition) && storedPosition >= 1 ? storedPosition : 1;
  const showNotes = storedShowNotes !== false;
  const showFingers = storedShowFingers === true;

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
      <div className="my-8 rounded-card border border-border bg-card p-4 text-sm text-muted-foreground">
        Unknown scale: <code>{scaleSlug}</code>
      </div>
    );
  }

  const passingTones = new Set(definition.passingTones ?? []);
  const colorTones = new Set(definition.colorTones ?? []);

  // Spell notes by scale degree so altered tones keep their letter
  // (C Dorian's ♭3 is E♭, not D♯). The root keeps the picker's spelling.
  const speller = degreeSpeller(
    root,
    Object.fromEntries(
      definition.intervals.map((iv, i) => [iv, definition.degrees[i]]),
    ),
    keyName(root),
  );

  const labelFor = (marker: ScaleMarker): string => {
    if (showNotes) {
      return speller.spell(marker.intervalPc);
    }
    return (
      definition.labels?.[marker.intervalPc] ??
      SCALE_INTERVAL_LABELS[marker.intervalPc] ??
      String(marker.intervalPc)
    );
  };

  let scaleMarkers: (ScaleMarker & { finger?: number })[];
  let caption: string;
  let frets = 15;

  if (view === "full") {
    scaleMarkers = getFullNeckMarkers(definition, root, 15, 0);
    caption = `${speller.root} ${definition.name} — full neck`;
  } else if (view === "caged") {
    const shapes = getCAGEDScalePositions(definition, root);
    const chosen = shapes[cagedIndex] ?? shapes[0];
    scaleMarkers = chosen?.markers ?? [];
    caption = `${speller.root} ${definition.name} — ${chosen?.name ?? "C"} shape (CAGED)`;
  } else {
    const positions = get3NPSPositions(definition, root);
    const safeIndex = Math.min(position, positions.length) - 1;
    const chosen = positions[safeIndex];
    scaleMarkers = chosen?.markers ?? [];
    caption = `${speller.root} ${definition.name} — position ${position} (3NPS)`;
    // Positions near the nut fall back an octave up and can pass fret 15.
    frets = Math.max(frets, chosen?.maxFret ?? 0);
  }

  const fretboardMarkers = scaleMarkers.map((m) => {
    const isRoot = m.intervalPc === 0;
    const isPassing = passingTones.has(m.intervalPc);
    const isColor = colorTones.has(m.intervalPc);
    // Thirds and sevenths are the guide tones that define the chord quality.
    const isGuide = [3, 4, 10, 11].includes(m.intervalPc);
    const role = isRoot
      ? "root"
      : isPassing
        ? "passing"
        : isColor
          ? "color"
          : isGuide
          ? "guide"
          : "tone";
    return {
      string: m.string,
      fret: m.fret,
      label: showFingers && m.finger ? String(m.finger) : labelFor(m),
      color: `var(--degree-${role}-bg)`,
      labelColor: `var(--degree-${role}-fg)`,
      stroke:
        role === "guide" || role === "tone" || role === "color"
          ? `var(--degree-${role}-border)`
          : undefined,
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
            options={get3NPSPositions(definition, root).map((p) => ({
              label: String(p.index),
              value: p.index,
            }))}
            value={position}
            onChange={setPosition}
            size="sm"
          />
        )}

        {view === "position" && (
          <ToggleSwitch
            labelOff="Degrees"
            labelOn="Fingers"
            value={showFingers}
            onChange={setShowFingers}
          />
        )}

        <ToggleSwitch
          labelOff="Intervals"
          labelOn="Notes"
          value={showNotes}
          onChange={setShowNotes}
        />
      </ControlBar>

      <Fretboard frets={frets} startFret={0} markers={fretboardMarkers} caption={caption} />
      <DegreeLegend
        showPassing={passingTones.size > 0}
        colorLabel={
          colorTones.size > 0
            ? `Color tone (${definition.intervals
                .map((iv, i) => (colorTones.has(iv) ? definition.degrees[i] : null))
                .filter(Boolean)
                .join(", ")})`
            : undefined
        }
      />
    </div>
  );
}

const LEGEND = [
  { role: "root", label: "Root" },
  { role: "guide", label: "Guide tones (3rd, 7th)" },
  { role: "color", label: "Color tone" },
  { role: "tone", label: "Scale tone" },
  { role: "passing", label: "Passing tone" },
] as const;

function DegreeLegend({
  showPassing,
  colorLabel,
}: {
  showPassing: boolean;
  colorLabel?: string;
}) {
  const items = LEGEND.filter(
    (l) =>
      (showPassing || l.role !== "passing") && (colorLabel || l.role !== "color"),
  ).map((l) => (l.role === "color" && colorLabel ? { ...l, label: colorLabel } : l));
  return (
    <ul className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
      {items.map((l) => (
        <li key={l.role} className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-3 w-3 rounded-full"
            style={{
              background: `var(--degree-${l.role}-bg)`,
              boxShadow:
                l.role === "guide" || l.role === "tone" || l.role === "color"
                  ? `inset 0 0 0 1.5px var(--degree-${l.role}-border)`
                  : undefined,
            }}
          />
          {l.label}
        </li>
      ))}
    </ul>
  );
}
