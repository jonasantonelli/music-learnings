import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SongFilters } from "@/components/song-filters";
import { getAllSongs } from "@/lib/songs";

export const metadata = {
  title: "Songs — Music Learnings",
  description: "Real Book standards for studying harmony, progressions, and improvisation.",
};

export default function SongsPage() {
  const songs = getAllSongs();

  const allTags = Array.from(
    new Set(songs.flatMap((s) => s.frontmatter.tags)),
  ).sort();
  const allKeys = Array.from(
    new Set(songs.map((s) => s.frontmatter.key)),
  ).sort();
  const allStyles = Array.from(
    new Set(songs.map((s) => s.frontmatter.style)),
  ).sort();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10 sm:py-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-accent-3 px-3 py-1 text-xs font-medium text-accent-11">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-9" />
          Real Book
        </div>
        <h1 className="mt-5 text-3xl sm:text-4xl font-semibold tracking-tight">
          Songs
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground">
          Standards from class with interactive chord charts for studying
          harmony, progressions, and improvisation.
        </p>

        <SongFilters
          songs={songs.map((s) => ({
            slug: s.slug,
            href: s.href,
            title: s.frontmatter.title,
            composer: s.frontmatter.composer,
            songKey: s.frontmatter.key,
            style: s.frontmatter.style,
            tempo_feel: s.frontmatter.tempo_feel,
            form: s.frontmatter.form,
            tags: s.frontmatter.tags,
          }))}
          allTags={allTags}
          allKeys={allKeys}
          allStyles={allStyles}
        />

        {songs.length === 0 && (
          <p className="mt-12 text-center text-muted-foreground">
            No songs yet. Use the <code>/transcribe</code> skill to add your first chart.
          </p>
        )}
      </main>
    </>
  );
}
