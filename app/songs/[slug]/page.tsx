import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getAllSongs, getSongBySlug } from "@/lib/songs";
import { useMDXComponents } from "@/mdx-components";

export function generateStaticParams() {
  return getAllSongs().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const song = getSongBySlug(slug);
  if (!song) return {};
  return {
    title: `${song.frontmatter.title} — Music Learnings`,
    description: `${song.frontmatter.title} by ${song.frontmatter.composer} — chord chart and study notes.`,
  };
}

export default async function SongPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const song = getSongBySlug(slug);
  if (!song) notFound();

  const mod = await import(`@/content/songs/${slug}.mdx`);
  const Content = mod.default;
  const components = useMDXComponents({});

  const fm = song.frontmatter;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <header className="mb-8">
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">
            {fm.title}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">{fm.composer}</p>

          <div className="mt-4 flex flex-wrap gap-1.5 font-mono text-xs">
            <span className="rounded-md bg-tone-butter px-2 py-0.5 text-tone-butter-fg">
              {fm.key}
            </span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
              {fm.time_signature}
            </span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
              {fm.tempo_feel}
            </span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
              Form: {fm.form}
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
        </header>

        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <Content components={components} />
        </div>
      </main>
    </>
  );
}
