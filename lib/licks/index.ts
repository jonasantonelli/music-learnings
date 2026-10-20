import { localizeHref, type Locale } from "@/lib/i18n";
import { LICKS, type LickDefinition } from "./catalog";
import { parseKey, parseLick, rhythmFeatures, timedChords, type RhythmFeature } from "./notation";
import { BEATS_PER_BAR } from "./notation";

export type { LickDefinition } from "./catalog";

/** A catalogued lick plus what is derived from its notes. */
export type Lick = LickDefinition & {
  href: string;
  rhythms: RhythmFeature[];
  bars: number;
};

let validated = false;

/** Parses every lick once so a typo fails the build instead of a page. */
function validate() {
  if (validated) return;
  const slugs = new Set<string>();
  for (const lick of LICKS) {
    const where = `lick "${lick.slug}"`;
    if (slugs.has(lick.slug)) throw new Error(`Duplicate ${where}`);
    slugs.add(lick.slug);
    try {
      parseKey(lick.key);
      const parsed = parseLick(lick.notes);
      if (parsed.bars !== lick.chords.length) {
        throw new Error(`${parsed.bars} bars of notes but ${lick.chords.length} bars of chords`);
      }
      timedChords(lick.chords);
    } catch (e) {
      throw new Error(`Invalid ${where}: ${(e as Error).message}`);
    }
  }
  validated = true;
}

export function getAllLicks(lang: Locale): Lick[] {
  validate();
  return LICKS.map((lick) => {
    const parsed = parseLick(lick.notes);
    return {
      ...lick,
      href: localizeHref(lang, `/licks/${lick.slug}`),
      rhythms: rhythmFeatures(parsed),
      bars: parsed.notes.at(-1) ? Math.ceil((parsed.notes.at(-1)!.start + 0.001) / BEATS_PER_BAR) : 0,
    };
  });
}

export function getLickBySlug(lang: Locale, slug: string): Lick | undefined {
  return getAllLicks(lang).find((l) => l.slug === slug);
}
