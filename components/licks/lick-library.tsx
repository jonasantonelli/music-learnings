"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { defineMessages } from "@/lib/i18n";
import { useLocale, useMessages } from "@/components/locale-provider";
import { NoteText } from "@/components/note-text";
import { Select } from "@/components/select";
import { useStoredState } from "@/lib/use-stored-state";
import { FAVORITES_KEY, LEARNED_KEY } from "@/lib/licks/storage";
import { displayChord } from "@/lib/licks/notation";
import {
  PROGRESSIONS,
  levelLabel,
  progressionLabel,
  rhythmLabel,
  styleLabel,
  techniqueLabel,
  type Level,
  type Progression,
  type Style,
  type Technique,
} from "@/lib/licks/taxonomy";
import type { RhythmFeature } from "@/lib/licks/notation";

const messages = defineMessages({
  en: {
    search: "Search licks, players, techniques…",
    searchLabel: "Search licks",
    all: "All",
    artist: "Player",
    style: "Style",
    technique: "Technique",
    rhythm: "Rhythm",
    level: "Level",
    status: "Status",
    favorites: "Favorites",
    learned: "Learned",
    toLearn: "Not learned yet",
    any: "Any",
    common: "Common bebop vocabulary",
    inStyleOf: (a: string) => `In the style of ${a}`,
    results: (n: number) => `${n} lick${n === 1 ? "" : "s"}`,
    clear: "Clear filters",
    noMatch: "No licks match your filters.",
    bars: (n: number) => `${n} bars`,
  },
  pt: {
    search: "Buscar licks, músicos, técnicas…",
    searchLabel: "Buscar licks",
    all: "Todas",
    artist: "Músico",
    style: "Estilo",
    technique: "Técnica",
    rhythm: "Ritmo",
    level: "Nível",
    status: "Status",
    favorites: "Favoritos",
    learned: "Aprendidos",
    toLearn: "Ainda não aprendidos",
    any: "Qualquer",
    common: "Vocabulário bebop comum",
    inStyleOf: (a: string) => `No estilo de ${a}`,
    results: (n: number) => `${n} lick${n === 1 ? "" : "s"}`,
    clear: "Limpar filtros",
    noMatch: "Nenhum lick corresponde aos seus filtros.",
    bars: (n: number) => `${n} compassos`,
  },
  es: {
    search: "Buscar licks, músicos, técnicas…",
    searchLabel: "Buscar licks",
    all: "Todas",
    artist: "Músico",
    style: "Estilo",
    technique: "Técnica",
    rhythm: "Ritmo",
    level: "Nivel",
    status: "Estado",
    favorites: "Favoritos",
    learned: "Aprendidos",
    toLearn: "Aún no aprendidos",
    any: "Cualquiera",
    common: "Vocabulario bebop común",
    inStyleOf: (a: string) => `Al estilo de ${a}`,
    results: (n: number) => `${n} lick${n === 1 ? "" : "s"}`,
    clear: "Borrar filtros",
    noMatch: "Ningún lick coincide con tus filtros.",
    bars: (n: number) => `${n} compases`,
  },
});

export type LickCard = {
  slug: string;
  href: string;
  title: string;
  description: string;
  artist?: string;
  keyName: string;
  progression: Progression;
  style: Style;
  techniques: Technique[];
  rhythms: RhythmFeature[];
  level: Level;
  chords: string[];
};

type Status = "favorites" | "learned" | "to-learn";

