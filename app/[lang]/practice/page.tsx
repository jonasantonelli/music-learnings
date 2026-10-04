import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { NoteWheel } from "@/components/note-wheel";
import { defineMessages, hasLocale } from "@/lib/i18n";

const messages = defineMessages({
  en: { title: "Daily Practice", intro: "Spin the wheel to get your practice note." },
  pt: { title: "Prática Diária", intro: "Gire a roda para sortear a nota do seu estudo." },
  es: { title: "Práctica Diaria", intro: "Gira la rueda para obtener tu nota de práctica." },
});

export async function generateMetadata({ params }: PageProps<"/[lang]/practice">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: `${messages[lang].title} — Music Learnings` };
}

export default async function PracticePage({ params }: PageProps<"/[lang]/practice">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = messages[lang];
  return (
    <>
      <SiteHeader lang={lang} />
      <main className="mx-auto w-full max-w-lg px-4 sm:px-6 py-10 sm:py-16">
        <h1 className="text-center text-2xl sm:text-3xl font-semibold tracking-tight">
          {t.title}
        </h1>
        <p className="mt-3 text-center text-muted-foreground">
          {t.intro}
        </p>
        <div className="mt-8 sm:mt-12">
          <NoteWheel />
        </div>
      </main>
    </>
  );
}
