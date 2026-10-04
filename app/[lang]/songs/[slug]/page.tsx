import { notFound } from "next/navigation";
import { ListenLinks, recordingLabel } from "@/components/listen-links";
import { SiteHeader } from "@/components/site-header";
import { SongSuggestions } from "@/components/song-suggestions";
import { getAllSongs, getSongBySlug } from "@/lib/songs";
import { SONG_SUGGESTIONS } from "@/lib/song-suggestions";
import { formatKey } from "@/lib/song-analysis";
import { localizedAnchor } from "@/components/mdx/localized-link";
import { useMDXComponents } from "@/mdx-components";
import { defineMessages, hasLocale, htmlLang, locales } from "@/lib/i18n";

const messages = defineMessages({
  en: {
    description: (title: string, composer: string) =>
      `${title} by ${composer} — chord chart and study notes.`,
    form: "Form",
    listen: "Listen",
    studyNext: "Study next",
    buildsOn: (title: string) => `Standards that build on ${title}.`,
  },
  pt: {
    description: (title: string, composer: string) =>
      `${title}, de ${composer} — cifra e notas de estudo.`,
    form: "Forma",
    listen: "Ouça",
    studyNext: "Estude a seguir",
    buildsOn: (title: string) => `Standards que partem de ${title}.`,
  },
  es: {
    description: (title: string, composer: string) =>
      `${title}, de ${composer} — cifrado y notas de estudio.`,
    form: "Forma",
    listen: "Escucha",
    studyNext: "Estudia después",
    buildsOn: (title: string) => `Standards que parten de ${title}.`,
  },
});

export function generateStaticParams({ params }: { params: { lang: string } }) {
  if (!hasLocale(params.lang)) return [];
  return getAllSongs(params.lang).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/songs/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) return {};
  const song = getSongBySlug(lang, slug);
  if (!song) return {};
  return {
    title: `${song.frontmatter.title} — Music Learnings`,
    description: messages[lang].description(
      song.frontmatter.title,
      song.frontmatter.composer,
    ),
    alternates: {
      languages: Object.fromEntries(
        locales.map((l) => [htmlLang[l], `/${l}/songs/${slug}`]),
      ),
    },
  };
}

export default async function SongPage({
  params,
}: PageProps<"/[lang]/songs/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const song = getSongBySlug(lang, slug);
  if (!song) notFound();
  const t = messages[lang];

  const mod = await import(`@/content/${song.contentLang}/songs/${slug}.mdx`);
  const Content = mod.default;
  const components = useMDXComponents({ a: localizedAnchor(lang) });

  const fm = song.frontmatter;
  const studyNext = SONG_SUGGESTIONS.filter((s) => s.relatedTo.includes(slug));

  return (
    <>
      <SiteHeader lang={lang} />
      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <header className="mb-8">
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">
            {fm.title}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">{fm.composer}</p>

          <div className="mt-4 flex flex-wrap gap-1.5 font-mono text-xs">
            <span className="rounded-md bg-tone-butter px-2 py-0.5 text-tone-butter-fg">
              {formatKey(fm.key, lang)}
            </span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
              {fm.time_signature}
            </span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
              {fm.tempo_feel}
            </span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
              {t.form}: {fm.form}
            </span>
            {fm.tags.map((t) => (
              <span
                key={t}
                className="rounded-md bg-tone-lilac px-2 py-0.5 text-tone-lilac-fg"
              >
                {t}
              </span>
            ))}
          </div>

          {fm.recordings.length > 0 && (
            <div className="mt-5 space-y-2">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t.listen}
              </div>
              {fm.recordings.map((r) => (
                <div
                  key={`${r.artist}-${r.album}`}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1.5"
                >
                  <span className="text-sm">{recordingLabel(r)}</span>
                  <ListenLinks lang={lang} title={fm.title} recording={r} />
                </div>
              ))}
            </div>
          )}
        </header>

        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <Content components={components} />
        </div>

        {studyNext.length > 0 && (
          <section className="mt-16 border-t border-border pt-10">
            <h2 className="font-display text-2xl">{t.studyNext}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.buildsOn(fm.title)}
            </p>
            <SongSuggestions
              lang={lang}
              suggestions={studyNext}
              songs={getAllSongs(lang).map((s) => ({
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
