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
import { notFound } from "next/navigation";
import { getTopSections, type TreeNode } from "@/lib/content";
import { getAllSongs } from "@/lib/songs";
import { TONES, sectionTone, type Tone } from "@/lib/tones";
import { cn } from "@/lib/utils";
import { defineMessages, hasLocale, localizeHref } from "@/lib/i18n";

const messages = defineMessages({
  en: {
    badge: "Personal knowledge base",
    intro:
      "A growing collection of notes and lessons from my music studies, focused on guitar harmony and voicings.",
    start: (section: string) => `Start with ${section}`,
    browseSongs: "Browse songs",
    lessons: "Lessons",
    songs: "Songs",
    lessonCount: (n: number) => `${n} ${n === 1 ? "lesson" : "lessons"}`,
    chartCount: (n: number) => `${n} ${n === 1 ? "chart" : "charts"}`,
    songsDescription: "Standards with interactive chord charts",
    tool: "Tool",
    chordId: "Chord Identifier",
    chordIdDescription: "Set notes on the fretboard, get the chord name",
  },
  pt: {
    badge: "Base de conhecimento pessoal",
    intro:
      "Uma coleção crescente de notas e lições dos meus estudos de música, com foco em harmonia e voicings para guitarra.",
    start: (section: string) => `Começar por ${section}`,
    browseSongs: "Ver músicas",
    lessons: "Lições",
    songs: "Músicas",
    lessonCount: (n: number) => `${n} ${n === 1 ? "lição" : "lições"}`,
    chartCount: (n: number) => `${n} ${n === 1 ? "cifra" : "cifras"}`,
    songsDescription: "Standards com cifras interativas",
    tool: "Ferramenta",
    chordId: "Identificador de Acordes",
    chordIdDescription: "Marque notas no braço e descubra o nome do acorde",
  },
  es: {
    badge: "Base de conocimiento personal",
    intro:
      "Una colección creciente de notas y lecciones de mis estudios de música, centrada en armonía y voicings para guitarra.",
    start: (section: string) => `Empezar con ${section}`,
    browseSongs: "Ver canciones",
    lessons: "Lecciones",
    songs: "Canciones",
    lessonCount: (n: number) => `${n} ${n === 1 ? "lección" : "lecciones"}`,
    chartCount: (n: number) => `${n} ${n === 1 ? "cifrado" : "cifrados"}`,
    songsDescription: "Standards con cifrados interactivos",
    tool: "Herramienta",
    chordId: "Identificador de Acordes",
    chordIdDescription: "Marca notas en el mástil y obtén el nombre del acorde",
  },
});

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

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = messages[lang];
  const sections = getTopSections(lang);
  const songs = getAllSongs(lang);
  const totalLessons = sections.reduce((n, s) => n + countLessons(s), 0);
  const firstSection = sections[0];
  const startHref = firstSection ? findFirstLessonHref(firstSection) : undefined;

  return (
    <>
      <SiteHeader lang={lang} />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="bg-grid relative overflow-hidden rounded-card border border-border bg-card p-6 sm:p-12 dark:bg-background">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex max-w-2xl flex-col gap-5">
              <span className="inline-flex items-center gap-2 self-start rounded-full bg-tone-lilac px-3 py-1 text-xs font-medium text-tone-lilac-fg">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-dot dark:bg-tone-lilac-fg" />
                {t.badge}
              </span>
              <h1 className="font-display text-5xl leading-none sm:text-6xl dark:sm:text-7xl">
                Music <span className="dark:text-accent-9">Learnings</span>
              </h1>
              <p className="text-base text-muted-foreground sm:text-lg">
                {t.intro}
              </p>
              <div className="flex flex-wrap gap-2.5">
                {startHref && firstSection && (
                  <Link
                    href={startHref}
                    className="inline-flex h-11 items-center gap-2 rounded-control bg-accent-9 px-5 text-sm font-medium text-accent-contrast transition-colors hover:bg-accent-10"
                  >
                    {t.start(firstSection.title)}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                <Link
                  href={localizeHref(lang, "/songs")}
                  className="inline-flex h-11 items-center rounded-control border border-border bg-card px-5 text-sm font-medium transition-colors hover:bg-muted"
                >
                  {t.browseSongs}
                </Link>
              </div>
            </div>

            <dl className="grid w-full grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:w-72">
              <div className="bg-card p-4">
                <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {t.lessons}
                </dt>
                <dd className="mt-1.5 font-display text-3xl">{totalLessons}</dd>
              </div>
              <div className="bg-card p-4">
                <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {t.songs}
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
                href={findFirstLessonHref(section) ?? localizeHref(lang, "/")}
                title={section.title}
                meta={t.lessonCount(countLessons(section))}
                description={summarize(section)}
                icon={style.icon}
                tone={style.tone}
              />
            );
          })}

          <SectionCard
            href={localizeHref(lang, "/songs")}
            title={t.songs}
            meta={t.chartCount(songs.length)}
            description={t.songsDescription}
            icon={Music}
            tone="butter"
          />

          <Link
            href={localizeHref(lang, "/chord-id")}
            className="group flex flex-col gap-4 rounded-card bg-accent-9 p-5 text-accent-contrast transition-colors hover:bg-accent-10"
          >
            <div className="flex items-center justify-between">
              <span
                aria-hidden
                className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/10 text-tone-lilac dark:h-11 dark:w-11 dark:rounded-[14px] dark:bg-accent-contrast dark:text-accent-9"
              >
                <Grid3x3 className="h-[18px] w-[18px]" strokeWidth={2.2} />
              </span>
              <span className="font-mono text-xs opacity-70">{t.tool}</span>
            </div>
            <div>
              <div className="font-display text-[17px] dark:text-xl">{t.chordId}</div>
              <div className="mt-1 text-sm opacity-75">
                {t.chordIdDescription}
              </div>
            </div>
          </Link>
        </div>
      </main>
    </>
  );
}
