import { notFound } from "next/navigation";
import { getAllLessons, getLessonBySlug } from "@/lib/content";
import { useMDXComponents } from "@/mdx-components";

export function generateStaticParams() {
  return getAllLessons().map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const lesson = getLessonBySlug(slug);
  if (!lesson) return {};
  return {
    title: `${lesson.frontmatter.title} — Music Learnings`,
    description: lesson.frontmatter.description,
  };
}

const TAG_TONES = [
  "bg-tone-lilac text-tone-lilac-fg",
  "bg-tone-mint text-tone-mint-fg",
  "bg-tone-sky text-tone-sky-fg",
  "bg-tone-peach text-tone-peach-fg",
];

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const lesson = getLessonBySlug(slug);
  if (!lesson) notFound();

  // Dynamic import of the MDX file. Webpack/Turbopack resolves the glob at build time.
  const mod = await import(`@/content/${slug.join("/")}.mdx`);
  const Content = mod.default;
  const components = useMDXComponents({});

  return (
    <article className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <header className="mb-10">
        {slug.length > 1 && (
          <p className="mb-3 font-mono text-xs capitalize text-muted-foreground">
            {slug.slice(0, -1).map((s) => s.replace(/-/g, " ")).join(" / ")}
          </p>
        )}
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">
          {lesson.frontmatter.title}
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
          {lesson.frontmatter.description}
        </p>
        {lesson.frontmatter.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {lesson.frontmatter.tags.map((t, i) => (
              <span
                key={t}
                className={`rounded-md px-2 py-0.5 font-mono text-xs ${TAG_TONES[i % TAG_TONES.length]}`}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </header>
      <div className="prose prose-zinc dark:prose-invert max-w-none">
        <Content components={components} />
      </div>
    </article>
  );
}
