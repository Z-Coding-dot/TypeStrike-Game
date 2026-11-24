import { clamp, LEVEL_BASE } from "@/lib/constants";
import type { GameMode, LevelConfig } from "@/types/game";

/** Per-mode growth in targets required to clear each successive level. */
const QUOTA_GROWTH: Record<GameMode, number> = {
  letters: 1.5,
  words: 1.2,
  sentences: 1,
};

/** Readability ceiling for simultaneously visible targets. */
const MAX_VISIBLE_TARGETS = 6;

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Smooth, unbounded difficulty curve derived from LEVEL_BASE. Every property
 * changes gradually; no level acts as a hard cap.
 */
export function getLevelConfig(mode: GameMode, level: number): LevelConfig {
  const base = LEVEL_BASE[mode];
  const safeLevel = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;
  const steps = safeLevel - 1;

  const quota = Math.round(base.quota + steps * QUOTA_GROWTH[mode]);
  const maxConcurrent = Math.min(base.maxConcurrent + Math.floor(steps / 3), MAX_VISIBLE_TARGETS, quota);
  const speed = roundTo(base.speed * (1 + 0.055 * steps), 1);
  const spawnIntervalMs = Math.max(320, Math.round(base.spawnIntervalMs / (1 + 0.045 * steps)));

  let minLength: number;
  let maxLength: number;

  if (mode === "letters") {
    minLength = base.minLength;
    maxLength = base.maxLength;
  } else if (mode === "words") {
    minLength = base.minLength + Math.floor(steps / 5);
    maxLength = base.maxLength + Math.floor(steps / 3);
  } else {
    minLength = base.minLength + Math.floor(steps / 3);
    maxLength = base.maxLength + Math.floor(steps * 1.5);
  }

  maxLength = Math.max(minLength, maxLength);
  const complexity = roundTo(clamp(steps / (steps + 7), 0, 1), 3);

  return {
    level: safeLevel,
    quota,
    maxConcurrent,
    speed,
    spawnIntervalMs,
    minLength,
    maxLength,
    complexity,
  };
}

/** Class wrapper so callers can use `LevelSystem.getLevelConfig(...)`. */
export class LevelSystem {
  static getLevelConfig(mode: GameMode, level: number): LevelConfig {
    return getLevelConfig(mode, level);
  }
}
