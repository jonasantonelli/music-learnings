"use client";

import { useCallback, useSyncExternalStore } from "react";
import { NOTE_NAMES_FLAT } from "./music";

const STORAGE_KEY = "practice-daily-note";

function subscribe(cb: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb();
  };
  const customHandler = () => cb();
  window.addEventListener("storage", handler);
  window.addEventListener("practice-note-updated", customHandler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("practice-note-updated", customHandler);
  };
}

function getSnapshot(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw);
    return typeof stored.noteIndex === "number" ? stored.noteIndex : null;
  } catch {
    return null;
  }
}

function getServerSnapshot(): number | null {
  return null;
}

export function setPracticeNote(noteIndex: number) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const prev = raw ? JSON.parse(raw) : {};
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...prev,
        note: NOTE_NAMES_FLAT[noteIndex],
        noteIndex,
      }),
    );
    window.dispatchEvent(new Event("practice-note-updated"));
  } catch {
    // ignore
  }
}

/** Returns the note index (0-11) saved from the practice wheel, or null. */
export function usePracticeNote(): [number | null, (n: number) => void] {
  const note = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const set = useCallback((n: number) => setPracticeNote(n), []);
  return [note, set];
}
