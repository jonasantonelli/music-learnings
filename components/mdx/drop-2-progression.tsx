"use client";

import { useState, useMemo, useEffect } from "react";
import { usePracticeNote } from "@/lib/use-practice-note";
import {
  KEY_OPTIONS,
  STRING_SETS,
  PROGRESSIONS,
  computeDrop2Voicing,
  findBestVoiceLeading,
  shiftVoicingOctave,
  chordLabel,
  getProgression,
  chordSpeller,
  noteName,
  type ProgressionChord,
  type ProgressionId,
  type TonicMinor,
  type Voicing,
} from "@/lib/music";
import { NoteText } from "@/components/note-text";
import { VoicingDiagram } from "./voicing-diagram";
import { drop2DiagramMarks, drop2Messages } from "./drop-2-shared";
import {
  ChipGroup,
  NoteGrid,
  SegmentedControl,
  StringSetControl,
  ToggleSwitch,
  ControlBar,
} from "./control-group";
import { defineMessages } from "@/lib/i18n";
import { useMessages } from "@/components/locale-provider";

const messages = defineMessages({
  en: {
    progression: "Progression",
    tonicChord: "i chord",
    chords: "Chords",
    sevenths: "7ths",
    extended: "Extended",
    startingFrom: (inversion: string, degree: string) =>
      `Starting from ${inversion} of ${degree}`,
  },
  pt: {
    progression: "Progressão",
    tonicChord: "Acorde i",
    chords: "Acordes",
    sevenths: "Tétrades",
    extended: "Com tensões",
    startingFrom: (inversion: string, degree: string) =>
      `Começando do ${degree} em ${inversion.toLocaleLowerCase("pt-BR")}`,
  },
  es: {
    progression: "Progresión",
    tonicChord: "Acorde i",
    chords: "Acordes",
    sevenths: "Cuatríadas",
    extended: "Con tensiones",
    startingFrom: (inversion: string, degree: string) =>
      `Empezando desde ${degree} en ${inversion.toLocaleLowerCase("es")}`,
  },
});

type ProgressionProps = {
  /** Initial progression, so a lesson page can open on the one it discusses. */
  progression?: ProgressionId;
};

export function Drop2Progression({ progression: initial = "major-251" }: ProgressionProps) {
  const t = useMessages(messages);
  const s = useMessages(drop2Messages);
  const [practiceNote, setPracticeNote] = usePracticeNote();
  const [key, setKeyLocal] = useState(0);

  const setKey = (n: number) => {
    setKeyLocal(n);
    setPracticeNote(n);
  };

  useEffect(() => {
    if (practiceNote !== null) setKeyLocal(practiceNote);
  }, [practiceNote]);
  const [stringSet, setStringSet] = useState(1);
  const [progId, setProgId] = useState<ProgressionId>(initial);
  const [tonic, setTonic] = useState<TonicMinor>("m7");
  const [extended, setExtended] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const chords = useMemo(
    () =>
      getProgression(progId, key, tonic).map((c) => ({
        ...c,
        color: extended ? c.color : undefined,
      })),
    [progId, key, tonic, extended],
  );

  const paths = useMemo(() => {
    const buildPath = (first: Voicing): Voicing[] => {
      const path = [first];
      for (const c of chords.slice(1)) {
        path.push(
          findBestVoiceLeading(path[path.length - 1], c.root, c.quality, stringSet, c.color),
        );
      }
      return path;
    };

    const raw = [0, 1, 2, 3].map((startInv) =>
      buildPath(
        computeDrop2Voicing(chords[0].root, chords[0].quality, startInv, stringSet, chords[0].color),
      ),
    );

    // Dedupe: when two paths converge on the same voicings after the first
    // chord, voice-leading has collapsed them. Shift the lower-topped start up
    // an octave and rebuild so each row shows a distinct chain.
    const tailKey = (p: Voicing[]) => p.slice(1).map((v) => v.frets.join(",")).join("|");
    const topMidi = (v: Voicing) => v.midi[v.midi.length - 1];
    const order = [0, 1, 2, 3].sort((a, b) => topMidi(raw[a][0]) - topMidi(raw[b][0]));
    for (let a = 0; a < order.length; a++) {
      for (let b = a + 1; b < order.length; b++) {
        if (tailKey(raw[order[a]]) === tailKey(raw[order[b]])) {
          const shifted = shiftVoicingOctave(raw[order[a]][0], 12);
          if (shifted) raw[order[a]] = buildPath(shifted);
        }
      }
    }

    return raw.sort((a, b) => topMidi(a[0]) - topMidi(b[0]));
  }, [chords, stringSet]);

  const name = (c: ProgressionChord) => chordLabel(c.root, c.quality, key, c.color);

  return (
    <div className="my-8">
      <ControlBar>
        <NoteGrid
          label={s.key}
          options={KEY_OPTIONS.map((k) => ({ label: k.name, value: k.value }))}
          value={key}
          onChange={setKey}
        />

        <ChipGroup
          label={t.progression}
          options={PROGRESSIONS.map((p) => ({
            label: s.progressions[p.id] ?? p.label,
            value: p.id,
          }))}
          value={progId}
          onChange={setProgId}
        />

        {progId === "minor-251" && (
          <SegmentedControl
            label={t.tonicChord}
            options={[
              { label: "m7", value: "m7" as const },
              { label: "m6", value: "m6" as const },
              { label: "m(maj7)", value: "mMaj7" as const },
            ]}
            value={tonic}
            onChange={setTonic}
          />
        )}

        <SegmentedControl
          label={t.chords}
          options={[
            { label: t.sevenths, value: "basic" as const },
            { label: t.extended, value: "extended" as const },
          ]}
          value={extended ? "extended" : "basic"}
          onChange={(v) => setExtended(v === "extended")}
        />

        <StringSetControl
          label={s.strings}
          options={STRING_SETS.map((set, i) => ({ label: set.label, value: i }))}
          value={stringSet}
          onChange={setStringSet}
        />

        <ToggleSwitch
          labelOff={s.intervals}
          labelOn={s.notes}
          value={showNotes}
          onChange={setShowNotes}
        />
      </ControlBar>

      <p className="text-sm text-muted-foreground mb-6">
        {chords.map((c, i) => (
          <span key={i}>
            {i > 0 && " → "}
            <strong>{c.degree}</strong>: <NoteText text={name(c)} />
          </span>
        ))}
      </p>

      {paths.map((path, pathIdx) => (
        <div key={pathIdx} className="mb-8">
          <h4 className="text-sm font-medium mb-2 text-muted-foreground">
            {t.startingFrom(s.inversionNames[path[0].inversionIndex], chords[0].degree)}
          </h4>
          <div className="flex flex-wrap items-start gap-1">
            {path.map((voicing, chordIdx) => {
              const c = chords[chordIdx];
              const speller = chordSpeller(c.root, c.quality, noteName(c.root, key), c.color);
              const marks = drop2DiagramMarks(voicing, stringSet, speller, showNotes);
              return (
                <div key={chordIdx} className="flex items-start gap-1">
                  {chordIdx > 0 && (
                    <span className="text-muted-foreground text-lg mx-1">→</span>
                  )}
                  <VoicingDiagram
                    name={name(c)}
                    subtitle={`${c.degree} · ${s.inversionNames[voicing.inversionIndex]}`}
                    frets={voicing.frets}
                    labels={marks.labels}
                    highlights={marks.highlights}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
