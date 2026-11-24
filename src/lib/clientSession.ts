/** Short-lived, tab-scoped flags used when navigating between app screens. */

export const AUTOSTART_KEY = "typestrike:autostart";

export function requestGameAutostart(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(AUTOSTART_KEY, "1");
  } catch {
    // Storage may be unavailable; the player can still press Start.
  }
}

/** Reads and clears the flag so a refresh never restarts unexpectedly. */
export function consumeGameAutostart(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const shouldStart = window.sessionStorage.getItem(AUTOSTART_KEY) === "1";
    if (shouldStart) window.sessionStorage.removeItem(AUTOSTART_KEY);
    return shouldStart;
  } catch {
    return false;
  }
}
