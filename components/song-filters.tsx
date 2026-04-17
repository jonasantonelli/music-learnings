"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
          placeholder="Search by title or composer…"
          className="flex-1 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent-7 transition-colors"
        />
        <div className="flex flex-wrap gap-2">
          <FilterSelect
            value={selectedKey}
            onChange={setSelectedKey}
            options={allKeys}
            placeholder="Key"
          />
          <FilterSelect
            value={selectedTag}
            onChange={setSelectedTag}
            options={allTags}
            placeholder="Tag"
          />
          <FilterSelect
            value={selectedStyle}
            onChange={setSelectedStyle}
            options={allStyles}
            placeholder="Style"
          />
        </div>
      </div>

      {hasFilters && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {filtered.length} result{filtered.length === 1 ? "" : "s"}
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
            Clear filters
          </button>
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {filtered.map((song) => (
          <Link
            key={song.slug}
            href={song.href}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition-colors hover:border-accent-7 hover:bg-card-hover"
          >
            <div
              aria-hidden
              className="absolute inset-y-0 left-0 w-1 bg-accent-9 opacity-60 transition-opacity group-hover:opacity-100"
            />
            <div className="font-medium group-hover:text-accent-11 transition-colors">
              {song.title}
            </div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              {song.composer}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-full border border-accent-6 bg-accent-3 px-2 py-0.5 text-[10px] font-medium text-accent-11">
                {song.songKey}
              </span>
              <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {song.form}
              </span>
              <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {song.tempo_feel}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && songs.length > 0 && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          No songs match your filters.
        </p>
      )}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  options: string[];
  placeholder: string;
}) {
  if (options.length === 0) return null;

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className={cn(
        "rounded-full border border-border bg-card px-3 py-2 text-sm transition-colors focus:outline-none focus:border-accent-7 appearance-none cursor-pointer pr-7",
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
          {o}
        </option>
      ))}
    </select>
  );
}
