import { z } from "zod";

export const recordingSchema = z.object({
  artist: z.string().min(1),
  album: z.string().optional(),
  year: z.number().int().optional(),
  youtube: z.string().url().optional(),
  spotify: z.string().url().optional(),
});

export type Recording = z.infer<typeof recordingSchema>;

function searchQuery(title: string, recording: Recording): string {
  return [title, recording.artist, recording.album].filter(Boolean).join(" ");
}

/** Direct link when known, otherwise a YouTube search for this recording. */
export function youtubeUrl(title: string, recording: Recording): string {
  return (
    recording.youtube ??
    `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery(title, recording))}`
  );
}

/** Direct link when known, otherwise a Spotify search for this recording. */
export function spotifyUrl(title: string, recording: Recording): string {
  return (
    recording.spotify ??
    `https://open.spotify.com/search/${encodeURIComponent(searchQuery(title, recording))}`
  );
}
