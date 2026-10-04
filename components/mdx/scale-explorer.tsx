"use client";

import { useEffect, useState } from "react";
import { usePracticeNote } from "@/lib/use-practice-note";
import { KEY_OPTIONS, degreeSpeller } from "@/lib/music";
import {
  SCALES,
  SCALE_INTERVAL_LABELS,
  get3NPSPositions,
  getCAGEDScalePositions,
  getFullNeckMarkers,
  scaleName,
  type ScaleMarker,
} from "@/lib/scales";
import { defineMessages } from "@/lib/i18n";
import { useLocale, useMessages } from "@/components/locale-provider";
import { Fretboard } from "./fretboard";
import {
  ControlBar,
  NoteGrid,
  SegmentedControl,
  ToggleSwitch,
} from "./control-group";

const messages = defineMessages({
  en: {
    unknownScale: "Unknown scale:",
    root: "Root",
    view: "View",
    fullNeck: "Full neck",
    shape: "Shape",
    position: "Position",
    degrees: "Degrees",
    fingers: "Fingers",
    intervals: "Intervals",
    notes: "Notes",
    captionFull: (scale: string) => `${scale} — full neck`,
    captionCaged: (scale: string, shape: string) => `${scale} — ${shape} shape (CAGED)`,
    captionPosition: (scale: string, n: number) => `${scale} — position ${n} (3NPS)`,
    legendRoot: "Root",
    legendGuide: "Guide tones (3rd, 7th)",
    legendColor: "Color tone",
    legendColorWith: (degrees: string) => `Color tone (${degrees})`,
    legendTone: "Scale tone",
    legendPassing: "Passing tone",
  },
  pt: {
    unknownScale: "Escala desconhecida:",
    root: "Fundamental",
    view: "Visualização",
    fullNeck: "Braço inteiro",
    shape: "Forma",
    position: "Posição",
    degrees: "Graus",
    fingers: "Dedos",
    intervals: "Intervalos",
    notes: "Notas",
    captionFull: (scale: string) => `${scale} — braço inteiro`,
    captionCaged: (scale: string, shape: string) => `${scale} — forma de ${shape} (CAGED)`,
    captionPosition: (scale: string, n: number) => `${scale} — posição ${n} (3NPS)`,
    legendRoot: "Fundamental",
    legendGuide: "Notas-guia (3ª, 7ª)",
    legendColor: "Nota característica",
    legendColorWith: (degrees: string) => `Nota característica (${degrees})`,
    legendTone: "Nota da escala",
    legendPassing: "Nota de passagem",
  },
  es: {
    unknownScale: "Escala desconocida:",
    root: "Fundamental",
    view: "Vista",
    fullNeck: "Mástil completo",
    shape: "Forma",
    position: "Posición",
    degrees: "Grados",
    fingers: "Dedos",
    intervals: "Intervalos",
    notes: "Notas",
    captionFull: (scale: string) => `${scale} — mástil completo`,
    captionCaged: (scale: string, shape: string) => `${scale} — forma de ${shape} (CAGED)`,
    captionPosition: (scale: string, n: number) => `${scale} — posición ${n} (3NPS)`,
    legendRoot: "Fundamental",
    legendGuide: "Notas guía (3.ª, 7.ª)",
    legendColor: "Nota característica",
    legendColorWith: (degrees: string) => `Nota característica (${degrees})`,
    legendTone: "Nota de la escala",
    legendPassing: "Nota de paso",
  },
});

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
  const [showNotes, setShowNotes] = useState(true);
  const [showFingers, setShowFingers] = useState(false);
  const locale = useLocale();
  const t = useMessages(messages);

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
        {t.unknownScale} <code>{scaleSlug}</code>
      </div>
    );
  }

  const passingTones = new Set(definition.passingTones ?? []);
  const colorTones = new Set(definition.colorTones ?? []);

  // Spell notes by scale degree so altered tones keep their letter
  // (C Dorian's ♭3 is E♭, not D♯).
  const speller = degreeSpeller(
    root,
    Object.fromEntries(
      definition.intervals.map((iv, i) => [iv, definition.degrees[i]]),
    ),
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
  const fullName = `${speller.root} ${scaleName(definition.slug, locale)}`;

  if (view === "full") {
    scaleMarkers = getFullNeckMarkers(definition, root, 15, 0);
    caption = t.captionFull(fullName);
  } else if (view === "caged") {
    const shapes = getCAGEDScalePositions(definition, root);
    const chosen = shapes[cagedIndex] ?? shapes[0];
    scaleMarkers = chosen?.markers ?? [];
    caption = t.captionCaged(fullName, chosen?.name ?? "C");
  } else {
    const positions = get3NPSPositions(definition, root);
    const safeIndex = Math.min(position, positions.length) - 1;
    const chosen = positions[safeIndex];
    scaleMarkers = chosen?.markers ?? [];
    caption = t.captionPosition(fullName, position);
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
          label={t.root}
          options={KEY_OPTIONS.map((k) => ({ label: k.name, value: k.value }))}
          value={root}
          onChange={setRoot}
        />

        <SegmentedControl
          label={t.view}
          options={[
            { label: t.fullNeck, value: "full" },
            { label: "3NPS", value: "position" },
            { label: "CAGED", value: "caged" },
          ]}
          value={view}
          onChange={setView}
          size="sm"
        />

        {view === "caged" && (
          <SegmentedControl
            label={t.shape}
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
            label={t.position}
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
            labelOff={t.degrees}
            labelOn={t.fingers}
            value={showFingers}
            onChange={setShowFingers}
          />
        )}

        <ToggleSwitch
          labelOff={t.intervals}
          labelOn={t.notes}
          value={showNotes}
          onChange={setShowNotes}
        />
      </ControlBar>

      <Fretboard frets={frets} startFret={0} markers={fretboardMarkers} caption={caption} />
      <DegreeLegend
        showPassing={passingTones.size > 0}
        colorLabel={
          colorTones.size > 0
            ? t.legendColorWith(
                definition.intervals
                  .map((iv, i) => (colorTones.has(iv) ? definition.degrees[i] : null))
                  .filter(Boolean)
                  .join(", "),
              )
            : undefined
        }
      />
    </div>
  );
}

function DegreeLegend({
  showPassing,
  colorLabel,
}: {
  showPassing: boolean;
  colorLabel?: string;
}) {
  const t = useMessages(messages);
  const legend = [
    { role: "root", label: t.legendRoot },
    { role: "guide", label: t.legendGuide },
    { role: "color", label: t.legendColor },
    { role: "tone", label: t.legendTone },
    { role: "passing", label: t.legendPassing },
  ] as const;
  const items = legend.filter(
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
