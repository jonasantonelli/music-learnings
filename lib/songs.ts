import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { recordingSchema } from "./recordings";
import { contentRoot, resolveContentFile } from "./content";
import { defaultLocale, localizeHref, type Locale } from "./i18n";

export {
  parseChordSymbol,
  parseKeyName,
  getChordFunction,
  detectIIVIPatterns,
  type ChordFunction,
  type ChordCategory,
  type ParsedChord,
  type IIVIPattern,
  type ChordProvenance,
  type FlatChord,
} from "./song-analysis";


export const songFrontmatterSchema = z.object({
  title: z.string().min(1),
  composer: z.string().min(1),
  key: z.string().min(1),
  time_signature: z.string().default("4/4"),
  style: z.string().default("jazz standard"),
  tempo_feel: z.string().default("medium swing"),
  form: z.string().default("AABA"),
  tags: z.array(z.string()).default([]),
  order: z.number().int().default(999),
  recordings: z.array(recordingSchema).default([]),
});

export type SongFrontmatter = z.infer<typeof songFrontmatterSchema>;

export type Song = {
  slug: string;
  href: string;
  filePath: string;
  /** Locale the file was actually read from (differs when falling back). */
  contentLang: Locale;
  frontmatter: SongFrontmatter;
};

const _songs = new Map<Locale, Song[]>();

// English decides which songs exist; each locale overlays translated charts.
export function getAllSongs(lang: Locale): Song[] {
  const cached = _songs.get(lang);
  if (cached) return cached;
  const songsDir = path.join(contentRoot(defaultLocale), "songs");
  if (!fs.existsSync(songsDir)) return [];

  const entries = fs.readdirSync(songsDir, { withFileTypes: true });
  const songs: Song[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !/\.mdx?$/.test(entry.name)) continue;
    if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;

    const { filePath: fullPath, contentLang } = resolveContentFile(
      lang,
      path.join("songs", entry.name),
    );
    const raw = fs.readFileSync(fullPath, "utf8");
    const { data } = matter(raw);
    const parsed = songFrontmatterSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(
        `Invalid frontmatter in ${path.relative(process.cwd(), fullPath)}:\n${parsed.error.message}`,
      );
    }

    const slug = entry.name.replace(/\.mdx?$/, "");
    songs.push({
      slug,
      href: localizeHref(lang, `/songs/${slug}`),
      filePath: fullPath,
      contentLang,
      frontmatter: parsed.data,
    });
  }

  songs.sort((a, b) => {
    if (a.frontmatter.order !== b.frontmatter.order)
      return a.frontmatter.order - b.frontmatter.order;
    return a.frontmatter.title.localeCompare(b.frontmatter.title, lang);
  });

  _songs.set(lang, songs);
  return songs;
}

export function getSongBySlug(lang: Locale, slug: string): Song | undefined {
  return getAllSongs(lang).find((s) => s.slug === slug);
}
