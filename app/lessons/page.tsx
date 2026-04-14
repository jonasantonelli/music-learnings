import Link from "next/link";
import { getTopSections, type TreeNode } from "@/lib/content";

type Section = Extract<TreeNode, { kind: "section" }>;

function collectLessons(node: Section) {
  const lessons: { href: string; title: string; description?: string }[] = [];
  const visit = (nodes: TreeNode[]) => {
    for (const c of nodes) {
      if (c.kind === "lesson") {
        lessons.push({
          href: c.lesson.href,
          title: c.lesson.frontmatter.title,
          description: c.lesson.frontmatter.description,
        });
      } else {
        visit(c.children);
      }
    }
  };
  visit(node.children);
  return lessons;
}

export default function LessonsIndex() {
  const sections = getTopSections();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Lessons</h1>
      <p className="mt-2 text-muted-foreground">
        Browse all lessons by section, or use the sidebar to jump to a specific
        topic.
      </p>

      {sections.map((section) => {
        const lessons = collectLessons(section);
        return (
          <section key={section.slug.join("/")} className="mt-10">
            <h2 className="text-lg font-semibold text-accent-11">
              {section.title}
            </h2>
            <ul className="mt-3 space-y-2">
              {lessons.map((lesson) => (
                <li key={lesson.href}>
                  <Link
                    href={lesson.href}
                    className="group block rounded-3xl border border-border bg-card p-4 transition-colors hover:border-accent-7 hover:bg-card-hover"
                  >
                    <div className="font-medium group-hover:text-accent-11 transition-colors">
                      {lesson.title}
                    </div>
                    {lesson.description && (
                      <div className="mt-1 text-sm text-muted-foreground">
                        {lesson.description}
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
