import Link from "next/link";
import {
  ArrowRight,
  ChartNoAxesColumnIncreasing,
  Grid3x3,
  Layers,
  Music,
  Spline,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { getTopSections, type TreeNode } from "@/lib/content";
import { getAllSongs } from "@/lib/songs";
import { TONES, sectionTone, type Tone } from "@/lib/tones";
import { cn } from "@/lib/utils";

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

// Subsection names (or lesson titles when flat) summarise a section.
function summarize(node: Section): string {
  return node.children
    .map((c) => (c.kind === "lesson" ? c.lesson.frontmatter.title : c.title))
    .slice(0, 3)
    .join(", ");
}

const SECTION_ICONS: Record<string, LucideIcon> = {
  scales: ChartNoAxesColumnIncreasing,
  arpeggios: Spline,
  harmony: Layers,
  "bass-lines": Waves,
};

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

type CardProps = {
  href: string;
  title: string;
  meta: string;
  description: string;
  icon: LucideIcon;
  tone: Tone;
};

function SectionCard({ href, title, meta, description, icon: Icon, tone }: CardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-4 rounded-card border border-border bg-card p-5 transition-colors hover:border-accent-7 hover:bg-card-hover"
    >
      <div className="flex items-center justify-between">
        <span
          aria-hidden
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-[10px] dark:h-11 dark:w-11 dark:rounded-[14px]",
            TONES[tone],
          )}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
        </span>
        <span className="font-mono text-xs text-muted-foreground">{meta}</span>
      </div>
      <div>
        <div className="font-display text-[17px] dark:text-xl">{title}</div>
        <div className="mt-1 text-sm text-muted-foreground">{description}</div>
      </div>
    </Link>
  );
}

export default function Home() {
  const sections = getTopSections();
  const songs = getAllSongs();
  const totalLessons = sections.reduce((n, s) => n + countLessons(s), 0);
  const firstSection = sections[0];
  const startHref = firstSection ? findFirstLessonHref(firstSection) : undefined;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="bg-grid relative overflow-hidden rounded-card border border-border bg-card p-6 sm:p-12 dark:bg-background">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex max-w-2xl flex-col gap-5">
              <span className="inline-flex items-center gap-2 self-start rounded-full bg-tone-lilac px-3 py-1 text-xs font-medium text-tone-lilac-fg">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-dot dark:bg-tone-lilac-fg" />
                Personal knowledge base
              </span>
              <h1 className="font-display text-5xl leading-none sm:text-6xl dark:sm:text-7xl">
                Music <span className="dark:text-accent-9">Learnings</span>
              </h1>
              <p className="text-base text-muted-foreground sm:text-lg">
                A growing collection of notes and lessons from my music studies,
                focused on guitar harmony and voicings.
              </p>
              <div className="flex flex-wrap gap-2.5">
                {startHref && firstSection && (
                  <Link
                    href={startHref}
                    className="inline-flex h-11 items-center gap-2 rounded-control bg-accent-9 px-5 text-sm font-medium text-accent-contrast transition-colors hover:bg-accent-10"
                  >
                    Start with {firstSection.title}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                <Link
                  href="/songs"
                  className="inline-flex h-11 items-center rounded-control border border-border bg-card px-5 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Browse songs
                </Link>
              </div>
            </div>

            <dl className="grid w-full grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:w-72">
              <div className="bg-card p-4">
                <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Lessons
                </dt>
                <dd className="mt-1.5 font-display text-3xl">{totalLessons}</dd>
              </div>
              <div className="bg-card p-4">
                <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Songs
                </dt>
                <dd className="mt-1.5 font-display text-3xl">{songs.length}</dd>
              </div>
            </dl>
          </div>
        </section>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section, i) => {
            const key = section.slug.join("/");
            const style = {
              tone: sectionTone(key, i),
              icon: SECTION_ICONS[key] ?? ChartNoAxesColumnIncreasing,
            };
            return (
              <SectionCard
                key={key}
                href={findFirstLessonHref(section) ?? "/"}
                title={section.title}
                meta={plural(countLessons(section), "lesson")}
                description={summarize(section)}
                icon={style.icon}
                tone={style.tone}
              />
            );
          })}

          <SectionCard
            href="/songs"
            title="Songs"
            meta={plural(songs.length, "chart")}
            description="Standards with interactive chord charts"
            icon={Music}
            tone="butter"
          />

          <Link
            href="/chord-id"
            className="group flex flex-col gap-4 rounded-card bg-accent-9 p-5 text-accent-contrast transition-colors hover:bg-accent-10"
          >
            <div className="flex items-center justify-between">
              <span
                aria-hidden
                className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/10 text-tone-lilac dark:h-11 dark:w-11 dark:rounded-[14px] dark:bg-accent-contrast dark:text-accent-9"
              >
                <Grid3x3 className="h-[18px] w-[18px]" strokeWidth={2.2} />
              </span>
              <span className="font-mono text-xs opacity-70">Tool</span>
            </div>
            <div>
              <div className="font-display text-[17px] dark:text-xl">Chord Identifier</div>
              <div className="mt-1 text-sm opacity-75">
                Set notes on the fretboard, get the chord name
              </div>
            </div>
          </Link>
        </div>
      </main>
    </>
  );
}
