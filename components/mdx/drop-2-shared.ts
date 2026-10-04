import { STRING_SETS, type DegreeSpeller, type Voicing } from "@/lib/music";
import { defineMessages } from "@/lib/i18n";

/** Per-string labels and root highlights for a drop-2 VoicingDiagram. */
export function drop2DiagramMarks(
  voicing: Voicing,
  stringSetIndex: number,
  speller: DegreeSpeller,
  showNotes: boolean,
): { labels: (string | null)[]; highlights: (boolean | null)[] } {
  const labels: (string | null)[] = [null, null, null, null, null, null];
  const highlights: (boolean | null)[] = [null, null, null, null, null, null];
  STRING_SETS[stringSetIndex].indices.forEach((si, i) => {
    labels[si] = showNotes ? speller.spell(voicing.intervals[i]) : voicing.labels[i];
    highlights[si] = voicing.intervals[i] === 0;
  });
  return { labels, highlights };
}

/**
 * UI strings shared by the drop-2 explorers (Drop2Explorer, Drop2Diatonic,
 * Drop2Progression). Display labels for lib/music data (inversion names,
 * quality families, harmonized scales, progressions) are looked up here by
 * index or id, so the music data itself stays language-neutral. Anything not
 * listed (e.g. "ii–V–I") is notation and falls back to the data label.
 */
export const drop2Messages = defineMessages({
  en: {
    key: "Key",
    root: "Root",
    strings: "Strings",
    intervals: "Intervals",
    notes: "Notes",
    stringsHeading: (set: string) => `Strings ${set}`,
    /** Indexed like INVERSION_NAMES. */
    inversionNames: ["Root Position", "1st Inversion", "2nd Inversion", "3rd Inversion"],
    /** Keyed by QUALITY_FAMILIES[].label. */
    qualityFamilies: {
      Major: "Major",
      Minor: "Minor",
      Dominant: "Dominant",
      Diminished: "Diminished",
    } as Record<string, string>,
    /** Keyed by HARMONIZED_SCALES[].id. */
    scales: {
      major: "Major",
      "melodic-minor": "Melodic minor",
      "harmonic-minor": "Harmonic minor",
    } as Record<string, string>,
    /** Keyed by PROGRESSIONS[].id; only labels with words need an entry. */
    progressions: {
      "minor-251": "Minor ii–V–i",
    } as Record<string, string>,
  },
  pt: {
    key: "Tom",
    root: "Fundamental",
    strings: "Cordas",
    intervals: "Intervalos",
    notes: "Notas",
    stringsHeading: (set: string) => `Cordas ${set}`,
    inversionNames: ["Estado fundamental", "1ª inversão", "2ª inversão", "3ª inversão"],
    qualityFamilies: {
      Major: "Maior",
      Minor: "Menor",
      Dominant: "Dominante",
      Diminished: "Diminuto",
    },
    scales: {
      major: "Maior",
      "melodic-minor": "Menor melódica",
      "harmonic-minor": "Menor harmônica",
    },
    progressions: {
      "minor-251": "ii–V–i menor",
    },
  },
  es: {
    key: "Tonalidad",
    root: "Fundamental",
    strings: "Cuerdas",
    intervals: "Intervalos",
    notes: "Notas",
    stringsHeading: (set: string) => `Cuerdas ${set}`,
    inversionNames: ["Estado fundamental", "1.ª inversión", "2.ª inversión", "3.ª inversión"],
    qualityFamilies: {
      Major: "Mayor",
      Minor: "Menor",
      Dominant: "Dominante",
      Diminished: "Disminuido",
    },
    scales: {
      major: "Mayor",
      "melodic-minor": "Menor melódica",
      "harmonic-minor": "Menor armónica",
    },
    progressions: {
      "minor-251": "ii–V–i menor",
    },
  },
});
