import Link from "next/link";
import { ListenLinks, recordingLabel } from "@/components/listen-links";
import {
  baseTitle,
  SUGGESTION_STYLE_LABELS,
  type SongSuggestion,
} from "@/lib/song-suggestions";
import { formatKey } from "@/lib/song-analysis";
import { defineMessages, type Locale } from "@/lib/i18n";

const messages = defineMessages({
  en: { buildsOn: "Builds on" },
  pt: { buildsOn: "Baseia-se em" },
  es: { buildsOn: "Se basa en" },
});

type RelatedSong = { slug: string; href: string; title: string };

export function SongSuggestions({
  lang,
  suggestions,
  songs,
}: {
  lang: Locale;
  suggestions: SongSuggestion[];
  songs: RelatedSong[];
}) {
  const bySlug = new Map(songs.map((s) => [s.slug, s]));
  const byTitle = new Map(songs.map((s) => [baseTitle(s.title), s]));

  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      {suggestions.map((s) => {
        const related = s.relatedTo
          .map((slug) => bySlug.get(slug))
          .filter((x): x is RelatedSong => Boolean(x));
        const chart = byTitle.get(baseTitle(s.title));
        return (
          <div
            key={s.title}
            className="flex flex-col rounded-card border border-border bg-card p-4"
          >
            {chart ? (
              <Link
                href={chart.href}
                className="font-display text-base hover:text-accent-11 transition-colors"
              >
                {s.title} <span aria-hidden>→</span>
              </Link>
            ) : (
              <div className="font-display text-base">{s.title}</div>
            )}
            <div className="mt-0.5 text-sm text-muted-foreground">
              {s.composer}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[11px]">
              <span className="rounded-md bg-tone-butter px-2 py-0.5 text-tone-butter-fg">
                {formatKey(s.key, lang)}
              </span>
              <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                {SUGGESTION_STYLE_LABELS[s.style][lang]}
              </span>
            </div>
            <p className="mt-3 text-sm text-foreground/90">{s.why[lang]}</p>
            {related.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                {messages[lang].buildsOn}{" "}
                {related.map((r, i) => (
                  <span key={r.slug}>
                    {i > 0 && ", "}
                    <Link
                      href={r.href}
                      className="text-accent-11 hover:text-accent-12 transition-colors"
                    >
                      {r.title}
                    </Link>
                  </span>
                ))}
              </p>
            )}
            <div className="mt-auto pt-3">
              <div className="text-xs text-muted-foreground">
                {recordingLabel(s.recording)}
              </div>
              <ListenLinks
                lang={lang}
                title={s.title}
                recording={s.recording}
                className="mt-1.5"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
