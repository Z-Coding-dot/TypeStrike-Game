import type { LanguageCode } from "@/types/language";
import { normalizeForComparison, normalizedGraphemes } from "./textNormalization";

/** Minimal shape needed to rank a typing candidate. TargetData satisfies it. */
export interface TypingCandidate {
  id: string;
  text: string;
  x?: number;
  y?: number;
}

/** Exact normalized equality. Empty strings never match a target. */
export function matchesTarget(input: string, target: string, language: LanguageCode): boolean {
  if (!input || !target) return false;
  return normalizeForComparison(input, language) === normalizeForComparison(target, language);
}

/**
 * True when `input` is a (possibly complete) normalized grapheme prefix of
 * `target`. Empty input is deliberately not a match so that highlighting does
 * not activate before the player types anything.
 */
export function isPrefixMatch(input: string, target: string, language: LanguageCode): boolean {
  if (!input || !target) return false;

  const typed = normalizedGraphemes(input, language);
  const expected = normalizedGraphemes(target, language);
  if (typed.length === 0 || typed.length > expected.length) return false;

  return typed.every((grapheme, index) => grapheme === expected[index]);
}

/** Number of correctly typed leading graphemes for a target. */
export function getMatchedGraphemeCount(input: string, target: string, language: LanguageCode): number {
  if (!input || !target) return 0;

  const typed = normalizedGraphemes(input, language);
  const expected = normalizedGraphemes(target, language);
  let matched = 0;

  while (matched < typed.length && matched < expected.length && typed[matched] === expected[matched]) {
    matched += 1;
  }

  return matched;
}

/**
 * Selects the target the player is most likely aiming at.
 *
 * Priority:
 * 1. Exact normalized matches beat partial matches.
 * 2. Longer matched prefixes beat shorter ones.
 * 3. Targets closer to the spaceship (larger y) beat targets farther away.
 * 4. id is a deterministic final tie-breaker.
 *
 * Text is never reversed or reordered for RTL; ranking uses only graphemes
 * and scene coordinates.
 */
export function findBestCandidate<T extends TypingCandidate>(
  input: string,
  targets: readonly T[],
  language: LanguageCode,
): T | null {
  if (!input || targets.length === 0) return null;

  let best: T | null = null;
  let bestExact = false;
  let bestMatched = -1;
  let bestY = Number.NEGATIVE_INFINITY;

  for (const target of targets) {
    const matched = getMatchedGraphemeCount(input, target.text, language);
    if (matched <= 0) continue;

    const exact = matched === normalizedGraphemes(target.text, language).length;
    const y = target.y ?? 0;

    const isBetter =
      (exact && !bestExact) ||
      (exact === bestExact && matched > bestMatched) ||
      (exact === bestExact && matched === bestMatched && y > bestY) ||
      (exact === bestExact && matched === bestMatched && y === bestY && best !== null && target.id < best.id);

    if (best === null || isBetter) {
      best = target;
      bestExact = exact;
      bestMatched = matched;
      bestY = y;
    }
  }

  return best;
}
