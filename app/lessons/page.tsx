import Link from "next/link";
import {
  ArrowUpRight,
  ChartNoAxesColumnIncreasing,
  Layers,
  Spline,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { getTopSections, type TreeNode } from "@/lib/content";
import { TONES, TONE_DOTS, TONE_TEXT, sectionTone } from "@/lib/tones";
import { cn } from "@/lib/utils";

type Section = Extract<TreeNode, { kind: "section" }>;

const SECTION_ICONS: Record<string, LucideIcon> = {
  scales: ChartNoAxesColumnIncreasing,
  arpeggios: Spline,
  harmony: Layers,
  "bass-lines": Waves,
};

function collectLessons(node: Section) {
  const lessons: {
    href: string;
    title: string;
    description?: string;
    group?: string;
  }[] = [];
  const visit = (nodes: TreeNode[], group?: string) => {
    for (const c of nodes) {
      if (c.kind === "lesson") {
        lessons.push({
          href: c.lesson.href,
          title: c.lesson.frontmatter.title,
          description: c.lesson.frontmatter.description,
          group,
        });
      } else {
        visit(c.children, c.title);
      }
    }
  };
  visit(node.children);
  return lessons;
}

export default function LessonsIndex() {
  const sections = getTopSections();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="font-display text-4xl sm:text-5xl">Lessons</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground sm:text-lg">
        Browse all lessons by section, or use the sidebar to jump to a specific
        topic.
      </p>

      {sections.map((section, i) => {
        const key = section.slug.join("/");
        const tone = sectionTone(key, i);
        const Icon = SECTION_ICONS[key] ?? ChartNoAxesColumnIncreasing;
        const lessons = collectLessons(section);
        return (
          <section key={key} className="mt-12">
            <div className="mb-4 flex items-center gap-3">
              <span
                aria-hidden
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-[10px] dark:rounded-[12px]",
                  TONES[tone],
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
              </span>
              <h2 className="font-display text-2xl">{section.title}</h2>
              <span
                className={cn(
                  "ml-auto font-mono text-xs uppercase tracking-[0.08em]",
                  TONE_TEXT[tone],
                )}
              >
                {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
              </span>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {lessons.map((lesson) => (
                <li key={lesson.href}>
                  <Link
                    href={lesson.href}
                    className="group flex h-full flex-col gap-1.5 rounded-card border border-border bg-card p-4 transition-colors hover:border-accent-7 hover:bg-card-hover"
                  >
                    {lesson.group && (
                      <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                        <span
                          aria-hidden
                          className={cn("h-1.5 w-1.5 rounded-full", TONE_DOTS[tone])}
                        />
                        {lesson.group}
                      </span>
                    )}
                    <span className="flex items-start justify-between gap-2 font-medium">
                      {lesson.title}
                      <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </span>
                    {lesson.description && (
                      <span className="text-sm text-muted-foreground">
                        {lesson.description}
                      </span>
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
