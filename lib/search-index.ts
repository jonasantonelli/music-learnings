import { getTopSections, type TreeNode } from "./content";
import { getAllSongs } from "./songs";
import { getAllLicks } from "./licks";
import { progressionLabel, techniqueLabel } from "./licks/taxonomy";
import { sectionTone, type Tone } from "./tones";
import { defineMessages, type Locale } from "./i18n";

const messages = defineMessages({
  en: { songs: "Songs", licks: "Licks" },
  pt: { songs: "Músicas", licks: "Licks" },
  es: { songs: "Canciones", licks: "Licks" },
});

export type SearchItem = {
  title: string;
  href: string;
  /** Breadcrumb shown under the title, e.g. "Scales / Greek Modes". */
  context: string;
  description?: string;
  /** Extra text matched against the query but not displayed. */
  keywords: string;
  tone: Tone;
};

const _indexes = new Map<Locale, SearchItem[]>();

/** Flat list of every lesson, song and lick, for the header search. */
export function getSearchIndex(lang: Locale): SearchItem[] {
  const cached = _indexes.get(lang);
  if (cached) return cached;
  const items: SearchItem[] = [];

  getTopSections(lang).forEach((section, i) => {
    const tone = sectionTone(section.slug.join("/"), i);
    const visit = (nodes: TreeNode[], trail: string[]) => {
      for (const n of nodes) {
        if (n.kind === "section") {
          visit(n.children, [...trail, n.title]);
          continue;
        }
        const fm = n.lesson.frontmatter;
        items.push({
          title: fm.title,
          href: n.lesson.href,
          context: trail.join(" / "),
          description: fm.description,
          keywords: fm.tags.join(" "),
          tone,
        });
      }
    };
    visit(section.children, [section.title]);
  });

  for (const song of getAllSongs(lang)) {
    const fm = song.frontmatter;
    items.push({
      title: fm.title,
      href: song.href,
      context: `${messages[lang].songs} / ${fm.composer}`,
      description: `${fm.key} · ${fm.form} · ${fm.tempo_feel}`,
      keywords: [fm.composer, fm.style, ...fm.tags].join(" "),
      tone: "butter",
    });
  }

  for (const lick of getAllLicks(lang)) {
    items.push({
      title: lick.title[lang],
      href: lick.href,
      context: [messages[lang].licks, lick.artist].filter(Boolean).join(" / "),
      description: `${progressionLabel(lick.progression, lang)} · ${lick.chords.join(" | ")}`,
      keywords: [
        lick.artist ?? "",
        lick.style,
        ...lick.techniques.map((x) => techniqueLabel(x, lang)),
      ].join(" "),
      tone: "peach",
    });
  }

  _indexes.set(lang, items);
  return items;
}
