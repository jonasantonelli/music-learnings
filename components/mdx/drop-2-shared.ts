import { STRING_SETS, type DegreeSpeller, type Voicing } from "@/lib/music";

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
