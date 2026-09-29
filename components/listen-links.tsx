import { AudioLines, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { spotifyUrl, youtubeUrl, type Recording } from "@/lib/recordings";

export function recordingLabel(recording: Recording): string {
  const album = recording.album
    ? ` · ${recording.album}${recording.year ? ` (${recording.year})` : ""}`
    : "";
  return `${recording.artist}${album}`;
}

export function ListenLinks({
  title,
  recording,
  className,
}: {
  title: string;
  recording: Recording;
  className?: string;
}) {
  const label = recordingLabel(recording);
  return (
    <div className={cn("flex flex-wrap gap-1.5 font-mono text-[11px]", className)}>
      <a
        href={youtubeUrl(title, recording)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Watch ${title} — ${label} on YouTube`}
        className="inline-flex items-center gap-1 rounded-md bg-tone-peach px-2 py-0.5 text-tone-peach-fg transition-opacity hover:opacity-80"
      >
        <Play className="h-3 w-3" aria-hidden />
        YouTube
      </a>
      <a
        href={spotifyUrl(title, recording)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Listen to ${title} — ${label} on Spotify`}
        className="inline-flex items-center gap-1 rounded-md bg-tone-mint px-2 py-0.5 text-tone-mint-fg transition-opacity hover:opacity-80"
      >
        <AudioLines className="h-3 w-3" aria-hidden />
        Spotify
      </a>
    </div>
  );
}
