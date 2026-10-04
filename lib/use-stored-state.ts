"use client";

import { useCallback, useSyncExternalStore } from "react";

const EVENT = "stored-state-updated";

// Fallback for when localStorage is unavailable (private mode, blocked
// storage), so the control still works for the current page view.
const memory = new Map<string, string>();

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

function read(key: string): string | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) return raw;
  } catch {
    // fall through to memory
  }
  return memory.get(key) ?? null;
}

/**
 * Like useState, but persisted to localStorage under `key` and shared by every
 * component using the same key. Renders `fallback` on the server and until the
 * stored value is read, so hydration stays consistent.
 */
export function useStoredState<T>(key: string, fallback: T): [T, (value: T) => void] {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );

  let value = fallback;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      // keep fallback
    }
  }

  const set = useCallback(
    (next: T) => {
      const serialized = JSON.stringify(next);
      memory.set(key, serialized);
      try {
        localStorage.setItem(key, serialized);
      } catch {
        // memory copy still applies
      }
      window.dispatchEvent(new Event(EVENT));
    },
    [key],
  );

  return [value, set];
}
