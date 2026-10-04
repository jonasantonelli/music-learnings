"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { defineMessages } from "@/lib/i18n";
import { formatKey } from "@/lib/song-analysis";
import { useLocale, useMessages } from "@/components/locale-provider";

const messages = defineMessages({
  en: {
    search: "Search by title or composer…",
    searchLabel: "Search songs",
    key: "Key",
    tag: "Tag",
    style: "Style",
    results: (n: number) => `${n} result${n === 1 ? "" : "s"}`,
    clear: "Clear filters",
    noMatch: "No songs match your filters.",
  },
  pt: {
    search: "Buscar por título ou compositor…",
    searchLabel: "Buscar músicas",
    key: "Tom",
    tag: "Tag",
    style: "Estilo",
    results: (n: number) => `${n} resultado${n === 1 ? "" : "s"}`,
    clear: "Limpar filtros",
    noMatch: "Nenhuma música corresponde aos seus filtros.",
  },
  es: {
    search: "Buscar por título o compositor…",
    searchLabel: "Buscar canciones",
    key: "Tonalidad",
    tag: "Etiqueta",
    style: "Estilo",
    results: (n: number) => `${n} resultado${n === 1 ? "" : "s"}`,
    clear: "Borrar filtros",
    noMatch: "Ninguna canción coincide con tus filtros.",
  },
});

type SongItem = {
  slug: string;
  href: string;
  title: string;
  composer: string;
  songKey: string;
  style: string;
  tempo_feel: string;
  form: string;
  tags: string[];
};

type Props = {
  songs: SongItem[];
  allTags: string[];
  allKeys: string[];
  allStyles: string[];
};

export function SongFilters({ songs, allTags, allKeys, allStyles }: Props) {
  const lang = useLocale();
  const t = useMessages(messages);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return songs.filter((s) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !s.title.toLowerCase().includes(q) &&
          !s.composer.toLowerCase().includes(q)
        )
          return false;
      }
      if (selectedTag && !s.tags.includes(selectedTag)) return false;
      if (selectedKey && s.songKey !== selectedKey) return false;
      if (selectedStyle && s.style !== selectedStyle) return false;
      return true;
    });
  }, [songs, search, selectedTag, selectedKey, selectedStyle]);

  const hasFilters = search || selectedTag || selectedKey || selectedStyle;

  return (
    <div className="mt-8">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.search}
          aria-label={t.searchLabel}
          className="flex-1 rounded-control border border-border bg-card px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent-7 transition-colors"
        />
        <div className="flex flex-wrap gap-2">
          <FilterSelect
            value={selectedKey}
            onChange={setSelectedKey}
            options={allKeys}
            formatOption={(k) => formatKey(k, lang)}
            placeholder={t.key}
          />
          <FilterSelect
            value={selectedTag}
            onChange={setSelectedTag}
            options={allTags}
            placeholder={t.tag}
          />
          <FilterSelect
            value={selectedStyle}
            onChange={setSelectedStyle}
            options={allStyles}
            placeholder={t.style}
          />
        </div>
      </div>

      {hasFilters && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {t.results(filtered.length)}
          </span>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedTag(null);
              setSelectedKey(null);
              setSelectedStyle(null);
            }}
            className="text-xs text-accent-11 hover:text-accent-12 transition-colors"
          >
            {t.clear}
          </button>
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {filtered.map((song) => (
          <Link
            key={song.slug}
            href={song.href}
            className="group rounded-card border border-border bg-card p-4 transition-colors hover:border-accent-7 hover:bg-card-hover"
          >
            <div className="font-display text-base">{song.title}</div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              {song.composer}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[11px]">
              <span className="rounded-md bg-tone-butter px-2 py-0.5 text-tone-butter-fg">
                {formatKey(song.songKey, lang)}
              </span>
              <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                {song.form}
              </span>
              <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                {song.tempo_feel}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && songs.length > 0 && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          {t.noMatch}
        </p>
      )}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  formatOption = (o) => o,
  placeholder,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  options: string[];
  formatOption?: (option: string) => string;
  placeholder: string;
}) {
  if (options.length === 0) return null;

  return (
    <select
      aria-label={placeholder}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className={cn(
        "rounded-control border border-border bg-card px-3 py-2 text-sm transition-colors focus:outline-none focus:border-accent-7 appearance-none cursor-pointer pr-7",
        value
          ? "text-accent-11 border-accent-6"
          : "text-muted-foreground",
      )}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 0.5rem center",
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {formatOption(o)}
        </option>
      ))}
    </select>
  );
}
