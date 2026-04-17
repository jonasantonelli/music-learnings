import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

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

export const SONGS_DIR = path.join(process.cwd(), "content", "songs");

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
});

export type SongFrontmatter = z.infer<typeof songFrontmatterSchema>;

export type Song = {
  slug: string;
  href: string;
  filePath: string;
  frontmatter: SongFrontmatter;
};

let _songs: Song[] | null = null;

export function getAllSongs(): Song[] {
  if (_songs) return _songs;
  if (!fs.existsSync(SONGS_DIR)) return [];

  const entries = fs.readdirSync(SONGS_DIR, { withFileTypes: true });
  const songs: Song[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !/\.mdx?$/.test(entry.name)) continue;
    if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;

    const fullPath = path.join(SONGS_DIR, entry.name);
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
      href: `/songs/${slug}`,
      filePath: fullPath,
      frontmatter: parsed.data,
    });
  }

  songs.sort((a, b) => {
    if (a.frontmatter.order !== b.frontmatter.order)
      return a.frontmatter.order - b.frontmatter.order;
    return a.frontmatter.title.localeCompare(b.frontmatter.title);
  });

  _songs = songs;
  return songs;
}

export function getSongBySlug(slug: string): Song | undefined {
  return getAllSongs().find((s) => s.slug === slug);
}
