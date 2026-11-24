import { COMBO_MULTIPLIER_CAP, COMBO_STEP, WPM_WORD_LENGTH } from "@/lib/constants";
import { clamp } from "@/lib/constants";

/** Conventional words-per-minute using the 5-character word definition. */
export function calculateWpm(correctChars: number, elapsedMs: number): number {
  if (!Number.isFinite(correctChars) || !Number.isFinite(elapsedMs)) return 0;
  if (correctChars <= 0 || elapsedMs <= 0) return 0;

  const minutes = elapsedMs / 60_000;
  const words = correctChars / WPM_WORD_LENGTH;
  return Math.max(0, Math.round(words / minutes));
}

/** Percentage of printable attempts that were correct. No attempts = 100%. */
export function calculateAccuracy(correct: number, incorrect: number): number {
  const safeCorrect = Math.max(0, correct);
  const safeIncorrect = Math.max(0, incorrect);
  const total = safeCorrect + safeIncorrect;
  if (total === 0) return 100;
  return clamp(Math.round((safeCorrect / total) * 100), 0, 100);
}

/** 1x base multiplier, growing by COMBO_STEP per combo and never exceeding the cap. */
export function calculateComboMultiplier(combo: number): number {
  const safeCombo = Math.max(0, Math.floor(combo));
  return clamp(1 + safeCombo * COMBO_STEP, 1, COMBO_MULTIPLIER_CAP);
}

/** Compact elapsed-time label used by the HUD and results. */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0:00";

  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