/** Lowercase without accents, so "harmonica" finds "harmônica". */
const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export function LickLibrary({ licks }: { licks: LickCard[] }) {
  const lang = useLocale();
  const t = useMessages(messages);
  const [favorites] = useStoredState<string[]>(FAVORITES_KEY, []);
  const [learned] = useStoredState<string[]>(LEARNED_KEY, []);

  const [search, setSearch] = React.useState("");
  const [progression, setProgression] = React.useState<Progression | null>(null);
  const [artist, setArtist] = React.useState<string | null>(null);
  const [style, setStyle] = React.useState<string | null>(null);
  const [technique, setTechnique] = React.useState<string | null>(null);
  const [rhythm, setRhythm] = React.useState<string | null>(null);
  const [level, setLevel] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);

  const options = React.useMemo(() => {
    const uniq = <T,>(xs: T[]) => [...new Set(xs)];
    return {
      progressions: PROGRESSIONS.filter((p) => licks.some((l) => l.progression === p)),
      artists: uniq(licks.flatMap((l) => (l.artist ? [l.artist] : []))).sort(),
      styles: uniq(licks.map((l) => l.style)),
      techniques: uniq(licks.flatMap((l) => l.techniques)),
      rhythms: uniq(licks.flatMap((l) => l.rhythms)),
      levels: uniq(licks.map((l) => l.level)).sort(),
    };
  }, [licks]);

  const haystacks = React.useMemo(
    () =>
      new Map(
        licks.map((l) => [
          l.slug,
          fold(
            [
              l.title,
              l.description,
              l.artist ?? t.common,
              progressionLabel(l.progression, lang),
              styleLabel(l.style, lang),
              ...l.techniques.map((x) => techniqueLabel(x, lang)),
              ...l.chords,
            ].join(" "),
          ),
        ]),
      ),
    [licks, lang, t.common],
  );

  const filtered = licks.filter((l) => {
    if (search && !fold(search).split(/\s+/).every((w) => haystacks.get(l.slug)!.includes(w))) return false;
    if (progression && l.progression !== progression) return false;
    if (artist && (l.artist ?? "") !== artist) return false;
    if (style && l.style !== style) return false;
    if (technique && !l.techniques.includes(technique as Technique)) return false;
    if (rhythm && !l.rhythms.includes(rhythm as RhythmFeature)) return false;
    if (level && String(l.level) !== level) return false;
    if (status === "favorites" && !favorites.includes(l.slug)) return false;
    if (status === "learned" && !learned.includes(l.slug)) return false;
    if (status === "to-learn" && learned.includes(l.slug)) return false;
    return true;
  });

  const hasFilters = Boolean(search || progression || artist || style || technique || rhythm || level || status);
  const clear = () => {
    setSearch("");
    setProgression(null);
    setArtist(null);
    setStyle(null);
    setTechnique(null);
    setRhythm(null);
    setLevel(null);
    setStatus(null);
  };

  return (
    <div className="mt-8">
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t.search}
        aria-label={t.searchLabel}
        className="w-full rounded-control border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent-7 transition-colors"
      />

      <div className="mt-4 flex flex-wrap gap-1.5">
        <ProgressionChip on={progression === null} onClick={() => setProgression(null)}>
          {t.all}
        </ProgressionChip>
        {options.progressions.map((p) => (
          <ProgressionChip key={p} on={progression === p} onClick={() => setProgression(progression === p ? null : p)}>
            {progressionLabel(p, lang)}
          </ProgressionChip>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <FilterSelect value={artist} onChange={setArtist} placeholder={t.artist} anyLabel={t.any}
          options={options.artists.map((a) => [a, a])} />
        <FilterSelect value={style} onChange={setStyle} placeholder={t.style} anyLabel={t.any}
          options={options.styles.map((s) => [s, styleLabel(s, lang)])} />
        <FilterSelect value={technique} onChange={setTechnique} placeholder={t.technique} anyLabel={t.any}
          options={options.techniques.map((x) => [x, techniqueLabel(x, lang)])} />
        <FilterSelect value={rhythm} onChange={setRhythm} placeholder={t.rhythm} anyLabel={t.any}
          options={options.rhythms.map((r) => [r, rhythmLabel(r, lang)])} />
        <FilterSelect value={level} onChange={setLevel} placeholder={t.level} anyLabel={t.any}
          options={options.levels.map((v) => [String(v), levelLabel(v, lang)])} />
        <FilterSelect value={status} onChange={setStatus} placeholder={t.status} anyLabel={t.any}
          options={([["favorites", t.favorites], ["learned", t.learned], ["to-learn", t.toLearn]] as [Status, string][])} />
      </div>

      <div className="mt-3 flex h-5 items-center gap-2">
        <span className="text-xs text-muted-foreground">{t.results(filtered.length)}</span>
        {hasFilters && (
          <button type="button" onClick={clear} className="text-xs text-accent-11 hover:text-accent-12 transition-colors">
            {t.clear}
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {filtered.map((l) => (
          <Link
            key={l.slug}
            href={l.href}
            className="group flex flex-col rounded-card border border-border bg-card p-4 transition-colors hover:border-accent-7 hover:bg-card-hover"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="font-display text-base">
                <NoteText text={l.title} />
              </div>
              <div className="flex shrink-0 gap-1 pt-0.5 text-tone-butter-fg dark:text-tone-butter">
                {favorites.includes(l.slug) && <Star className="h-3.5 w-3.5" aria-label={t.favorites} />}
                {learned.includes(l.slug) && <Check className="h-3.5 w-3.5" aria-label={t.learned} />}
              </div>
            </div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              {l.artist ? t.inStyleOf(l.artist) : t.common}
            </div>
            <div className="mt-3 font-mono text-xs text-foreground">
              {l.chords.map((bar, i) => (
                <span key={i}>
                  {i > 0 && <span className="text-muted-foreground"> | </span>}
                  <NoteText text={bar.split(/\s+/).map(displayChord).join(" ")} />
                </span>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[11px]">
              <span className="rounded-md bg-tone-peach px-2 py-0.5 text-tone-peach-fg">
                {progressionLabel(l.progression, lang)}
              </span>
              <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                <NoteText text={displayChord(l.keyName)} />
              </span>
              <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                {levelLabel(l.level, lang)}
              </span>
              {l.techniques.slice(0, 2).map((x) => (
                <span key={x} className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                  {techniqueLabel(x, lang)}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-8 text-center text-sm text-muted-foreground">{t.noMatch}</p>
      )}
    </div>
  );
}

function ProgressionChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        on
          ? "border-transparent bg-tone-peach text-tone-peach-fg"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  anyLabel,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  options: [string, string][];
  placeholder: string;
  anyLabel: string;
}) {
  if (options.length === 0) return null;
  // "" stands for "no filter": the trigger then just names the filter.
  return (
    <Select
      label={placeholder}
      value={value ?? ""}
      onChange={(v) => onChange(v || null)}
      caption={value !== null}
      highlighted={value !== null}
      display={value === null ? <span className="text-muted-foreground">{placeholder}</span> : undefined}
      className="min-w-[9.5rem]"
      groups={[
        { options: [{ value: "", label: anyLabel }] },
        { options: options.map(([v, label]) => ({ value: v, label })) },
      ]}
    />
  );
}
