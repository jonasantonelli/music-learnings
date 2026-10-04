import { AudioLines, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { spotifyUrl, youtubeUrl, type Recording } from "@/lib/recordings";
import { defineMessages, type Locale } from "@/lib/i18n";

const messages = defineMessages({
  en: {
    watch: (what: string) => `Watch ${what} on YouTube`,
    listen: (what: string) => `Listen to ${what} on Spotify`,
  },
  pt: {
    watch: (what: string) => `Assistir ${what} no YouTube`,
    listen: (what: string) => `Ouvir ${what} no Spotify`,
  },
  es: {
    watch: (what: string) => `Ver ${what} en YouTube`,
    listen: (what: string) => `Escuchar ${what} en Spotify`,
  },
});

export function recordingLabel(recording: Recording): string {
  const album = recording.album
    ? ` · ${recording.album}${recording.year ? ` (${recording.year})` : ""}`
    : "";
  return `${recording.artist}${album}`;
}

export function ListenLinks({
  lang,
  title,
  recording,
  className,
}: {
  lang: Locale;
  title: string;
  recording: Recording;
  className?: string;
}) {
  const t = messages[lang];
  const label = recordingLabel(recording);
  return (
    <div className={cn("flex flex-wrap gap-1.5 font-mono text-[11px]", className)}>
      <a
        href={youtubeUrl(title, recording)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t.watch(`${title} — ${label}`)}
        className="inline-flex items-center gap-1 rounded-md bg-tone-peach px-2 py-0.5 text-tone-peach-fg transition-opacity hover:opacity-80"
      >
        <Play className="h-3 w-3" aria-hidden />
        YouTube
      </a>
      <a
        href={spotifyUrl(title, recording)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t.listen(`${title} — ${label}`)}
        className="inline-flex items-center gap-1 rounded-md bg-tone-mint px-2 py-0.5 text-tone-mint-fg transition-opacity hover:opacity-80"
      >
        <AudioLines className="h-3 w-3" aria-hidden />
        Spotify
      </a>
    </div>
  );
}
