import type { Recording } from "./recordings";

/**
 * Standards to learn next. Each one is linked to the charts it builds on
 * (`relatedTo` holds song slugs) so the list grows out of what's already
 * studied. Tunes that already have a chart in content/songs are hidden
 * from the /songs list, so an entry can stay here until it's cleaned up.
 */
export type SongSuggestion = {
  title: string;
  composer: string;
  key: string;
  style: string;
  relatedTo: string[];
  why: string;
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
    why: "Same key and minor ii–V–i vocabulary as Beautiful Love, but with an irregular 14-bar A section that tests your form awareness.",
    recording: { artist: "Chet Baker", album: "Chet", year: 1959, youtube: yt("EssmF0evMlk") },
  },
  {
    title: "Softly, as in a Morning Sunrise",
    composer: "Sigmund Romberg",
    key: "C minor",
    style: "jazz standard",
    relatedTo: ["autumn-leaves", "beautiful-love"],
    why: "Minor ii–V–i vamps over a C minor tonic in the A sections — stretch the Autumn Leaves vocabulary over a static minor center.",
    recording: { artist: "John Coltrane", album: "Live at the Village Vanguard", year: 1961, youtube: yt("VlViBYcZpJ0") },
  },
  {
    title: "Solar",
    composer: "Miles Davis",
    key: "C minor",
    style: "jazz standard",
    relatedTo: ["autumn-leaves", "equinox"],
    why: "12-bar form built entirely from ii–V chains that modulate by step — compact drill for tonicizing new keys.",
    recording: { artist: "Miles Davis", album: "Walkin'", year: 1954, youtube: yt("uf1_AEOvE5E") },
  },
  {
    title: "Nardis",
    composer: "Miles Davis",
    key: "E minor",
    style: "jazz standard",
    relatedTo: ["beautiful-love"],
    why: "Bill Evans's other signature minor tune from Explorations; Phrygian and harmonic-minor colors beyond the plain ii–V–i.",
    recording: { artist: "Bill Evans Trio", album: "Explorations", year: 1961, youtube: yt("Bx6JhE5K22I") },
  },

  // Bossa nova — Black Orpheus
  {
    title: "Blue Bossa",
    composer: "Kenny Dorham",
    key: "C minor",
    style: "bossa nova",
    relatedTo: ["black-orpheus", "autumn-leaves"],
    why: "16-bar minor bossa with a ii–V–I detour to Db major — the classic first tune for practicing a key change mid-form.",
    recording: { artist: "Joe Henderson", album: "Page One", year: 1963, youtube: yt("EUxv3AAaK_Y") },
  },
  {
    title: "Insensatez (How Insensitive)",
    composer: "Antônio Carlos Jobim",
    key: "D minor",
    style: "bossa nova",
    relatedTo: ["black-orpheus"],
    why: "Minor bossa driven by chromatic bass-line voice leading — great for guide-tone and inner-voice work.",
    recording: { artist: "Antônio Carlos Jobim", album: "The Composer of Desafinado, Plays", year: 1963, youtube: yt("deyU5iDPLXo") },
  },
  {
    title: "Corcovado",
    composer: "Antônio Carlos Jobim",
    key: "C major",
    style: "bossa nova",
    relatedTo: ["black-orpheus", "days-of-wine-and-roses"],
    why: "Opens on a II7 instead of the tonic and delays resolution — secondary dominants in a bossa setting.",
    recording: { artist: "Stan Getz & João Gilberto", album: "Getz/Gilberto", year: 1964, youtube: yt("VEMWhrfFVDc") },
  },
  {
    title: "The Girl from Ipanema",
    composer: "Antônio Carlos Jobim",
    key: "F major",
    style: "bossa nova",
    relatedTo: ["black-orpheus", "have-you-met-miss-jones"],
    why: "AABA in F with a bridge that jumps to Gbmaj7 — a bossa cousin of the Miss Jones bridge's distant-key moves.",
    recording: { artist: "Stan Getz & João Gilberto", album: "Getz/Gilberto", year: 1964, youtube: yt("kLO8XoNf5EM") },
  },

  // Major-key ii–V–I, secondary dominants — Days of Wine and Roses, Miss Jones
  {
    title: "All the Things You Are",
    composer: "Jerome Kern",
    key: "Ab major",
    style: "jazz standard",
    relatedTo: ["days-of-wine-and-roses", "have-you-met-miss-jones"],
    why: "Moves through five keys via ii–V–Is and a major-third modulation in the bridge. Joe Pass's solo version pairs with his Miss Jones.",
    recording: { artist: "Joe Pass", album: "Virtuoso", year: 1973, youtube: yt("0BkCcICZkRc") },
  },
  {
    title: "There Will Never Be Another You",
    composer: "Harry Warren",
    key: "Eb major",
    style: "jazz standard",
    relatedTo: ["days-of-wine-and-roses"],
    why: "ABAC form like Days of Wine and Roses, with a IV–iv minor-plagal move and backdoor dominants.",
    recording: { artist: "Chet Baker", album: "Chet Baker Sings", year: 1954, youtube: yt("rMX1LxBba9g") },
  },
  {
    title: "Just Friends",
    composer: "John Klenner",
    key: "G major",
    style: "jazz standard",
    relatedTo: ["days-of-wine-and-roses"],
    why: "Starts on IV and uses the iv–bVII7 backdoor progression — the same backdoor sound tagged in Days of Wine and Roses.",
    recording: { artist: "Charlie Parker", album: "Charlie Parker with Strings", year: 1950, youtube: yt("aEFPJAjlnTo") },
  },
  {
    title: "Stella by Starlight",
    composer: "Victor Young",
    key: "Bb major",
    style: "jazz standard",
    relatedTo: ["days-of-wine-and-roses", "beautiful-love"],
    why: "Same composer as Beautiful Love; a long chain of half-diminished ii–Vs and secondary dominants.",
    recording: { artist: "Miles Davis", album: "My Funny Valentine", year: 1964, youtube: yt("YI7qPHJ6tjA") },
  },
  {
    title: "Tune Up",
    composer: "Miles Davis",
    key: "D major",
    style: "jazz standard",
    relatedTo: ["have-you-met-miss-jones", "days-of-wine-and-roses"],
    why: "ii–V–I in three keys descending by whole step — the base changes Coltrane reharmonized into Countdown.",
    recording: { artist: "Miles Davis", album: "Cookin'", year: 1957, youtube: yt("HTjoOcUVtgI") },
  },

  // Coltrane changes — Miss Jones bridge, Naima
  {
    title: "Giant Steps",
    composer: "John Coltrane",
    key: "B major",
    style: "jazz standard",
    relatedTo: ["have-you-met-miss-jones", "naima"],
    why: "The full major-thirds cycle that the Miss Jones bridge hints at. Start slow: it's the reference for Coltrane changes.",
    recording: { artist: "John Coltrane", album: "Giant Steps", year: 1960, youtube: yt("KwIC6B_dvW4") },
  },
  {
    title: "Countdown",
    composer: "John Coltrane",
    key: "D major",
    style: "jazz standard",
    relatedTo: ["have-you-met-miss-jones"],
    why: "Tune Up with Coltrane substitutions — practice the two back to back to hear what the cycle adds.",
    recording: { artist: "John Coltrane", album: "Giant Steps", year: 1960, youtube: yt("3o1MQUchg2U") },
  },

  // Minor blues — Equinox
  {
    title: "Mr. P.C.",
    composer: "John Coltrane",
    key: "C minor",
    style: "jazz standard",
    relatedTo: ["equinox"],
    why: "Up-tempo C minor blues — same form and key as Equinox at a much faster tempo.",
    recording: { artist: "John Coltrane", album: "Giant Steps", year: 1960, youtube: yt("G52cqO2kPEo") },
  },
  {
    title: "Footprints",
    composer: "Wayne Shorter",
    key: "C minor",
    style: "jazz standard",
    relatedTo: ["equinox"],
    why: "Minor blues in 6/4 with a modal feel and an unusual chromatic turnaround in bars 9–10.",
    recording: { artist: "Wayne Shorter", album: "Adam's Apple", year: 1966, youtube: yt("LgaIUqH0w6c") },
  },
  {
    title: "Stolen Moments",
    composer: "Oliver Nelson",
    key: "C minor",
    style: "jazz standard",
    relatedTo: ["equinox"],
    why: "16-bar C minor tune with a strong blues feel — same key and mood as Equinox, but a longer, less predictable form.",
    recording: { artist: "Oliver Nelson", album: "The Blues and the Abstract Truth", year: 1961, youtube: yt("S-48nLo810I") },
  },

  // Modal and ballads — Naima
  {
    title: "So What",
    composer: "Miles Davis",
    key: "D Dorian",
    style: "jazz standard",
    relatedTo: ["naima", "equinox"],
    why: "AABA over D Dorian with an Eb Dorian bridge — the entry point to modal playing and quartal voicings.",
    recording: { artist: "Miles Davis", album: "Kind of Blue", year: 1959, youtube: yt("ylXk1LBvIqU") },
  },
  {
    title: "Blue in Green",
    composer: "Miles Davis / Bill Evans",
    key: "D minor",
    style: "jazz ballad",
    relatedTo: ["naima", "beautiful-love"],
    why: "10-bar ballad with rich voicings and no obvious tonic — pairs with Naima for studying ballad harmony.",
    recording: { artist: "Miles Davis", album: "Kind of Blue", year: 1959, youtube: yt("TLDflhhdPCg") },
  },
  {
    title: "In a Sentimental Mood",
    composer: "Duke Ellington",
    key: "D minor",
    style: "jazz ballad",
    relatedTo: ["naima"],
    why: "Ballad with a descending line cliché over the minor tonic and a bridge in Db — Coltrane's reading pairs with Naima.",
    recording: { artist: "Duke Ellington & John Coltrane", album: "Duke Ellington & John Coltrane", year: 1963, youtube: yt("sCQfTNOC5aE") },
  },
  {
    title: "Maiden Voyage",
    composer: "Herbie Hancock",
    key: "D sus",
    style: "jazz standard",
    relatedTo: ["naima"],
    why: "AABA built from sus4 chords with no functional ii–V — a modern follow-up to Naima's pedal-point harmony.",
    recording: { artist: "Herbie Hancock", album: "Maiden Voyage", year: 1965, youtube: yt("EWC5x9G45yo") },
  },
];
