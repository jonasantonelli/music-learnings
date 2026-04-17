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
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            {fm.title}
          </h1>
          <p className="mt-1 text-muted-foreground">{fm.composer}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-accent-6 bg-accent-3 px-2.5 py-0.5 text-xs font-medium text-accent-11">
              {fm.key}
            </span>
            <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {fm.time_signature}
            </span>
            <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {fm.tempo_feel}
            </span>
            <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Form: {fm.form}
            </span>
            {fm.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-accent-6 bg-accent-3 px-2.5 py-0.5 text-xs font-medium text-accent-11"
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
