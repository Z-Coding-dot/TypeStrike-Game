import { clamp } from "@/lib/constants";
import type { ContentDifficulty } from "@/types/content";
import type { GameMode, LevelConfig } from "@/types/game";
import { getLevelConfig } from "./LevelSystem";

export interface DifficultyProfile extends LevelConfig {
  /** Relative weights for dataset difficulty 1, 2, and 3. */
  difficultyWeights: readonly [number, number, number];
}

export interface DifficultyConfig {
  referenceWidth: number;
  minWidthScale: number;
  maxWidthScale: number;
  /** How strongly complexity favors harder dataset entries. */
  hardBias: number;
}

export const DEFAULT_DIFFICULTY_CONFIG: DifficultyConfig = {
  referenceWidth: 1000,
  minWidthScale: 0.6,
  maxWidthScale: 2,
  hardBias: 1.5,
};

/** All tunable difficulty values for one level. */
export function getDifficultyProfile(mode: GameMode, level: number): DifficultyProfile {
  const config = getLevelConfig(mode, level);
  return {
    ...config,
    difficultyWeights: difficultyWeightsForComplexity(config.complexity),
  };
}

/**
 * Complexity 0 favors difficulty 1 entries; complexity 1 favors difficulty 3.
 * Difficulty 1 never disappears entirely, so easy content remains possible.
 */
export function difficultyWeightsForComplexity(
  complexity: number,
  config: DifficultyConfig = DEFAULT_DIFFICULTY_CONFIG,
): readonly [number, number, number] {
  const c = clamp(Number.isFinite(complexity) ? complexity : 0, 0, 1);
  const bias = config.hardBias;
  const easy = 1 + (1 - c) * bias;
  const medium = 1 + Math.sin(Math.PI * c) * bias * 0.5;
  const hard = 1 + c * bias;
  return [easy, medium, hard];
}

/** Weighted random choice of dataset difficulty. */
export function pickDifficultyFromComplexity(
  complexity: number,
  random: () => number = Math.random,
  config: DifficultyConfig = DEFAULT_DIFFICULTY_CONFIG,
): ContentDifficulty {
  const weights = difficultyWeightsForComplexity(complexity, config);
  const total = weights[0] + weights[1] + weights[2];
  const roll = clamp(random(), 0, 0.999999) * total;

  if (roll < weights[0]) return 1;
  if (roll < weights[0] + weights[1]) return 2;
  return 3;
}

/**
 * LevelConfig speeds are authored at a reference width. Scale them to the
 * actual canvas width while keeping movement usable on very narrow screens.
 */
export function scaleSpeedForWidth(
  speed: number,
  width: number,
  config: DifficultyConfig = DEFAULT_DIFFICULTY_CONFIG,
): number {
  const factor = clamp(width / config.referenceWidth, config.minWidthScale, config.maxWidthScale);
  return Math.max(1, speed * factor);
}
