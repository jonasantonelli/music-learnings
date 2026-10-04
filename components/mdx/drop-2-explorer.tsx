"use client";

import { useState, useEffect } from "react";
import { usePracticeNote } from "@/lib/use-practice-note";
import {
  KEY_OPTIONS,
  keyName,
  QUALITY_LABELS,
  QUALITY_FAMILIES,
  CHORD_COLORS,
  STRING_SETS,
  INVERSION_NAMES,
  allDrop2Positions,
  computeDrop2Voicing,
  chordSpeller,
  getChordColor,
  resolveChordTones,
  lowestFret,
  type ChordQuality,
  type Voicing,
} from "@/lib/music";
import { NoteText } from "@/components/note-text";
import { VoicingDiagram } from "./voicing-diagram";
import { drop2DiagramMarks } from "./drop-2-shared";
import {
  ChipGroup,
  NoteGrid,
  SegmentedControl,
  StringSetControl,
  ToggleSwitch,
  ControlBar,
} from "./control-group";

const ALL_SETS = -1;
const BASIC = "";

type View = "inversions" | "neck";

export function Drop2Explorer() {
  const [practiceNote, setPracticeNote] = usePracticeNote();
  const [root, setRootLocal] = useState(0);

  const setRoot = (n: number) => {
    setRootLocal(n);
    setPracticeNote(n);
  };

  useEffect(() => {
    if (practiceNote !== null) setRootLocal(practiceNote);
  }, [practiceNote]);
  const [quality, setQualityState] = useState<ChordQuality>("maj7");
  const [color, setColor] = useState(BASIC);
  const [stringSet, setStringSet] = useState(1);
  const [view, setView] = useState<View>("inversions");
  const [showNotes, setShowNotes] = useState(false);

  const setQuality = (q: ChordQuality) => {
    setQualityState(q);
    setColor(BASIC);
  };

  const colorId = color || undefined;
  const colors = CHORD_COLORS[quality] ?? [];
  const speller = chordSpeller(root, quality, keyName(root), colorId);
  const chordName = speller.root + (getChordColor(quality, colorId)?.suffix ?? QUALITY_LABELS[quality]);
  const tones = resolveChordTones(quality, colorId);

  const setsToShow = stringSet === ALL_SETS ? [0, 1, 2] : [stringSet];

  const voicingsFor = (ss: number): Voicing[] =>
    view === "neck"
      ? allDrop2Positions(root, quality, ss, colorId)
      : [0, 1, 2, 3]
          .map((inv) => computeDrop2Voicing(root, quality, inv, ss, colorId))
          .sort((a, b) => a.midi[a.midi.length - 1] - b.midi[b.midi.length - 1]);

  return (
    <div className="my-8">
      <ControlBar>
        <NoteGrid
          label="Root"
          options={KEY_OPTIONS.map((k) => ({ label: k.name, value: k.value }))}
          value={root}
          onChange={setRoot}
        />

        {QUALITY_FAMILIES.map((family) => (
          <ChipGroup
            key={family.label}
            label={family.label}
            options={family.qualities.map((q) => ({ label: QUALITY_LABELS[q], value: q }))}
            value={quality}
            onChange={setQuality}
          />
        ))}

        {colors.length > 0 && (
          <ChipGroup
            label="Color"
            options={[
              { label: "Basic", value: BASIC },
              ...colors.map((c) => ({ label: c.suffix, value: c.id })),
            ]}
            value={color}
            onChange={setColor}
          />
        )}

        <StringSetControl
          label="Strings"
          options={[
            ...STRING_SETS.map((s, i) => ({ label: s.label, value: i })),
            { label: "All", value: ALL_SETS },
          ]}
          value={stringSet}
          onChange={setStringSet}
        />

        <SegmentedControl
          label="View"
          options={[
            { label: "Inversions", value: "inversions" as const },
            { label: "Full neck", value: "neck" as const },
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

      <p className="mb-6 text-sm text-muted-foreground">
        <strong className="text-foreground">
          <NoteText text={chordName} />
        </strong>{" "}
        ={" "}
        {tones.intervals.map((iv, i) => (
          <span key={i}>
            {i > 0 && " · "}
            <NoteText text={tones.labels[i]} /> (<NoteText text={speller.spell(iv)} />)
          </span>
        ))}
        {colorId && !tones.intervals.includes(0) && (
          <span className="block mt-1 text-xs">
            Rootless voicing — the 9 takes the root&apos;s place; the bass or the
            harmonic context supplies the root.
          </span>
        )}
      </p>

      {setsToShow.map((ss) => (
        <section key={ss} className="mb-6">
          {setsToShow.length > 1 && (
            <h4 className="mb-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              Strings {STRING_SETS[ss].label}
            </h4>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center">
            {voicingsFor(ss).map((v) => {
              const marks = drop2DiagramMarks(v, ss, speller, showNotes);
              return (
                <VoicingDiagram
                  key={v.frets.join(",")}
                  name={chordName}
                  subtitle={
                    view === "neck"
                      ? `${INVERSION_NAMES[v.inversionIndex]} · fr ${lowestFret(v)}`
                      : INVERSION_NAMES[v.inversionIndex]
                  }
                  frets={v.frets}
                  labels={marks.labels}
                  highlights={marks.highlights}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
