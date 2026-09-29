import { getTopSections, type TreeNode } from "./content";
import { getAllSongs } from "./songs";
import { sectionTone, type Tone } from "./tones";

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

let _index: SearchItem[] | null = null;

/** Flat list of every lesson and song, for the header search. */
export function getSearchIndex(): SearchItem[] {
  if (_index) return _index;
  const items: SearchItem[] = [];

  getTopSections().forEach((section, i) => {
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

  for (const song of getAllSongs()) {
    const fm = song.frontmatter;
    items.push({
      title: fm.title,
      href: song.href,
      context: `Songs / ${fm.composer}`,
      description: `${fm.key} · ${fm.form} · ${fm.tempo_feel}`,
      keywords: [fm.composer, fm.style, ...fm.tags].join(" "),
      tone: "butter",
    });
  }

  _index = items;
  return items;
}
