import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { getTopSections, type TreeNode } from "@/lib/content";

type Section = Extract<TreeNode, { kind: "section" }>;

function countLessons(node: Section): number {
  let n = 0;
  const visit = (nodes: TreeNode[]) => {
    for (const c of nodes) {
      if (c.kind === "lesson") n++;
      else visit(c.children);
    }
  };
  visit(node.children);
  return n;
}

function findFirstLessonHref(node: Section): string | undefined {
  for (const c of node.children) {
    if (c.kind === "lesson") return c.lesson.href;
    const nested = findFirstLessonHref(c);
    if (nested) return nested;
  }
  return undefined;
}

export default function Home() {
  const sections = getTopSections();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-10 sm:py-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-accent-3 px-3 py-1 text-xs font-medium text-accent-11">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-9" />
          Personal knowledge base
        </div>
        <h1 className="mt-5 text-3xl sm:text-4xl font-semibold tracking-tight">
          Music <span className="text-accent-11">Learnings</span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground">
          A growing collection of notes and lessons from my music studies,
          focused on guitar harmony and voicings.
        </p>

        <div className="mt-10 sm:mt-12 grid gap-4 sm:grid-cols-2">
          {sections.map((section) => {
            const first = findFirstLessonHref(section);
            const count = countLessons(section);
            return (
              <Link
                key={section.slug.join("/")}
                href={first ?? "/"}
                className="group relative overflow-hidden rounded-3xl border border-border bg-card p-5 transition-colors hover:border-accent-7 hover:bg-card-hover"
              >
                <div
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1 bg-accent-9 opacity-60 transition-opacity group-hover:opacity-100"
                />
                <div className="font-medium group-hover:text-accent-11 transition-colors">
                  {section.title}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {count} lesson{count === 1 ? "" : "s"}
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
