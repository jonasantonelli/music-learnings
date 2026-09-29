// Pastel tone pairs (see --tone-* in globals.css). Full class strings so
// Tailwind can see them.
export const TONES = {
  lilac: "bg-tone-lilac text-tone-lilac-fg",
  mint: "bg-tone-mint text-tone-mint-fg",
  peach: "bg-tone-peach text-tone-peach-fg",
  sky: "bg-tone-sky text-tone-sky-fg",
  butter: "bg-tone-butter text-tone-butter-fg",
} as const;

/** Dot / swatch fill only. */
export const TONE_DOTS = {
  lilac: "bg-tone-lilac-fg dark:bg-tone-lilac",
  mint: "bg-tone-mint-fg dark:bg-tone-mint",
  peach: "bg-tone-peach-fg dark:bg-tone-peach",
  sky: "bg-tone-sky-fg dark:bg-tone-sky",
  butter: "bg-tone-butter-fg dark:bg-tone-butter",
} as const;

/** Label text: ink on light, the luminous pastel itself on dark. */
export const TONE_TEXT = {
  lilac: "text-tone-lilac-fg dark:text-tone-lilac",
  mint: "text-tone-mint-fg dark:text-tone-mint",
  peach: "text-tone-peach-fg dark:text-tone-peach",
  sky: "text-tone-sky-fg dark:text-tone-sky",
  butter: "text-tone-butter-fg dark:text-tone-butter",
} as const;

export type Tone = keyof typeof TONES;

const SECTION_TONES: Record<string, Tone> = {
  scales: "lilac",
  arpeggios: "mint",
  harmony: "peach",
  "bass-lines": "sky",
  songs: "butter",
};
const FALLBACK: Tone[] = ["lilac", "mint", "peach", "sky"];

/** Tone for a top-level content section, keyed by its slug. */
export function sectionTone(slug: string, index = 0): Tone {
  return SECTION_TONES[slug] ?? FALLBACK[index % FALLBACK.length];
}
