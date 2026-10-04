"use client";

import { useEffect, useState } from "react";
import { usePracticeNote } from "@/lib/use-practice-note";
import { KEY_OPTIONS, keyName, type DegreeSpeller } from "@/lib/music";
import {
  ARPEGGIO_SUFFIXES,
  ARPEGGIO_INTERVAL_LABELS,
  arpeggioSpeller,
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
import { defineMessages } from "@/lib/i18n";
import { useMessages } from "@/components/locale-provider";

const messages = defineMessages({
  en: {
    root: "Root",
    quality: "Quality",
    view: "View",
    fullNeck: "Full neck",
    intervals: "Intervals",
    notes: "Notes",
    major: "Major",
    minor: "Minor",
    dim: "Dim",
    aug: "Aug",
    captionFull: (chord: string) => `${chord} arpeggio — full neck`,
    captionShape: (shape: string) => `${shape} shape`,
  },
  pt: {
    root: "Fundamental",
    quality: "Qualidade",
    view: "Visualização",
    fullNeck: "Braço inteiro",
    intervals: "Intervalos",
    notes: "Notas",
    major: "Maior",
    minor: "Menor",
    dim: "Dim",
    aug: "Aum",
    captionFull: (chord: string) => `Arpejo de ${chord} — braço inteiro`,
    captionShape: (shape: string) => `Forma de ${shape}`,
  },
  es: {
    root: "Fundamental",
    quality: "Calidad",
    view: "Vista",
    fullNeck: "Mástil completo",
    intervals: "Intervalos",
    notes: "Notas",
    major: "Mayor",
    minor: "Menor",
    dim: "Dism",
    aug: "Aum",
    captionFull: (chord: string) => `Arpegio de ${chord} — mástil completo`,
    captionShape: (shape: string) => `Forma de ${shape}`,
  },
});

type ArpeggioExplorerProps = {
  mode: "triads" | "tetrads";
};

const TRIAD_QUALITIES = ["major", "minor", "dim", "aug"] as const;

const TETRAD_OPTIONS: { label: string; value: ArpeggioQuality }[] = [
  { label: "Maj7", value: "maj7" },
  { label: "m7", value: "m7" },
  { label: "Dom7", value: "7" },
  { label: "m7♭5", value: "m7b5" },
  { label: "°7", value: "dim7" },
];

type ViewMode = "full" | "caged";

function buildFretboardMarkers(
  markers: ArpeggioMarker[],
  speller: DegreeSpeller,
  showNotes: boolean,
) {
  return markers.map((m) => {
    const isRoot = m.intervalPc === 0;
    return {
      string: m.string,
      fret: m.fret,
      label: showNotes
        ? speller.spell(m.intervalPc)
        : ARPEGGIO_INTERVAL_LABELS[m.intervalPc] ?? String(m.intervalPc),
      color: isRoot ? "var(--degree-root-bg)" : "var(--arpeggio-tone-bg)",
      labelColor: isRoot ? "var(--degree-root-fg)" : "var(--arpeggio-tone-fg)",
      stroke: isRoot ? undefined : "var(--arpeggio-tone-border)",
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
  const t = useMessages(messages);

  const setRoot = (n: number) => {
    setRootLocal(n);
    setPracticeNote(n);
  };

  useEffect(() => {
    if (practiceNote !== null) setRootLocal(practiceNote);
  }, [practiceNote]);

  const qualityOptions =
    mode === "triads"
      ? TRIAD_QUALITIES.map((q) => ({ label: t[q], value: q as ArpeggioQuality }))
      : TETRAD_OPTIONS;

  const speller = arpeggioSpeller(root, quality, keyName(root));
  const rootName = speller.root;
  const suffix = ARPEGGIO_SUFFIXES[quality];

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
          label={t.quality}
          options={qualityOptions}
          value={quality}
          onChange={(v) => setQuality(v as ArpeggioQuality)}
        />

        <SegmentedControl
          label={t.view}
          options={[
            { label: t.fullNeck, value: "full" as ViewMode },
            { label: "CAGED", value: "caged" as ViewMode },
          ]}
          value={view}
          onChange={setView}
        />

        <ToggleSwitch
          labelOff={t.intervals}
          labelOn={t.notes}
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
            speller,
            showNotes,
          )}
          caption={t.captionFull(`${rootName}${suffix}`)}
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
                    speller,
                    showNotes,
                  )}
                  caption={t.captionShape(shape.name)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
