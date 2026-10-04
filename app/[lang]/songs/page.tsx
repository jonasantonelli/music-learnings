import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SongFilters } from "@/components/song-filters";
import { SongSuggestions } from "@/components/song-suggestions";
import { getAllSongs } from "@/lib/songs";
import { SONG_SUGGESTIONS, baseTitle } from "@/lib/song-suggestions";
import { defineMessages, hasLocale } from "@/lib/i18n";

const messages = defineMessages({
  en: {
    title: "Songs",
    description: "Real Book standards for studying harmony, progressions, and improvisation.",
    intro:
      "Standards from class with interactive chord charts for studying harmony, progressions, and improvisation.",
    empty: "No songs yet. Use the /transcribe skill to add your first chart.",
    nextTitle: "Next tunes to learn",
    nextIntro: (n: number) =>
      `${n} standards that build on the charts above, each with a reference recording to listen to before transcribing.`,
  },
  pt: {
    title: "Músicas",
    description: "Standards do Real Book para estudar harmonia, progressões e improvisação.",
    intro:
      "Standards das aulas com cifras interativas para estudar harmonia, progressões e improvisação.",
    empty: "Nenhuma música ainda. Use a skill /transcribe para adicionar a primeira cifra.",
    nextTitle: "Próximas músicas para aprender",
    nextIntro: (n: number) =>
      `${n} standards que partem das cifras acima, cada um com uma gravação de referência para ouvir antes de transcrever.`,
  },
  es: {
    title: "Canciones",
    description: "Standards del Real Book para estudiar armonía, progresiones e improvisación.",
    intro:
      "Standards de clase con cifrados interactivos para estudiar armonía, progresiones e improvisación.",
    empty: "Aún no hay canciones. Usa la skill /transcribe para añadir el primer cifrado.",
    nextTitle: "Próximas canciones para aprender",
    nextIntro: (n: number) =>
      `${n} standards que parten de los cifrados de arriba, cada uno con una grabación de referencia para escuchar antes de transcribir.`,
  },
});

export async function generateMetadata({ params }: PageProps<"/[lang]/songs">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return {
    title: `${messages[lang].title} — Music Learnings`,
    description: messages[lang].description,
  };
}

export default async function SongsPage({ params }: PageProps<"/[lang]/songs">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = messages[lang];
  const songs = getAllSongs(lang);

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
      <SiteHeader lang={lang} />
      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10 sm:py-16">
        <div className="inline-flex items-center gap-2 rounded-full bg-tone-butter px-3 py-1 text-xs font-medium text-tone-butter-fg">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          Real Book
        </div>
        <h1 className="mt-5 font-display text-4xl sm:text-5xl">
          {t.title}
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground">
          {t.intro}
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
            {t.empty}
          </p>
        )}

        {suggestions.length > 0 && (
          <section className="mt-16 border-t border-border pt-10">
            <h2 className="font-display text-2xl sm:text-3xl">
              {t.nextTitle}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              {t.nextIntro(suggestions.length)}
            </p>
            <SongSuggestions
              lang={lang}
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
