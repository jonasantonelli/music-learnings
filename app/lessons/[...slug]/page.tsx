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
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          {lesson.frontmatter.title}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {lesson.frontmatter.description}
        </p>
        {lesson.frontmatter.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {lesson.frontmatter.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-accent-6 bg-accent-3 px-2.5 py-0.5 text-xs font-medium text-accent-11"
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
