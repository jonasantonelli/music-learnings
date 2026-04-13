"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "practice-daily-note";

function subscribe(cb: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb();
  };
  // Listen for changes from the same tab via a custom event
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

/** Returns the note index (0-11) saved from the practice wheel, or null. */
export function usePracticeNote(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
