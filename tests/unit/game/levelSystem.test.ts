import { describe, expect, it } from "vitest";
import { getLevelConfig, LevelSystem } from "@/game/systems/LevelSystem";
import { getDifficultyProfile, pickDifficultyFromComplexity } from "@/game/systems/DifficultySystem";
import { LEVEL_BASE } from "@/lib/constants";
import type { GameMode } from "@/types/game";

const MODES: GameMode[] = ["letters", "words", "sentences"];

describe("LevelSystem", () => {
  it("matches LEVEL_BASE at level 1 for every mode", () => {
    for (const mode of MODES) {
      const config = getLevelConfig(mode, 1);
      expect(config.level).toBe(1);
      expect(config.quota).toBe(LEVEL_BASE[mode].quota);
      expect(config.maxConcurrent).toBe(LEVEL_BASE[mode].maxConcurrent);
      expect(config.speed).toBe(LEVEL_BASE[mode].speed);
      expect(config.spawnIntervalMs).toBe(LEVEL_BASE[mode].spawnIntervalMs);
      expect(config.minLength).toBe(LEVEL_BASE[mode].minLength);
      expect(config.maxLength).toBe(LEVEL_BASE[mode].maxLength);
    }
  });

  it("uses distinct quotas per mode", () => {
    const quotas = MODES.map((mode) => getLevelConfig(mode, 1).quota);
    expect(new Set(quotas).size).toBe(MODES.length);
  });

  it("increases quota and speed smoothly while shortening spawn intervals", () => {
    for (const mode of MODES) {
      const first = getLevelConfig(mode, 1);
      const fifth = getLevelConfig(mode, 5);
      const tenth = getLevelConfig(mode, 10);

      expect(tenth.quota).toBeGreaterThan(fifth.quota);
      expect(fifth.quota).toBeGreaterThan(first.quota);
      expect(tenth.speed).toBeGreaterThan(fifth.speed);
      expect(fifth.speed).toBeGreaterThan(first.speed);
      expect(tenth.spawnIntervalMs).toBeLessThan(fifth.spawnIntervalMs);
      expect(fifth.spawnIntervalMs).toBeLessThan(first.spawnIntervalMs);
      expect(tenth.complexity).toBeGreaterThan(first.complexity);
      expect(tenth.complexity).toBeLessThanOrEqual(1);
    }
  });

  it("keeps content length ranges valid and grows them for words/sentences", () => {
    for (const mode of MODES) {
      const first = getLevelConfig(mode, 1);
      const tenth = getLevelConfig(mode, 10);
      expect(tenth.minLength).toBeLessThanOrEqual(tenth.maxLength);
      expect(tenth.maxConcurrent).toBeLessThanOrEqual(tenth.quota);

      if (mode === "letters") {
        expect(tenth.minLength).toBe(1);
        expect(tenth.maxLength).toBe(1);
      } else {
        expect(tenth.minLength).toBeGreaterThanOrEqual(first.minLength);
        expect(tenth.maxLength).toBeGreaterThan(first.maxLength);
      }
    }
  });

  it("has no hard maximum level", () => {
    const deep = LevelSystem.getLevelConfig("words", 1000);
    expect(Number.isFinite(deep.quota)).toBe(true);
    expect(Number.isFinite(deep.speed)).toBe(true);
    expect(deep.quota).toBeGreaterThan(getLevelConfig("words", 999).quota);
  });

  it("exposes a difficulty profile with weighted dataset difficulty", () => {
    const profile = getDifficultyProfile("sentences", 12);
    expect(profile.level).toBe(12);
    expect(profile.difficultyWeights).toHaveLength(3);
    expect(pickDifficultyFromComplexity(1, () => 0.99)).toBe(3);
    expect(pickDifficultyFromComplexity(0, () => 0)).toBe(1);
  });
});
