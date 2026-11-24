import type { StateStorage } from "zustand/middleware";

/**
 * A storage adapter that never throws when localStorage is blocked, disabled,
 * or unavailable (private browsing / SSR). Falls back to an in-memory map.
 */
const memory = new Map<string, string>();

function browserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    const probe = "__typestrike_storage_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

export const safeStateStorage: StateStorage = {
  getItem: (name) => {
    try {
      return browserStorage()?.getItem(name) ?? memory.get(name) ?? null;
    } catch {
      return memory.get(name) ?? null;
    }
  },
  setItem: (name, value) => {
    memory.set(name, value);
    try {
      browserStorage()?.setItem(name, value);
    } catch {
      // Memory copy is enough for this session.
    }
  },
  removeItem: (name) => {
    memory.delete(name);
    try {
      browserStorage()?.removeItem(name);
    } catch {
      // Nothing else to clean up.
    }
  },
};

export function resetStoredStatistics(): void {
  for (const key of ["typestrike.stats.v1"]) {
    safeStateStorage.removeItem(key);
  }
}
