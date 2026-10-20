import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { LickLibrary } from "@/components/licks/lick-library";
import { getAllLicks } from "@/lib/licks";
import { defineMessages, hasLocale } from "@/lib/i18n";

const messages = defineMessages({
  en: {
    title: "Licks",
    badge: "Vocabulary",
    description: "Jazz licks to search, learn and practice on the fretboard or the staff.",
    intro:
      "Phrases for ii–V–Is, turnarounds and blues. Filter by progression, player, technique or rhythm, then open a lick to hear it, step through it note by note and take it through all 12 keys.",
  },
  pt: {
    title: "Licks",
    badge: "Vocabulário",
    description: "Licks de jazz para buscar, aprender e praticar no braço ou na partitura.",
    intro:
      "Frases para ii–V–Is, turnarounds e blues. Filtre por progressão, músico, técnica ou ritmo e abra um lick para ouvir, avançar nota a nota e levar pelas 12 tonalidades.",
  },
  es: {
    title: "Licks",
    badge: "Vocabulario",
    description: "Licks de jazz para buscar, aprender y practicar en el mástil o la partitura.",
    intro:
      "Frases para ii–V–Is, turnarounds y blues. Filtra por progresión, músico, técnica o ritmo y abre un lick para escucharlo, recorrerlo nota a nota y llevarlo por las 12 tonalidades.",
  },
});

export async function generateMetadata({ params }: PageProps<"/[lang]/licks">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return {
    title: `${messages[lang].title} — Music Learnings`,
    description: messages[lang].description,
  };
}

export default async function LicksPage({ params }: PageProps<"/[lang]/licks">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = messages[lang];
  const licks = getAllLicks(lang);

  return (
    <>
      <SiteHeader lang={lang} />
      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10 sm:py-16">
        <div className="inline-flex items-center gap-2 rounded-full bg-tone-peach px-3 py-1 text-xs font-medium text-tone-peach-fg">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {t.badge}
        </div>
        <h1 className="mt-5 font-display text-4xl sm:text-5xl">{t.title}</h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground">{t.intro}</p>

        <LickLibrary
          licks={licks.map((l) => ({
            slug: l.slug,
            href: l.href,
            title: l.title[lang],
            description: l.description[lang],
            artist: l.artist,
            keyName: l.key,
            progression: l.progression,
            style: l.style,
            techniques: l.techniques,
            rhythms: l.rhythms,
            level: l.level,
            chords: l.chords,
          }))}
        />
      </main>
    </>
  );
}
