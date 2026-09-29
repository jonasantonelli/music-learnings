import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SongFilters } from "@/components/song-filters";
import { SongSuggestions } from "@/components/song-suggestions";
import { getAllSongs } from "@/lib/songs";
import { SONG_SUGGESTIONS, baseTitle } from "@/lib/song-suggestions";

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

  const charted = new Set(songs.map((s) => baseTitle(s.frontmatter.title)));
  const suggestions = SONG_SUGGESTIONS.filter(
    (s) => !charted.has(baseTitle(s.title)),
  );

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10 sm:py-16">
        <div className="inline-flex items-center gap-2 rounded-full bg-tone-butter px-3 py-1 text-xs font-medium text-tone-butter-fg">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          Real Book
        </div>
        <h1 className="mt-5 font-display text-4xl sm:text-5xl">
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

        {suggestions.length > 0 && (
          <section className="mt-16 border-t border-border pt-10">
            <h2 className="font-display text-2xl sm:text-3xl">
              Next tunes to learn
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              {suggestions.length} standards that build on the charts above,
              each with a reference recording to listen to before transcribing.
            </p>
            <SongSuggestions
              suggestions={suggestions}
              songs={songs.map((s) => ({
                slug: s.slug,
                href: s.href,
                title: s.frontmatter.title,
              }))}
            />
          </section>
        )}
      </main>
    </>
  );
}
