import { describe, expect, it } from "vitest";
import { TargetManager } from "@/game/engine/TargetManager";
import { getLevelConfig } from "@/game/systems/LevelSystem";
import { SHIP_CENTER_FROM_BOTTOM, TARGET_HALF_HEIGHT } from "@/game/systems/GameGeometry";
import type { LanguageCode } from "@/types/language";

function advance(manager: TargetManager, milliseconds: number): void {
  const step = 100;
  let remaining = milliseconds;
  while (remaining > 0) {
    manager.update(Math.min(step, remaining));
    remaining -= step;
  }
}

function createManager(language: LanguageCode) {
  const losses: string[] = [];
  const budget = { value: 10 };
  const manager = new TargetManager({
    mode: "words",
    language,
    level: getLevelConfig("words", 1),
    bounds: { width: 960, height: 600, topY: 28, gameOverY: 82 },
    onLifeLoss: (target) => losses.push(target.text),
    getSpawnBudget: () => budget.value,
    random: () => 0.2,
  });
  return { manager, losses, budget };
}

describe("TargetManager", () => {
  for (const language of ["en", "fa-AF"] as const) {
    it(`spawns ${language} content, moves it and reports boundary loss`, () => {
      const { manager, losses } = createManager(language);

      advance(manager, 1500);
      const [target] = manager.getTargets();
      expect(target).toBeDefined();
      expect(target.language).toBe(language);
      expect(target.y).toBe(28);

      advance(manager, 1000);
      expect(losses).toContain(target.text);
      expect(manager.getTargets()).toHaveLength(0);
    });
  }

  it("freezes a completed target so it cannot cross the boundary before impact", () => {
    const { manager, losses, budget } = createManager("fa-AF");
    advance(manager, 1500);
    const [target] = manager.getTargets();
    expect(manager.markDestroying(target.id)).toBe(true);
    expect(manager.markDestroying(target.id)).toBe(false);
    budget.value = 0;

    const frozenY = target.y;
    advance(manager, 5000);

    expect(losses).toEqual([]);
    expect(manager.getTargets()[0]).toMatchObject({ id: target.id, y: frozenY, destroying: true });
  });

  it("lets targets pass the ship and only costs a life beyond the game-over boundary", () => {
    const losses: string[] = [];
    const budget = { value: 1 };
    const manager = new TargetManager({
      mode: "words",
      language: "en",
      level: {
        ...getLevelConfig("words", 1),
        speed: 100,
        spawnIntervalMs: 100,
        maxConcurrent: 1,
        quota: 1,
      },
      bounds: {
        width: 1000,
        height: 600,
        topY: 28,
        gameOverY: 600 + TARGET_HALF_HEIGHT,
      },
      onLifeLoss: (target) => losses.push(target.id),
      getSpawnBudget: () => budget.value,
      random: () => 0.2,
    });

    advance(manager, 120);
    budget.value = 0;
    const [target] = manager.getTargets();
    expect(target).toBeDefined();

    const shipY = 600 - SHIP_CENTER_FROM_BOTTOM;
    advance(manager, 5600);
    expect(losses).toEqual([]);
    expect(manager.getTargets()).toHaveLength(1);
    expect(manager.getTargets()[0].y).toBeGreaterThan(shipY);

    advance(manager, 300);
    expect(losses).toEqual([target.id]);
    expect(manager.getTargets()).toHaveLength(0);
  });
});
