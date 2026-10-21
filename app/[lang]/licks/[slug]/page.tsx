import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { NoteText } from "@/components/note-text";
import { LickPractice } from "@/components/licks/lick-practice";
import { getAllLicks, getLickBySlug, type Lick } from "@/lib/licks";
import { displayChord } from "@/lib/licks/notation";
import {
  levelLabel,
  progressionLabel,
  rhythmLabel,
  styleLabel,
  techniqueLabel,
} from "@/lib/licks/taxonomy";
import { defineMessages, hasLocale, htmlLang, localizeHref, locales, type Locale } from "@/lib/i18n";

const messages = defineMessages({
  en: {
    back: "All licks",
    inStyleOf: (a: string) => `In the style of ${a}`,
    common: "Common bebop vocabulary",
    original:
      "An original line written in this style for study — not a transcription.",
    howTitle: "How to practice",
    how: [
      "Listen at a slow tempo with the chords on, until you can sing it.",
      "Step through it note by note (← →) and name each degree over its chord.",
      "Play along in a loop, starting around 60% of the tempo you can manage.",
      "Move it to other positions, then through all 12 keys with the cycle of 4ths.",
      "Use it in a tune with the same progression, changing the rhythm or the ending.",
    ],
    related: "Related licks",
  },
  pt: {
    back: "Todos os licks",
    inStyleOf: (a: string) => `No estilo de ${a}`,
    common: "Vocabulário bebop comum",
    original:
      "Frase original escrita neste estilo para estudo — não é uma transcrição.",
    howTitle: "Como praticar",
    how: [
      "Ouça em andamento lento com os acordes ligados, até conseguir cantar.",
      "Avance nota a nota (← →) e diga o grau de cada nota sobre o acorde.",
      "Toque junto em loop, começando por volta de 60% do andamento que você consegue.",
      "Leve para outras posições e depois pelas 12 tonalidades no ciclo de quartas.",
      "Use numa música com a mesma progressão, mudando o ritmo ou o final.",
    ],
    related: "Licks relacionados",
  },
  es: {
    back: "Todos los licks",
    inStyleOf: (a: string) => `Al estilo de ${a}`,
    common: "Vocabulario bebop común",
    original:
      "Frase original escrita en este estilo para estudiar, no una transcripción.",
    howTitle: "Cómo practicar",
    how: [
      "Escúchalo a tempo lento con los acordes activados, hasta poder cantarlo.",
      "Avanza nota a nota (← →) y nombra el grado de cada nota sobre su acorde.",
      "Toca encima en bucle, empezando alrededor del 60% del tempo que dominas.",
      "Llévalo a otras posiciones y luego por las 12 tonalidades con el ciclo de cuartas.",
      "Úsalo en un tema con la misma progresión, cambiando el ritmo o el final.",
    ],
    related: "Licks relacionados",
  },
});

export function generateStaticParams({ params }: { params: { lang: string } }) {
  if (!hasLocale(params.lang)) return [];
  return getAllLicks(params.lang).map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/licks/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) return {};
  const lick = getLickBySlug(lang, slug);
  if (!lick) return {};
  return {
    title: `${lick.title[lang]} — Licks — Music Learnings`,
    description: lick.description[lang],
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [htmlLang[l], `/${l}/licks/${slug}`])),
    },
  };
}

function related(lang: Locale, lick: Lick): Lick[] {
  const score = (l: Lick) =>
    (l.progression === lick.progression ? 2 : 0) +
    (l.artist && l.artist === lick.artist ? 2 : 0) +
    l.techniques.filter((x) => lick.techniques.includes(x)).length;
  return getAllLicks(lang)
    .filter((l) => l.slug !== lick.slug)
    .map((l) => ({ l, s: score(l) }))
    .filter(({ s }) => s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 4)
    .map(({ l }) => l);
}

export default async function LickPage({ params }: PageProps<"/[lang]/licks/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const lick = getLickBySlug(lang, slug);
  if (!lick) notFound();
  const t = messages[lang];

  return (
    <>
      <SiteHeader lang={lang} />
      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Link
          href={localizeHref(lang, "/licks")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Link>

        <header className="mt-5">
          <h1 className="font-display text-3xl leading-tight sm:text-5xl">
            <NoteText text={lick.title[lang]} />
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {lick.artist ? t.inStyleOf(lick.artist) : t.common}
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5 font-mono text-xs">
            <span className="rounded-md bg-tone-peach px-2 py-0.5 text-tone-peach-fg">
              {progressionLabel(lick.progression, lang)}
            </span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
              <NoteText text={displayChord(lick.key)} />
            </span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
              {styleLabel(lick.style, lang)}
            </span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
              {levelLabel(lick.level, lang)}
            </span>
            {lick.rhythms.map((r) => (
              <span key={r} className="rounded-md bg-tone-sky px-2 py-0.5 text-tone-sky-fg">
                {rhythmLabel(r, lang)}
              </span>
            ))}
            {lick.techniques.map((x) => (
              <span key={x} className="rounded-md bg-tone-lilac px-2 py-0.5 text-tone-lilac-fg">
                {techniqueLabel(x, lang)}
              </span>
            ))}
          </div>

          <p className="mt-5 text-base leading-relaxed">
            <NoteText text={lick.description[lang]} />
          </p>
          {lick.artist && <p className="mt-2 text-xs text-muted-foreground">{t.original}</p>}
        </header>

        <LickPractice lick={lick} />

        <section className="mt-12">
          <h2 className="font-display text-2xl">{t.howTitle}</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-foreground">
            {t.how.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        {related(lang, lick).length > 0 && (
          <section className="mt-12 border-t border-border pt-10">
            <h2 className="font-display text-2xl">{t.related}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {related(lang, lick).map((l) => (
                <Link
                  key={l.slug}
                  href={l.href}
                  className="rounded-card border border-border bg-card p-4 transition-colors hover:border-accent-7 hover:bg-card-hover"
                >
                  <div className="font-display text-base">
                    <NoteText text={l.title[lang]} />
                  </div>
                  <div className="mt-0.5 text-sm text-muted-foreground">
                    {progressionLabel(l.progression, lang)} · {l.artist ? t.inStyleOf(l.artist) : t.common}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
