import type { LanguageCode } from "@/types/language";

/**
 * Unicode-aware, meaning-preserving text helpers used by the typing engine.
 *
 * Persian normalization deliberately performs only the two safe letter
 * equivalences required by the product spec (Arabic yeh/kaf -> Persian
 * yeh/kaf). Diacritics, punctuation, and ZWNJ are preserved because removing
 * them changes Persian words.
 */

const ARABIC_YEH = /\u064A/g;
const ARABIC_KAF = /\u0643/g;
const ORDINARY_WHITESPACE = /[\s\uFEFF]+/g;

type SegmenterLike = {
  segment(input: string): Iterable<{ segment: string }>;
};

interface SegmenterConstructor {
  new (locales?: string | string[], options?: { granularity?: "grapheme" | "word" | "sentence" }): SegmenterLike;
}

function getSegmenter(): SegmenterLike | null {
  const IntlWithSegmenter = Intl as typeof Intl & { Segmenter?: SegmenterConstructor };
  const Segmenter = IntlWithSegmenter.Segmenter;
  if (!Segmenter) return null;
  try {
    return new Segmenter(undefined, { granularity: "grapheme" });
  } catch {
    return null;
  }
}

const segmenter = getSegmenter();

/**
 * Fallback for runtimes without Intl.Segmenter. It keeps combining marks,
 * ZWNJ, and ZWJ sequences attached to their base code point. It is not a
 * complete Unicode grapheme implementation, but is safe for this game's data.
 */
function fallbackGraphemes(text: string): string[] {
  if (text.length === 0) return [];
  const clusters = text.match(/\P{Mark}(?:[\p{Mark}\u200C]|\u200D\P{Mark})*/gu);
  if (!clusters) return [text];
  return clusters;
}

/** Splits text into user-perceived characters (grapheme clusters). */
export function toGraphemes(text: string): string[] {
  if (!text) return [];
  if (segmenter) {
    return Array.from(segmenter.segment(text), (part) => part.segment);
  }
  return fallbackGraphemes(text);
}

/** Number of user-perceived characters, not UTF-16 code units. */
export function graphemeLength(text: string): number {
  return toGraphemes(text).length;
}

function normalizeCommon(input: string, language: LanguageCode, kafReplacement: string): string {
  if (!input) return "";

  let value = input.normalize("NFC");

  if (language === "fa-AF") {
    value = value.replace(ARABIC_YEH, "\u06CC").replace(ARABIC_KAF, kafReplacement);
  } else {
    value = value.toLocaleLowerCase("en-US");
  }

  return value.replace(ORDINARY_WHITESPACE, " ").trim();
}

/**
 * Normalizes input or target text.
 * - NFC canonical composition
 * - Persian yeh/kaf equivalences (Persian content only)
 * - case folding for English only
 * - trimmed/collapsed ordinary whitespace; ZWNJ and punctuation preserved
 *
 * The kaf mapping follows the engine contract (U+0643 -> U+06AF).
 */
export function normalizeText(input: string, language: LanguageCode): string {
  return normalizeCommon(input, language, "\u06AF");
}

/**
 * Comparison-only normalization. It uses the linguistically correct Persian
 * kaf (U+06A9) so Arabic kaf matches Persian content without conflating
 * Persian ک with Persian گ (U+06AF). Public `normalizeText` still follows the
 * contract codepoint exactly.
 */
export function normalizeForComparison(input: string, language: LanguageCode): string {
  return normalizeCommon(input, language, "\u06A9");
}

/** Comparison-normalized grapheme clusters, used for prefix highlighting. */
export function normalizedGraphemes(text: string, language: LanguageCode): string[] {
  return toGraphemes(normalizeForComparison(text, language));
}
