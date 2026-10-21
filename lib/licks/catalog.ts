import type { Locale } from "@/lib/i18n";
import type { Level, Progression, Style, Technique } from "./taxonomy";

/**
 * A lick as authored. `notes` uses the format documented in ./notation.ts;
 * `chords` has one entry per bar ("Dm7 G7" splits a bar in half). Rhythm
 * filters are derived from the notes, so they are not listed here.
 *
 * These are original lines written in the style of each player (not
 * transcriptions), so `artist` reads as "in the style of".
 */
export type LickDefinition = {
  slug: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  artist?: string;
  key: string;
  progression: Progression;
  style: Style;
  techniques: Technique[];
  level: Level;
  chords: string[];
  notes: string;
};

export const LICKS: LickDefinition[] = [
  {
    slug: "parker-3-to-flat-9",
    title: {
      en: "3-to-♭9 over the V",
      pt: "Da 3ª à ♭9 no V",
      es: "De la 3ª a la ♭9 en el V",
    },
    description: {
      en: "The ii arpeggio climbs to the 9th, its 7th falls a half step onto the 3rd of the V, then a diminished arpeggio (3-5-7-♭9) whose ♭9 resolves down to the 5th of I.",
      pt: "O arpejo do ii sobe até a 9ª, a 7ª desce meio tom para a 3ª do V e vem um arpejo diminuto (3-5-7-♭9), com a ♭9 resolvendo na 5ª do I.",
      es: "El arpegio del ii sube hasta la 9ª, su 7ª baja medio tono a la 3ª del V y llega un arpegio disminuido (3-5-7-♭9), cuya ♭9 resuelve en la 5ª del I.",
    },
    artist: "Charlie Parker",
    key: "C",
    progression: "major-ii-v-i",
    style: "bebop",
    techniques: ["arpeggio", "diminished", "guide-tones"],
    level: 1,
    chords: ["Dm7", "G7", "Cmaj7"],
    notes:
      "r/8 D4/8 F4/8 A4/8 C5/8 E5/8 D5/8 C5/8 | B4/8 D5/8 F5/8 Ab5/8 G5/8 F5/8 D5/8 B4/8 | C5/4 r/8 E5/8 G5/4 r/4",
  },
  {
    slug: "parker-enclosure-to-the-third",
    title: {
      en: "Enclosure into the 3rd",
      pt: "Bordadura na 3ª",
      es: "Bordadura a la 3ª",
    },
    description: {
      en: "C above and A♯ below trap the B that lands on beat one of G7 — the bebop enclosure. The V line then slides chromatically from the 9th to the 5th.",
      pt: "Dó por cima e Lá♯ por baixo cercam o Si que cai no tempo 1 do G7 — a bordadura do bebop. A linha do V desce cromaticamente da 9ª até a 5ª.",
      es: "Do por arriba y La♯ por abajo encierran el Si que cae en el tiempo 1 del G7: la bordadura del bebop. La línea del V baja cromáticamente de la 9ª a la 5ª.",
    },
    artist: "Charlie Parker",
    key: "C",
    progression: "major-ii-v-i",
    style: "bebop",
    techniques: ["enclosure", "chromatic-approach", "arpeggio"],
    level: 1,
    chords: ["Dm7", "G7", "Cmaj7"],
    notes:
      "D4/8 F4/8 A4/8 C5/8 E5/8 D5/8 C5/8 A#4/8 | B4/8 D5/8 F5/8 A5/8 Ab5/8 G5/8 F5/8 D5/8 | E5/4 r/4 r/2",
  },
  {
    slug: "bebop-dominant-descent",
    title: {
      en: "Bebop dominant scale descent",
      pt: "Descida pela escala bebop dominante",
      es: "Descenso por la escala bebop dominante",
    },
    description: {
      en: "From the root of G7, the bebop dominant scale (with the passing F♯) puts every chord tone — G, F, D, B — on a beat.",
      pt: "A partir da fundamental do G7, a escala bebop dominante (com o Fá♯ de passagem) coloca todas as notas do acorde — Sol, Fá, Ré, Si — nos tempos.",
      es: "Desde la fundamental de G7, la escala bebop dominante (con el Fa♯ de paso) pone cada nota del acorde — Sol, Fa, Re, Si — en un tiempo.",
    },
    key: "C",
    progression: "major-ii-v-i",
    style: "bebop",
    techniques: ["bebop-scale", "chromatic-approach"],
    level: 1,
    chords: ["Dm7", "G7", "Cmaj7"],
    notes:
      "r/8 A4/8 D5/8 F5/8 A5/8 G5/8 F5/8 E5/8 | G5/8 F#5/8 F5/8 E5/8 D5/8 C5/8 B4/8 A4/8 | G4/4 E4/8 G4/8 C5/2",
  },
  {
    slug: "parker-minor-diminished",
    title: {
      en: "Minor ii–V–i with the diminished V",
      pt: "ii–V–i menor com o V diminuto",
      es: "ii–V–i menor con el V disminuido",
    },
    description: {
      en: "The same 3-to-♭9 idea in minor: a half-diminished arpeggio, then B–D–F–A♭ over G7♭9 and a scalar fall into C minor, landing on the 6th.",
      pt: "A mesma ideia da 3ª à ♭9, agora em menor: arpejo meio-diminuto, depois Si–Ré–Fá–Lá♭ sobre G7♭9 e uma descida para Dó menor, pousando na 6ª.",
      es: "La misma idea de 3ª a ♭9 en menor: arpegio semidisminuido, luego Si–Re–Fa–La♭ sobre G7♭9 y una caída a Do menor que termina en la 6ª.",
    },
    artist: "Charlie Parker",
    key: "Cm",
    progression: "minor-ii-v-i",
    style: "bebop",
    techniques: ["diminished", "harmonic-minor", "arpeggio"],
    level: 2,
    chords: ["Dm7b5", "G7b9", "Cm6"],
    notes:
      "r/8 D4/8 F4/8 Ab4/8 C5/8 Eb5/8 D5/8 C5/8 | B4/8 D5/8 F5/8 Ab5/8 G5/8 F5/8 Eb5/8 D5/8 | C5/4 r/8 Eb5/8 G5/8 A5/8 G5/4",
  },
  {
    slug: "parker-triplet-turns",
    title: {
      en: "Triplet arpeggio pickups",
      pt: "Arpejos em tercina",
      es: "Arpegios en tresillo",
    },
    description: {
      en: "Each bar opens with a quick triplet that launches the line — a Parker rhythmic fingerprint. Over Cmaj7 the line rises to the 13th.",
      pt: "Cada compasso começa com uma tercina rápida que lança a frase — uma marca rítmica do Parker. Sobre Cmaj7 a linha sobe até a 13ª.",
      es: "Cada compás empieza con un tresillo rápido que lanza la frase, una huella rítmica de Parker. Sobre Cmaj7 la línea sube hasta la 13ª.",
    },
    artist: "Charlie Parker",
    key: "C",
    progression: "major-ii-v-i",
    style: "bebop",
    techniques: ["arpeggio", "diminished"],
    level: 2,
    chords: ["Dm7", "G7", "Cmaj7"],
    notes:
      "D5/8t E5/8t F5/8t A5/8 G5/8 F5/8 E5/8 D5/8 C5/8 | B4/8t C5/8t D5/8t F5/8 Ab5/8 G5/8 F5/8 D5/8 B4/8 | C5/8 E5/8 G5/8 B5/8 A5/2",
  },
  {
    slug: "turnaround-diminished-chain",
    title: {
      en: "I–VI–ii–V with diminished dominants",
      pt: "I–VI–ii–V com dominantes diminutos",
      es: "I–VI–ii–V con dominantes disminuidos",
    },
    description: {
      en: "Two chords per bar. Each dominant gets its ♭9 diminished arpeggio (C♯–E–G–B♭ on A7, B–D–F–A♭ on G7), and each ♭9 steps down into the next chord.",
      pt: "Dois acordes por compasso. Cada dominante ganha o seu arpejo diminuto com ♭9 (Dó♯–Mi–Sol–Si♭ no A7, Si–Ré–Fá–Lá♭ no G7), e cada ♭9 desce para o acorde seguinte.",
      es: "Dos acordes por compás. Cada dominante recibe su arpegio disminuido con ♭9 (Do♯–Mi–Sol–Si♭ en A7, Si–Re–Fa–La♭ en G7) y cada ♭9 baja al acorde siguiente.",
    },
    key: "C",
    progression: "turnaround",
    style: "bebop",
    techniques: ["diminished", "guide-tones", "arpeggio"],
    level: 2,
    chords: ["Cmaj7 A7b9", "Dm7 G7b9", "Cmaj7"],
    notes:
      "E5/8 G5/8 B5/8 A5/8 C#5/8 E5/8 G5/8 Bb5/8 | A5/8 F5/8 D5/8 C5/8 B4/8 D5/8 F5/8 Ab5/8 | G5/4 E5/4 C5/2",
  },
  {
    slug: "v-i-flat-9-resolution",
    title: {
      en: "V–I with ♭9 resolution",
      pt: "V–I com resolução da ♭9",
      es: "V–I con resolución de la ♭9",
    },
    description: {
      en: "A short two-bar cadence: the G7 arpeggio tops out on A♭ (♭9), which falls to G, and the line lands on the 3rd of C.",
      pt: "Uma cadência curta de dois compassos: o arpejo de G7 chega ao Lá♭ (♭9), que cai para Sol, e a frase pousa na 3ª de Dó.",
      es: "Una cadencia corta de dos compases: el arpegio de G7 llega al La♭ (♭9), que cae a Sol, y la frase se posa en la 3ª de Do.",
    },
    key: "C",
    progression: "v-i",
    style: "bebop",
    techniques: ["arpeggio", "guide-tones"],
    level: 1,
    chords: ["G7", "Cmaj7"],
    notes: "r/8 G4/8 B4/8 D5/8 F5/8 Ab5/8 G5/8 F5/8 | E5/4 C5/8 B4/8 G4/2",
  },
  {
    slug: "minor-harmonic-descent",
    title: {
      en: "Harmonic minor fall",
      pt: "Descida pela menor harmônica",
      es: "Caída por la menor armónica",
    },
    description: {
      en: "In A minor: a B half-diminished arpeggio up to C, then E7♭9 as G♯–F–D–B and a harmonic-minor descent onto the 6th of Am6.",
      pt: "Em Lá menor: arpejo de Si meio-diminuto até o Dó, depois E7♭9 como Sol♯–Fá–Ré–Si e uma descida pela menor harmônica até a 6ª de Am6.",
      es: "En La menor: arpegio de Si semidisminuido hasta Do, luego E7♭9 como Sol♯–Fa–Re–Si y un descenso por la menor armónica hasta la 6ª de Am6.",
    },
    key: "Am",
    progression: "minor-ii-v-i",
    style: "bebop",
    techniques: ["harmonic-minor", "diminished"],
    level: 2,
    chords: ["Bm7b5", "E7b9", "Am6"],
    notes:
      "r/8 B4/8 D5/8 F5/8 A5/8 C6/8 B5/8 A5/8 | G#5/8 F5/8 D5/8 B4/8 C5/8 B4/8 A4/8 G#4/8 | A4/4 C5/8 E5/8 F#5/2",
  },
  {
    slug: "tritone-sub-line",
    title: {
      en: "ii–♭II7–I line",
      pt: "Frase sobre ii–♭II7–I",
      es: "Frase sobre ii–♭II7–I",
    },
    description: {
      en: "D♭7 replaces G7 (same tritone, F and B/C♭). The line arpeggiates D♭7 and walks down chromatically, so A♭ falls a half step to G over C.",
      pt: "Db7 substitui o G7 (mesmo trítono, Fá e Si/Dó♭). A frase arpeja Db7 e desce cromaticamente, e o Lá♭ cai meio tom para o Sol sobre Dó.",
      es: "Db7 sustituye a G7 (mismo tritono, Fa y Si/Do♭). La frase arpegia Db7 y baja cromáticamente, y el La♭ cae medio tono al Sol sobre Do.",
    },
    key: "C",
    progression: "tritone-sub",
    style: "mainstream",
    techniques: ["tritone-sub", "upper-structure", "chromatic-approach"],
    level: 2,
    chords: ["Dm7", "Db7", "Cmaj7"],
    notes:
      "F4/8 A4/8 C5/8 E5/8 D5/8 C5/8 A4/8 G4/8 | F4/8 Ab4/8 B4/8 Eb5/8 Db5/8 B4/8 Bb4/8 Ab4/8 | G4/4 E4/8 G4/8 B4/2",
  },
  {
    slug: "wes-blues-ii-v",
    title: {
      en: "Bluesy ii–V in F",
      pt: "ii–V com sotaque blues em Fá",
      es: "ii–V con sabor blues en Fa",
    },
    description: {
      en: "A Gm7 arpeggio, then the blue E♭ (♯9) bending into E on C7 and a relaxed fall to the 6th of F, held across the bar line.",
      pt: "Um arpejo de Gm7, depois o Mi♭ blue (♯9) puxando para o Mi no C7 e uma descida tranquila até a 6ª de Fá, ligada através da barra.",
      es: "Un arpegio de Gm7, luego el Mi♭ blue (♯9) que tira hacia el Mi en C7 y una caída relajada a la 6ª de Fa, ligada a través de la barra.",
    },
    artist: "Wes Montgomery",
    key: "F",
    progression: "major-ii-v-i",
    style: "soul-jazz",
    techniques: ["blues-notes", "arpeggio"],
    level: 1,
    chords: ["Gm7", "C7", "F6"],
    notes:
      "r/4 G4/8 Bb4/8 D5/8 F5/8 G5/8 F5/8 | E5/8 Eb5/8 C5/8 Bb4/8 A4/8 G4/8 E4/8 G4/8 | A4/4 F4/8 D5/8~ D5/2",
  },
  {
    slug: "pass-3-to-9-flat-9",
    title: {
      en: "3-to-9 and ♭9 in B♭",
      pt: "Da 3ª à 9ª e ♭9 em Si♭",
      es: "De la 3ª a la 9ª y ♭9 en Si♭",
    },
    description: {
      en: "E♭–G–B♭–D is Cm7 from the 3rd to the 9th. Over F7 the line starts on G♭ (♭9) and slides down 13–♭13–5–3 before landing on B♭.",
      pt: "Mi♭–Sol–Si♭–Ré é Cm7 da 3ª à 9ª. Sobre F7 a frase começa no Sol♭ (♭9) e desce 13–♭13–5–3 antes de pousar em Si♭.",
      es: "Mi♭–Sol–Si♭–Re es Cm7 de la 3ª a la 9ª. Sobre F7 la frase empieza en Sol♭ (♭9) y baja 13–♭13–5–3 antes de posarse en Si♭.",
    },
    artist: "Joe Pass",
    key: "Bb",
    progression: "major-ii-v-i",
    style: "mainstream",
    techniques: ["upper-structure", "diminished", "chromatic-approach"],
    level: 2,
    chords: ["Cm7", "F7b9", "Bbmaj7"],
    notes:
      "Eb4/8 G4/8 Bb4/8 D5/8 C5/8 Bb4/8 A4/8 G4/8 | Gb4/8 A4/8 C5/8 Eb5/8 D5/8 Db5/8 C5/8 A4/8 | Bb4/8 D5/8 F5/8 A5/8 G5/2",
  },
  {
    slug: "martino-minor-conversion",
    title: {
      en: "Minor conversion over the V",
      pt: "Conversão para menor no V",
      es: "Conversión a menor en el V",
    },
    description: {
      en: "Pat Martino's idea: keep thinking D minor through G7. Leading-tone C♯ and G♯ approaches keep the stream of eighths moving until it resolves to C.",
      pt: "A ideia do Pat Martino: continuar pensando em Ré menor durante o G7. Aproximações pela sensível (Dó♯ e Sol♯) mantêm as colcheias andando até resolver em Dó.",
      es: "La idea de Pat Martino: seguir pensando en Re menor durante el G7. Las aproximaciones por sensible (Do♯ y Sol♯) mantienen las corcheas en marcha hasta resolver en Do.",
    },
    artist: "Pat Martino",
    key: "C",
    progression: "major-ii-v-i",
    style: "post-bop",
    techniques: ["minor-conversion", "chromatic-approach"],
    level: 2,
    chords: ["Dm7", "G7", "Cmaj7"],
    notes:
      "D5/8 C#5/8 D5/8 F5/8 A5/8 C6/8 B5/8 A5/8 | G#5/8 A5/8 F5/8 D5/8 C#5/8 D5/8 B4/8 G4/8 | A4/8 B4/8 C5/8 E5/8 G5/4 r/4",
  },
  {
    slug: "scofield-side-slip",
    title: {
      en: "Side-slip on the V",
      pt: "Side-slip no V",
      es: "Side-slip en el V",
    },
    description: {
      en: "D minor pentatonic over Dm7, then the same shape a half step up (E♭ minor pentatonic) over G7 for tension, slipping back in through F and D.",
      pt: "Pentatônica de Ré menor no Dm7 e depois o mesmo desenho meio tom acima (pentatônica de Mi♭ menor) no G7 para criar tensão, voltando para dentro por Fá e Ré.",
      es: "Pentatónica de Re menor sobre Dm7 y luego la misma forma medio tono arriba (pentatónica de Mi♭ menor) sobre G7 para crear tensión, volviendo por Fa y Re.",
    },
    artist: "John Scofield",
    key: "C",
    progression: "major-ii-v-i",
    style: "modern",
    techniques: ["side-slipping", "pentatonic"],
    level: 3,
    chords: ["Dm7", "G7", "Cmaj7"],
    notes:
      "D5/8 F5/8 G5/8 A5/8 C6/8 A5/8 G5/8 F5/8 | Eb5/8 Gb5/8 Ab5/8 Bb5/8 Ab5/8 Gb5/8 F5/8 D5/8 | E5/4 r/8 G5/8 B5/8 A5/8 E5/4",
  },
  {
    slug: "metheny-triad-pairs",
    title: {
      en: "Triad pairs",
      pt: "Pares de tríades",
      es: "Pares de tríadas",
    },
    description: {
      en: "F and E minor triads over Dm7 (3-5-7, then 9-11-13), then a B diminished triad and an A♭ triad over G7 for the altered sound, resolving to Cmaj9.",
      pt: "Tríades de Fá e Mi menor sobre Dm7 (3-5-7, depois 9-11-13), em seguida uma tríade de Si diminuta e uma de Lá♭ sobre G7 para o som alterado, resolvendo em Cmaj9.",
      es: "Tríadas de Fa y Mi menor sobre Dm7 (3-5-7, luego 9-11-13), después una tríada de Si disminuida y otra de La♭ sobre G7 para el sonido alterado, resolviendo en Cmaj9.",
    },
    artist: "Pat Metheny",
    key: "C",
    progression: "major-ii-v-i",
    style: "modern",
    techniques: ["triads", "upper-structure"],
    level: 2,
    chords: ["Dm7", "G7alt", "Cmaj7"],
    notes:
      "F4/8t A4/8t C5/8t E5/8t G5/8t B5/8t A5/4 G5/8 E5/8 | F5/8t D5/8t B4/8t Ab4/8t C5/8t Eb5/8t D5/4 B4/8 G4/8 | E4/4 G4/8 B4/8 D5/2",
  },
  {
    slug: "stern-sixteenth-launch",
    title: {
      en: "Sixteenth-note launch",
      pt: "Arrancada em semicolcheias",
      es: "Arranque en semicorcheas",
    },
    description: {
      en: "A burst of sixteenths up the Dm7 arpeggio, bebop eighths down, then a G7 line with the A♭ (♭9) used as an approach to A before falling to the 3rd of C.",
      pt: "Uma rajada de semicolcheias subindo o arpejo de Dm7, colcheias bebop descendo, e depois uma frase em G7 que usa o Lá♭ (♭9) como aproximação do Lá antes de cair na 3ª de Dó.",
      es: "Una ráfaga de semicorcheas por el arpegio de Dm7, corcheas bebop hacia abajo y luego una línea en G7 que usa el La♭ (♭9) como aproximación al La antes de caer en la 3ª de Do.",
    },
    artist: "Mike Stern",
    key: "C",
    progression: "major-ii-v-i",
    style: "fusion",
    techniques: ["arpeggio", "chromatic-approach"],
    level: 2,
    chords: ["Dm7", "G7", "Cmaj7"],
    notes:
      "D5/16 E5/16 F5/16 A5/16 C6/8 A5/8 F5/8 E5/8 D5/8 C5/8 | B4/8 D5/8 F5/8 A5/8 Ab5/8 A5/8 F5/8 D5/8 | E5/4 C5/8 G4/8 E4/2",
  },
  {
    slug: "benson-pentatonic-ii-v",
    title: {
      en: "3-to-9 plus minor pentatonic",
      pt: "Da 3ª à 9ª com pentatônica menor",
      es: "De la 3ª a la 9ª con pentatónica menor",
    },
    description: {
      en: "B♭maj7 over Gm7 (the 3rd to the 9th, no root), then a bluesy C7 from the ♯9 (E♭ into E) using F minor pentatonic colours.",
      pt: "Bbmaj7 sobre Gm7 (da 3ª à 9ª, sem a fundamental), depois um C7 com sotaque blues a partir da ♯9 (Mi♭ indo para Mi) com cores da pentatônica de Fá menor.",
      es: "Bbmaj7 sobre Gm7 (de la 3ª a la 9ª, sin fundamental), luego un C7 con sabor blues desde la ♯9 (Mi♭ hacia Mi) con colores de la pentatónica de Fa menor.",
    },
    artist: "George Benson",
    key: "F",
    progression: "major-ii-v-i",
    style: "soul-jazz",
    techniques: ["upper-structure", "pentatonic", "blues-notes"],
    level: 1,
    chords: ["Gm7", "C7", "Fmaj7"],
    notes:
      "r/8 Bb4/8 D5/8 F5/8 A5/8 G5/8 F5/8 D5/8 | Eb5/8 E5/8 G5/8 Bb5/8 Ab5/8 F5/8 Eb5/8 C5/8 | A4/4 r/8 C5/8 E5/4 r/4",
  },
  {
    slug: "green-blues-i-iv",
    title: {
      en: "Blues I7–IV7",
      pt: "Blues I7–IV7",
      es: "Blues I7–IV7",
    },
    description: {
      en: "A soul-jazz blues line: the minor 3rd (A♭) rubs against F7, then the line drops onto D, the 3rd of B♭7, and walks down its arpeggio.",
      pt: "Uma frase de blues soul jazz: a 3ª menor (Lá♭) roça contra o F7, depois a linha cai no Ré, 3ª do Bb7, e desce pelo arpejo dele.",
      es: "Una frase de blues soul jazz: la 3ª menor (La♭) roza contra el F7, luego la línea cae en Re, la 3ª de Bb7, y baja por su arpegio.",
    },
    artist: "Grant Green",
    key: "F",
    progression: "blues",
    style: "soul-jazz",
    techniques: ["blues-notes", "pentatonic"],
    level: 1,
    chords: ["F7", "Bb7"],
    notes: "r/8 C5/8 Eb5/8 E5/8 F5/8 Ab5/8 F5/8 C5/8 | D5/4 C5/8 Bb4/8 Ab4/8 F4/8 D4/4",
  },
];
