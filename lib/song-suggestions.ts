import type { Locale } from "./i18n";
import type { Recording } from "./recordings";

export type SuggestionStyle = "jazz standard" | "bossa nova" | "jazz ballad";

/** Display names for `SongSuggestion.style`, per locale. */
export const SUGGESTION_STYLE_LABELS: Record<SuggestionStyle, Record<Locale, string>> = {
  "jazz standard": { en: "jazz standard", pt: "standard de jazz", es: "standard de jazz" },
  "bossa nova": { en: "bossa nova", pt: "bossa nova", es: "bossa nova" },
  "jazz ballad": { en: "jazz ballad", pt: "balada de jazz", es: "balada de jazz" },
};

/**
 * Standards to learn next. Each one is linked to the charts it builds on
 * (`relatedTo` holds song slugs) so the list grows out of what's already
 * studied. Tunes that already have a chart in content/songs are hidden
 * from the /songs list, so an entry can stay here until it's cleaned up.
 */
export type SongSuggestion = {
  title: string;
  composer: string;
  /** English key name ("D minor"), rendered with `formatKey`. */
  key: string;
  style: SuggestionStyle;
  relatedTo: string[];
  /** Why this tune comes next, in every locale. */
  why: Record<Locale, string>;
  recording: Recording;
};

/** "Black Orpheus (Paul Desmond version)" and "Black Orpheus" are the same tune. */
export function baseTitle(title: string): string {
  return title.replace(/\s*\(.*\)\s*$/, "").toLowerCase();
}

const yt = (id: string) => `https://www.youtube.com/watch?v=${id}`;

