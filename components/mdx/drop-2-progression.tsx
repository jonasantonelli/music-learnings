"use client";

import { useState, useMemo, useEffect } from "react";
import { usePracticeNote } from "@/lib/use-practice-note";
import {
  KEY_OPTIONS,
  STRING_SETS,
  INVERSION_NAMES,
  INTERVAL_LABELS,
  computeDrop2Voicing,
  findBestVoiceLeading,
  shiftVoicingOctave,
  chordLabel,
  getMajor251,
  getMinor251,
  noteName,
  type Voicing,
} from "@/lib/music";
import { VoicingDiagram } from "./voicing-diagram";
import {
  NoteGrid,
  SegmentedControl,
  StringSetControl,
  ToggleSwitch,
  ControlBar,
} from "./control-group";

function buildLabels(
  voicing: Voicing,
  chordRoot: number,
  key: number,
  stringSetIndex: number,
  showNotes: boolean,
): (string | null)[] {
  const labels: (string | null)[] = [null, null, null, null, null, null];
  const indices = STRING_SETS[stringSetIndex].indices;
  for (let j = 0; j < 4; j++) {
    const si = indices[j];
    labels[si] = showNotes
      ? noteName((chordRoot + voicing.intervals[j]) % 12, key)
      : (INTERVAL_LABELS[voicing.intervals[j]] ?? String(voicing.intervals[j]));
  }
  return labels;
}

function buildHighlights(voicing: Voicing, stringSetIndex: number): (boolean | null)[] {
  const highlights: (boolean | null)[] = [null, null, null, null, null, null];
  const indices = STRING_SETS[stringSetIndex].indices;
  for (let i = 0; i < 4; i++) {
    highlights[indices[i]] = voicing.toneIndices[i] === 0;
  }
  return highlights;
}

export function Drop2Progression() {
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
  const [mode, setMode] = useState<"major" | "minor">("major");
  const [useMmaj7, setUseMmaj7] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const progression = useMemo(
    () => (mode === "major" ? getMajor251(key) : getMinor251(key, useMmaj7)),
    [key, mode, useMmaj7],
  );

  const paths = useMemo(() => {
    const buildPath = (ii: Voicing): [Voicing, Voicing, Voicing] => {
      const v = findBestVoiceLeading(
        ii,
        progression[1].root,
        progression[1].quality,
        stringSet,
      );
      const i = findBestVoiceLeading(
        v,
        progression[2].root,
        progression[2].quality,
        stringSet,
      );
      return [ii, v, i];
    };

    const raw = [0, 1, 2, 3].map((startInv) =>
      buildPath(
        computeDrop2Voicing(
          progression[0].root,
          progression[0].quality,
          startInv,
          stringSet,
        ),
      ),
    );

    // Dedupe: when two paths share the same V and I voicings, voice-leading has
    // collapsed them. Shift the lower-topped ii up an octave and rebuild so each
    // row shows a distinct chain.
    const fretKey = (v: Voicing) => v.frets.join(",");
    const topMidi = (v: Voicing) => v.midi[v.midi.length - 1];
    const order = [0, 1, 2, 3].sort(
      (a, b) => topMidi(raw[a][0]) - topMidi(raw[b][0]),
    );
    for (let a = 0; a < order.length; a++) {
      for (let b = a + 1; b < order.length; b++) {
        const lo = raw[order[a]];
        const hi = raw[order[b]];
        if (
          fretKey(lo[1]) === fretKey(hi[1]) &&
          fretKey(lo[2]) === fretKey(hi[2])
        ) {
          const shifted = shiftVoicingOctave(lo[0], 12);
          if (shifted) raw[order[a]] = buildPath(shifted);
        }
      }
    }

    return raw.sort((a, b) => topMidi(a[0]) - topMidi(b[0]));
  }, [progression, stringSet]);

  return (
    <div className="my-8">
      <ControlBar>
        <NoteGrid
          label="Key"
          options={KEY_OPTIONS.map((k) => ({ label: k.name, value: k.value }))}
          value={key}
          onChange={setKey}
        />

        <StringSetControl
          label="Strings"
          options={STRING_SETS.map((s, i) => ({ label: s.label, value: i }))}
          value={stringSet}
          onChange={setStringSet}
        />

        <SegmentedControl
          label="Mode"
          options={[
            { label: "Major", value: "major" as const },
            { label: "Minor", value: "minor" as const },
          ]}
          value={mode}
          onChange={setMode}
        />

        {mode === "minor" && (
          <SegmentedControl
            label="i chord"
            options={[
              { label: "m7", value: "m7" },
              { label: "m(maj7)", value: "mMaj7" },
            ]}
            value={useMmaj7 ? "mMaj7" : "m7"}
            onChange={(v) => setUseMmaj7(v === "mMaj7")}
          />
        )}

        <ToggleSwitch
          labelOff="Intervals"
          labelOn="Notes"
          value={showNotes}
          onChange={setShowNotes}
        />
      </ControlBar>

      <p className="text-sm text-muted-foreground mb-6">
        {progression.map((c, i) => (
          <span key={i}>
            {i > 0 && " \u2192 "}
            <strong>{c.degree}</strong>:{" "}
            {chordLabel(c.root, c.quality, key)}
          </span>
        ))}
      </p>

      {paths.map((path, pathIdx) => (
        <div key={pathIdx} className="mb-8">
          <h4 className="text-sm font-medium mb-2 text-muted-foreground">
            Starting from {INVERSION_NAMES[path[0].inversionIndex]} of{" "}
            {progression[0].degree}
          </h4>
          <div className="flex flex-wrap items-start gap-1">
            {path.map((voicing, chordIdx) => (
              <div key={chordIdx} className="flex items-start gap-1">
                {chordIdx > 0 && (
                  <span className="text-muted-foreground text-lg mx-1">
                    →
                  </span>
                )}
                <VoicingDiagram
                  name={chordLabel(
                    progression[chordIdx].root,
                    progression[chordIdx].quality,
                    key,
                  )}
                  subtitle={`${progression[chordIdx].degree} \u00b7 ${INVERSION_NAMES[voicing.inversionIndex]}`}
                  frets={voicing.frets}
                  labels={buildLabels(
                    voicing,
                    progression[chordIdx].root,
                    key,
                    stringSet,
                    showNotes,
                  )}
                  highlights={buildHighlights(voicing, stringSet)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
