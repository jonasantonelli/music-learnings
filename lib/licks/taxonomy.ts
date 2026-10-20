import { defineMessages, type Locale } from "@/lib/i18n";
import type { RhythmFeature } from "./notation";

export const PROGRESSIONS = [
  "major-ii-v-i",
  "minor-ii-v-i",
  "v-i",
  "tritone-sub",
  "turnaround",
  "blues",
] as const;
export type Progression = (typeof PROGRESSIONS)[number];

export const STYLES = ["bebop", "mainstream", "soul-jazz", "post-bop", "modern", "fusion"] as const;
export type Style = (typeof STYLES)[number];

export const TECHNIQUES = [
  "arpeggio",
  "upper-structure",
  "enclosure",
  "chromatic-approach",
  "bebop-scale",
  "diminished",
  "harmonic-minor",
  "guide-tones",
  "blues-notes",
  "pentatonic",
  "triads",
  "side-slipping",
  "minor-conversion",
  "tritone-sub",
] as const;
export type Technique = (typeof TECHNIQUES)[number];

export const RHYTHMS: readonly RhythmFeature[] = [
  "eighths",
  "triplets",
  "sixteenths",
  "offbeat-start",
  "ties",
];

export type Level = 1 | 2 | 3;
export const LEVELS: readonly Level[] = [1, 2, 3];

const PROGRESSION_LABELS = defineMessages<Record<Progression, string>>({
  en: {
    "major-ii-v-i": "Major ii–V–I",
    "minor-ii-v-i": "Minor ii–V–i",
    "v-i": "V–I",
    "tritone-sub": "Tritone sub",
    turnaround: "Turnaround",
    blues: "Blues",
  },
  pt: {
    "major-ii-v-i": "ii–V–I maior",
    "minor-ii-v-i": "ii–V–i menor",
    "v-i": "V–I",
    "tritone-sub": "Substituição de trítono",
    turnaround: "Turnaround",
    blues: "Blues",
  },
  es: {
    "major-ii-v-i": "ii–V–I mayor",
    "minor-ii-v-i": "ii–V–i menor",
    "v-i": "V–I",
    "tritone-sub": "Sustitución tritonal",
    turnaround: "Turnaround",
    blues: "Blues",
  },
});

const STYLE_LABELS = defineMessages<Record<Style, string>>({
  en: {
    bebop: "Bebop",
    mainstream: "Mainstream",
    "soul-jazz": "Soul jazz",
    "post-bop": "Post-bop",
    modern: "Modern",
    fusion: "Fusion",
  },
  pt: {
    bebop: "Bebop",
    mainstream: "Mainstream",
    "soul-jazz": "Soul jazz",
    "post-bop": "Post-bop",
    modern: "Moderno",
    fusion: "Fusion",
  },
  es: {
    bebop: "Bebop",
    mainstream: "Mainstream",
    "soul-jazz": "Soul jazz",
    "post-bop": "Post-bop",
    modern: "Moderno",
    fusion: "Fusión",
  },
});

const TECHNIQUE_LABELS = defineMessages<Record<Technique, string>>({
  en: {
    arpeggio: "Arpeggio",
    "upper-structure": "3-to-9 arpeggio",
    enclosure: "Enclosure",
    "chromatic-approach": "Chromatic approach",
    "bebop-scale": "Bebop scale",
    diminished: "Diminished",
    "harmonic-minor": "Harmonic minor",
    "guide-tones": "Guide tones",
    "blues-notes": "Blue notes",
    pentatonic: "Pentatonic",
    triads: "Triads",
    "side-slipping": "Side-slipping",
    "minor-conversion": "Minor conversion",
    "tritone-sub": "Tritone sub",
  },
  pt: {
    arpeggio: "Arpejo",
    "upper-structure": "Arpejo da 3ª à 9ª",
    enclosure: "Bordadura (enclosure)",
    "chromatic-approach": "Aproximação cromática",
    "bebop-scale": "Escala bebop",
    diminished: "Diminuto",
    "harmonic-minor": "Menor harmônica",
    "guide-tones": "Notas-guia",
    "blues-notes": "Blue notes",
    pentatonic: "Pentatônica",
    triads: "Tríades",
    "side-slipping": "Side-slipping",
    "minor-conversion": "Conversão para menor",
    "tritone-sub": "Substituição de trítono",
  },
  es: {
    arpeggio: "Arpegio",
    "upper-structure": "Arpegio de 3ª a 9ª",
    enclosure: "Bordadura (enclosure)",
    "chromatic-approach": "Aproximación cromática",
    "bebop-scale": "Escala bebop",
    diminished: "Disminuido",
    "harmonic-minor": "Menor armónica",
    "guide-tones": "Notas guía",
    "blues-notes": "Blue notes",
    pentatonic: "Pentatónica",
    triads: "Tríadas",
    "side-slipping": "Side-slipping",
    "minor-conversion": "Conversión a menor",
    "tritone-sub": "Sustitución tritonal",
  },
});

const RHYTHM_LABELS = defineMessages<Record<RhythmFeature, string>>({
  en: {
    eighths: "Eighth notes",
    triplets: "Triplets",
    sixteenths: "Sixteenths",
    "offbeat-start": "Starts on the off-beat",
    ties: "Ties / anticipations",
  },
  pt: {
    eighths: "Colcheias",
    triplets: "Tercinas",
    sixteenths: "Semicolcheias",
    "offbeat-start": "Começa no contratempo",
    ties: "Ligaduras / antecipações",
  },
  es: {
    eighths: "Corcheas",
    triplets: "Tresillos",
    sixteenths: "Semicorcheas",
    "offbeat-start": "Empieza a contratiempo",
    ties: "Ligaduras / anticipaciones",
  },
});

const LEVEL_LABELS = defineMessages<Record<Level, string>>({
  en: { 1: "Beginner", 2: "Intermediate", 3: "Advanced" },
  pt: { 1: "Iniciante", 2: "Intermediário", 3: "Avançado" },
  es: { 1: "Principiante", 2: "Intermedio", 3: "Avanzado" },
});

export const progressionLabel = (p: Progression, l: Locale) => PROGRESSION_LABELS[l][p];
export const styleLabel = (s: Style, l: Locale) => STYLE_LABELS[l][s];
export const techniqueLabel = (t: Technique, l: Locale) => TECHNIQUE_LABELS[l][t];
export const rhythmLabel = (r: RhythmFeature, l: Locale) => RHYTHM_LABELS[l][r];
export const levelLabel = (v: Level, l: Locale) => LEVEL_LABELS[l][v];