export const SONG_SUGGESTIONS: SongSuggestion[] = [
  // Minor ii–V–i — Autumn Leaves, Beautiful Love
  {
    title: "Alone Together",
    composer: "Arthur Schwartz",
    key: "D minor",
    style: "jazz standard",
    relatedTo: ["beautiful-love", "autumn-leaves"],
    why: {
      en: "Same key and minor ii–V–i vocabulary as Beautiful Love, but with an irregular 14-bar A section that tests your form awareness.",
      pt: "Mesmo tom e mesmo vocabulário de ii–V–i menor de Beautiful Love, mas com uma seção A irregular de 14 compassos que testa sua noção de forma.",
      es: "Misma tonalidad y mismo vocabulario de ii–V–i menor que Beautiful Love, pero con una sección A irregular de 14 compases que pone a prueba tu sentido de la forma.",
    },
    recording: { artist: "Chet Baker", album: "Chet", year: 1959, youtube: yt("EssmF0evMlk") },
  },
  {
    title: "Softly, as in a Morning Sunrise",
    composer: "Sigmund Romberg",
    key: "C minor",
    style: "jazz standard",
    relatedTo: ["autumn-leaves", "beautiful-love"],
    why: {
      en: "Minor ii–V–i vamps over a C minor tonic in the A sections — stretch the Autumn Leaves vocabulary over a static minor center.",
      pt: "Vamps de ii–V–i menor sobre uma tônica de C menor nas seções A — leve o vocabulário de Autumn Leaves para um centro menor estático.",
      es: "Vamps de ii–V–i menor sobre una tónica de C menor en las secciones A — lleva el vocabulario de Autumn Leaves a un centro menor estático.",
    },
    recording: { artist: "John Coltrane", album: "Live at the Village Vanguard", year: 1961, youtube: yt("VlViBYcZpJ0") },
  },
  {
    title: "Solar",
    composer: "Miles Davis",
    key: "C minor",
    style: "jazz standard",
    relatedTo: ["autumn-leaves", "equinox"],
    why: {
      en: "12-bar form built entirely from ii–V chains that modulate by step — compact drill for tonicizing new keys.",
      pt: "Forma de 12 compassos feita inteiramente de cadeias de ii–V que modulam por grau conjunto — um exercício compacto para tonicizar novos tons.",
      es: "Forma de 12 compases construida enteramente con cadenas de ii–V que modulan por grado conjunto — un ejercicio compacto para tonicizar nuevas tonalidades.",
    },
    recording: { artist: "Miles Davis", album: "Walkin'", year: 1954, youtube: yt("uf1_AEOvE5E") },
  },
  {
    title: "Nardis",
    composer: "Miles Davis",
    key: "E minor",
    style: "jazz standard",
    relatedTo: ["beautiful-love"],
    why: {
      en: "Bill Evans's other signature minor tune from Explorations; Phrygian and harmonic-minor colors beyond the plain ii–V–i.",
      pt: "A outra música menor emblemática de Bill Evans, de Explorations; cores frígias e de menor harmônica além do simples ii–V–i.",
      es: "La otra pieza menor emblemática de Bill Evans, de Explorations; colores frigios y de menor armónica más allá del simple ii–V–i.",
    },
    recording: { artist: "Bill Evans Trio", album: "Explorations", year: 1961, youtube: yt("Bx6JhE5K22I") },
  },

  // Bossa nova — Black Orpheus
  {
    title: "Blue Bossa",
    composer: "Kenny Dorham",
    key: "C minor",
    style: "bossa nova",
    relatedTo: ["black-orpheus", "autumn-leaves"],
    why: {
      en: "16-bar minor bossa with a ii–V–I detour to Db major — the classic first tune for practicing a key change mid-form.",
      pt: "Bossa menor de 16 compassos com um desvio ii–V–I para Db maior — a música clássica para praticar uma modulação no meio da forma.",
      es: "Bossa menor de 16 compases con un desvío ii–V–I a Db mayor — la pieza clásica para practicar una modulación a mitad de la forma.",
    },
    recording: { artist: "Joe Henderson", album: "Page One", year: 1963, youtube: yt("EUxv3AAaK_Y") },
  },
  {
    title: "Insensatez (How Insensitive)",
    composer: "Antônio Carlos Jobim",
    key: "D minor",
    style: "bossa nova",
    relatedTo: ["black-orpheus"],
    why: {
      en: "Minor bossa driven by chromatic bass-line voice leading — great for guide-tone and inner-voice work.",
      pt: "Bossa menor conduzida por uma linha de baixo cromática — ótima para trabalhar notas-guia e vozes internas.",
      es: "Bossa menor guiada por una línea de bajo cromática — ideal para trabajar notas guía y voces internas.",
    },
    recording: { artist: "Antônio Carlos Jobim", album: "The Composer of Desafinado, Plays", year: 1963, youtube: yt("deyU5iDPLXo") },
  },
  {
    title: "Corcovado",
    composer: "Antônio Carlos Jobim",
    key: "C major",
    style: "bossa nova",
    relatedTo: ["black-orpheus", "days-of-wine-and-roses"],
    why: {
      en: "Opens on a II7 instead of the tonic and delays resolution — secondary dominants in a bossa setting.",
      pt: "Começa num II7 em vez da tônica e adia a resolução — dominantes secundárias num contexto de bossa.",
      es: "Empieza en un II7 en lugar de la tónica y retrasa la resolución — dominantes secundarios en un contexto de bossa.",
    },
    recording: { artist: "Stan Getz & João Gilberto", album: "Getz/Gilberto", year: 1964, youtube: yt("VEMWhrfFVDc") },
  },
  {
    title: "The Girl from Ipanema",
    composer: "Antônio Carlos Jobim",
    key: "F major",
    style: "bossa nova",
    relatedTo: ["black-orpheus", "have-you-met-miss-jones"],
    why: {
      en: "AABA in F with a bridge that jumps to Gbmaj7 — a bossa cousin of the Miss Jones bridge's distant-key moves.",
      pt: "AABA em F com uma ponte que salta para Gbmaj7 — uma prima bossa nova dos saltos para tons distantes da ponte de Miss Jones.",
      es: "AABA en F con un puente que salta a Gbmaj7 — una prima bossa nova de los saltos a tonalidades lejanas del puente de Miss Jones.",
    },
    recording: { artist: "Stan Getz & João Gilberto", album: "Getz/Gilberto", year: 1964, youtube: yt("kLO8XoNf5EM") },
  },

  // Major-key ii–V–I, secondary dominants — Days of Wine and Roses, Miss Jones
  {
    title: "All the Things You Are",
    composer: "Jerome Kern",
    key: "Ab major",
    style: "jazz standard",
    relatedTo: ["days-of-wine-and-roses", "have-you-met-miss-jones"],
    why: {
      en: "Moves through five keys via ii–V–Is and a major-third modulation in the bridge. Joe Pass's solo version pairs with his Miss Jones.",
      pt: "Passa por cinco tons via ii–V–Is e uma modulação de terça maior na ponte. A versão solo de Joe Pass combina com a dele de Miss Jones.",
      es: "Recorre cinco tonalidades mediante ii–V–I y una modulación de tercera mayor en el puente. La versión solista de Joe Pass hace pareja con su Miss Jones.",
    },
    recording: { artist: "Joe Pass", album: "Virtuoso", year: 1973, youtube: yt("0BkCcICZkRc") },
  },
  {
    title: "There Will Never Be Another You",
    composer: "Harry Warren",
    key: "Eb major",
    style: "jazz standard",
    relatedTo: ["days-of-wine-and-roses"],
    why: {
      en: "ABAC form like Days of Wine and Roses, with a IV–iv minor-plagal move and backdoor dominants.",
      pt: "Forma ABAC como Days of Wine and Roses, com um movimento plagal menor IV–iv e dominantes backdoor.",
      es: "Forma ABAC como Days of Wine and Roses, con un movimiento plagal menor IV–iv y dominantes backdoor.",
    },
    recording: { artist: "Chet Baker", album: "Chet Baker Sings", year: 1954, youtube: yt("rMX1LxBba9g") },
  },
  {
    title: "Just Friends",
    composer: "John Klenner",
    key: "G major",
    style: "jazz standard",
    relatedTo: ["days-of-wine-and-roses"],
    why: {
      en: "Starts on IV and uses the iv–bVII7 backdoor progression — the same backdoor sound tagged in Days of Wine and Roses.",
      pt: "Começa no IV e usa a progressão backdoor iv–bVII7 — o mesmo som backdoor marcado em Days of Wine and Roses.",
      es: "Empieza en el IV y usa la progresión backdoor iv–bVII7 — el mismo sonido backdoor señalado en Days of Wine and Roses.",
    },
    recording: { artist: "Charlie Parker", album: "Charlie Parker with Strings", year: 1950, youtube: yt("aEFPJAjlnTo") },
  },
  {
    title: "Stella by Starlight",
    composer: "Victor Young",
    key: "Bb major",
    style: "jazz standard",
    relatedTo: ["days-of-wine-and-roses", "beautiful-love"],
    why: {
      en: "Same composer as Beautiful Love; a long chain of half-diminished ii–Vs and secondary dominants.",
      pt: "Mesmo compositor de Beautiful Love; uma longa cadeia de ii–Vs meio-diminutos e dominantes secundárias.",
      es: "Mismo compositor que Beautiful Love; una larga cadena de ii–V semidisminuidos y dominantes secundarios.",
    },
    recording: { artist: "Miles Davis", album: "My Funny Valentine", year: 1964, youtube: yt("YI7qPHJ6tjA") },
  },
  {
    title: "Tune Up",
    composer: "Miles Davis",
    key: "D major",
    style: "jazz standard",
    relatedTo: ["have-you-met-miss-jones", "days-of-wine-and-roses"],
    why: {
      en: "ii–V–I in three keys descending by whole step — the base changes Coltrane reharmonized into Countdown.",
      pt: "ii–V–I em três tons descendo por tom inteiro — a harmonia base que Coltrane rearmonizou em Countdown.",
      es: "ii–V–I en tres tonalidades que descienden por tono entero — la armonía base que Coltrane rearmonizó en Countdown.",
    },
    recording: { artist: "Miles Davis", album: "Cookin'", year: 1957, youtube: yt("HTjoOcUVtgI") },
  },

  // Coltrane changes — Miss Jones bridge, Naima
  {
    title: "Giant Steps",
    composer: "John Coltrane",
    key: "B major",
    style: "jazz standard",
    relatedTo: ["have-you-met-miss-jones", "naima"],
    why: {
      en: "The full major-thirds cycle that the Miss Jones bridge hints at. Start slow: it's the reference for Coltrane changes.",
      pt: "O ciclo completo de terças maiores que a ponte de Miss Jones sugere. Comece devagar: é a referência para as Coltrane changes.",
      es: "El ciclo completo de terceras mayores que insinúa el puente de Miss Jones. Empieza despacio: es la referencia de los Coltrane changes.",
    },
    recording: { artist: "John Coltrane", album: "Giant Steps", year: 1960, youtube: yt("KwIC6B_dvW4") },
  },
  {
    title: "Countdown",
    composer: "John Coltrane",
    key: "D major",
    style: "jazz standard",
    relatedTo: ["have-you-met-miss-jones"],
    why: {
      en: "Tune Up with Coltrane substitutions — practice the two back to back to hear what the cycle adds.",
      pt: "Tune Up com as substituições de Coltrane — pratique as duas em sequência para ouvir o que o ciclo acrescenta.",
      es: "Tune Up con las sustituciones de Coltrane — practica las dos seguidas para escuchar lo que aporta el ciclo.",
    },
    recording: { artist: "John Coltrane", album: "Giant Steps", year: 1960, youtube: yt("3o1MQUchg2U") },
  },

  // Minor blues — Equinox
  {
    title: "Mr. P.C.",
    composer: "John Coltrane",
    key: "C minor",
    style: "jazz standard",
    relatedTo: ["equinox"],
    why: {
      en: "Up-tempo C minor blues — same form and key as Equinox at a much faster tempo.",
      pt: "Blues menor em C, up-tempo — mesma forma e mesmo tom de Equinox, num andamento bem mais rápido.",
      es: "Blues menor en C, up-tempo — misma forma y tonalidad que Equinox, a un tempo mucho más rápido.",
    },
    recording: { artist: "John Coltrane", album: "Giant Steps", year: 1960, youtube: yt("G52cqO2kPEo") },
  },
  {
    title: "Footprints",
    composer: "Wayne Shorter",
    key: "C minor",
    style: "jazz standard",
    relatedTo: ["equinox"],
    why: {
      en: "Minor blues in 6/4 with a modal feel and an unusual chromatic turnaround in bars 9–10.",
      pt: "Blues menor em 6/4 com sonoridade modal e um turnaround cromático incomum nos compassos 9–10.",
      es: "Blues menor en 6/4 con sonoridad modal y un turnaround cromático poco común en los compases 9–10.",
    },
    recording: { artist: "Wayne Shorter", album: "Adam's Apple", year: 1966, youtube: yt("LgaIUqH0w6c") },
  },

  // Modal and ballads — Naima
  {
    title: "So What",
    composer: "Miles Davis",
    key: "D Dorian",
    style: "jazz standard",
    relatedTo: ["naima", "equinox"],
    why: {
      en: "AABA over D Dorian with an Eb Dorian bridge — the entry point to modal playing and quartal voicings.",
      pt: "AABA sobre D dórico com ponte em Eb dórico — a porta de entrada para tocar modal e para voicings quartais.",
      es: "AABA sobre D dórico con puente en Eb dórico — la puerta de entrada a tocar modal y a los voicings por cuartas.",
    },
    recording: { artist: "Miles Davis", album: "Kind of Blue", year: 1959, youtube: yt("ylXk1LBvIqU") },
  },
  {
    title: "Blue in Green",
    composer: "Miles Davis / Bill Evans",
    key: "D minor",
    style: "jazz ballad",
    relatedTo: ["naima", "beautiful-love"],
    why: {
      en: "10-bar ballad with rich voicings and no obvious tonic — pairs with Naima for studying ballad harmony.",
      pt: "Balada de 10 compassos com voicings ricos e sem tônica evidente — combina com Naima para estudar harmonia de baladas.",
      es: "Balada de 10 compases con voicings ricos y sin tónica evidente — hace pareja con Naima para estudiar la armonía de baladas.",
    },
    recording: { artist: "Miles Davis", album: "Kind of Blue", year: 1959, youtube: yt("TLDflhhdPCg") },
  },
  {
    title: "In a Sentimental Mood",
    composer: "Duke Ellington",
    key: "D minor",
    style: "jazz ballad",
    relatedTo: ["naima"],
    why: {
      en: "Ballad with a descending line cliché over the minor tonic and a bridge in Db — Coltrane's reading pairs with Naima.",
      pt: "Balada com um line cliché descendente sobre a tônica menor e ponte em Db — a leitura de Coltrane combina com Naima.",
      es: "Balada con un line cliché descendente sobre la tónica menor y puente en Db — la versión de Coltrane hace pareja con Naima.",
    },
    recording: { artist: "Duke Ellington & John Coltrane", album: "Duke Ellington & John Coltrane", year: 1963, youtube: yt("sCQfTNOC5aE") },
  },
  {
    title: "Maiden Voyage",
    composer: "Herbie Hancock",
    key: "D sus",
    style: "jazz standard",
    relatedTo: ["naima"],
    why: {
      en: "AABA built from sus4 chords with no functional ii–V — a modern follow-up to Naima's pedal-point harmony.",
      pt: "AABA construído com acordes sus4, sem ii–V funcional — uma continuação moderna da harmonia em pedal de Naima.",
      es: "AABA construido con acordes sus4, sin ii–V funcional — una continuación moderna de la armonía sobre pedal de Naima.",
    },
    recording: { artist: "Herbie Hancock", album: "Maiden Voyage", year: 1965, youtube: yt("EWC5x9G45yo") },
  },
];
