import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { ChordIdentifier } from "@/components/chord-identifier";
import { defineMessages, hasLocale } from "@/lib/i18n";

const messages = defineMessages({
  en: {
    title: "Chord Identifier",
    description:
      "Set notes on a guitar fretboard and get the chord name back, with intervals and alternate readings.",
    intro:
      "Place notes on the fretboard. The most likely chord name appears below, along with the intervals, the notes you played, and other readings.",
  },
  pt: {
    title: "Identificador de Acordes",
    description:
      "Marque notas no braço da guitarra e descubra o nome do acorde, com intervalos e leituras alternativas.",
    intro:
      "Marque notas no braço. O nome de acorde mais provável aparece abaixo, junto com os intervalos, as notas tocadas e outras leituras possíveis.",
  },
  es: {
    title: "Identificador de Acordes",
    description:
      "Marca notas en el mástil de la guitarra y obtén el nombre del acorde, con intervalos y lecturas alternativas.",
    intro:
      "Marca notas en el mástil. El nombre de acorde más probable aparece abajo, junto con los intervalos, las notas que tocaste y otras lecturas posibles.",
  },
});

export async function generateMetadata({ params }: PageProps<"/[lang]/chord-id">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return {
    title: `${messages[lang].title} — Music Learnings`,
    description: messages[lang].description,
  };
}

export default async function ChordIdPage({ params }: PageProps<"/[lang]/chord-id">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = messages[lang];
  return (
    <>
      <SiteHeader lang={lang} />
      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10 sm:py-14">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          {t.title}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t.intro}
        </p>
        <div className="mt-8">
          <ChordIdentifier />
        </div>
      </main>
    </>
  );
}
