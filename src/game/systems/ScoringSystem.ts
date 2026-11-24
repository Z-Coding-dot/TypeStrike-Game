import { SCORE_VALUES } from "@/lib/constants";
import type { ScoreBreakdown, TargetKind } from "@/types/game";
import { calculateComboMultiplier } from "@/game/utils/gameCalculations";

/** Length-bonus thresholds and rates per target kind. */
const LENGTH_BONUS_RULES: Record<TargetKind, { threshold: number; perGrapheme: number }> = {
  letter: { threshold: 1, perGrapheme: 5 },
  word: { threshold: 3, perGrapheme: 15 },
  sentence: { threshold: 8, perGrapheme: 10 },
};

/**
 * Stateless scoring rules. All methods are pure so they can be unit tested
 * without a Phaser/DOM environment.
 */
export class ScoringSystem {
  /** Score for a correctly completed target. */
  scoreTarget(kind: TargetKind, lengthInGraphemes: number, combo: number): ScoreBreakdown {
    const base = SCORE_VALUES[kind];
    const rule = LENGTH_BONUS_RULES[kind];
    const extraLength = Math.max(0, Math.floor(lengthInGraphemes) - rule.threshold);
    const lengthBonus = extraLength * rule.perGrapheme;
    const comboMultiplier = calculateComboMultiplier(combo);
    const total = Math.round((base + lengthBonus) * comboMultiplier);

    return { base, comboMultiplier, lengthBonus, total };
  }

  /** Bonus applied once when a level quota is met. */
  levelCompletionBonus(): number {
    return SCORE_VALUES.levelCompletion;
  }
}

/** Convenience wrapper for tests and callers that do not need an instance. */
export function calculateTargetScore(kind: TargetKind, lengthInGraphemes: number, combo: number): ScoreBreakdown {
  return new ScoringSystem().scoreTarget(kind, lengthInGraphemes, combo);
}
