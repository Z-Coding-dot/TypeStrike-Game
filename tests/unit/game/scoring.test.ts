import { describe, expect, it } from "vitest";
import { calculateTargetScore, ScoringSystem } from "@/game/systems/ScoringSystem";
import { SCORE_VALUES } from "@/lib/constants";

describe("ScoringSystem", () => {
  it("uses the base values for each target kind", () => {
    expect(calculateTargetScore("letter", 1, 0)).toMatchObject({
      base: SCORE_VALUES.letter,
      lengthBonus: 0,
      total: 10,
    });
    expect(calculateTargetScore("word", 3, 0).base).toBe(100);
    expect(calculateTargetScore("sentence", 8, 0).base).toBe(250);
  });

  it("awards a length bonus for longer targets", () => {
    expect(calculateTargetScore("word", 6, 0).lengthBonus).toBe(45);
    expect(calculateTargetScore("sentence", 12, 0).lengthBonus).toBe(40);
    expect(calculateTargetScore("word", 2, 0).lengthBonus).toBe(0);
  });

  it("applies and caps the combo multiplier", () => {
    const fresh = calculateTargetScore("word", 3, 0);
    const combo = calculateTargetScore("word", 3, 10);
    const capped = calculateTargetScore("word", 3, 100);

    expect(fresh.comboMultiplier).toBe(1);
    expect(combo.comboMultiplier).toBe(1.5);
    expect(capped.comboMultiplier).toBe(2);
    expect(combo.total).toBe(150);
    expect(capped.total).toBe(200);
  });

  it("returns the fixed level-completion bonus", () => {
    expect(new ScoringSystem().levelCompletionBonus()).toBe(300);
  });

  it("never produces a negative score", () => {
    expect(calculateTargetScore("letter", 0, -5).total).toBeGreaterThanOrEqual(0);
  });
});
