import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { ContentDifficulty, SentenceEntry, WordEntry } from "@/types/content";
import type { LanguageCode } from "@/types/language";

const DATA_ROOT = path.resolve(process.cwd(), "src", "data");
const ZWNJ = "\u200c";
const DIFFICULTIES: ContentDifficulty[] = [1, 2, 3];
const LOCALES: LanguageCode[] = ["en", "fa-AF"];

const REQUIRED_PERSIAN_LETTERS = [
  "ا", "ب", "پ", "ت", "ث", "ج", "چ", "ح", "خ", "د", "ذ", "ر", "ز", "ژ",
  "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ک", "گ", "ل", "م",
  "ن", "و", "ه", "ی",
];
const EXTRA_PERSIAN_GRAPHEMES = [
  "ء", "آ", "ؤ", "ئ",
  "۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹",
  " ", ZWNJ,
];
const REQUIRED_PERSIAN_WORD_LETTERS = ["پ", "چ", "ژ", "گ", "ک", "ی"];

function loadJson<T>(locale: LanguageCode, file: string): T {
  return JSON.parse(readFileSync(path.join(DATA_ROOT, locale, file), "utf8")) as T;
}

function expectValidEntries(entries: Array<WordEntry | SentenceEntry>): void {
  expect(Array.isArray(entries)).toBe(true);
  for (const entry of entries) {
    expect(typeof entry).toBe("object");
    expect(typeof entry.text).toBe("string");
    expect(entry.text.trim().length).toBeGreaterThan(0);
    expect(DIFFICULTIES).toContain(entry.difficulty);
    expect(entry.text).not.toMatch(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  }
  const texts = entries.map((entry) => entry.text);
  expect(new Set(texts).size).toBe(texts.length);
}

function countsByDifficulty(entries: Array<WordEntry | SentenceEntry>): Record<ContentDifficulty, number> {
  return {
    1: entries.filter((entry) => entry.difficulty === 1).length,
    2: entries.filter((entry) => entry.difficulty === 2).length,
    3: entries.filter((entry) => entry.difficulty === 3).length,
  };
}

describe.each(LOCALES)("%s language dataset", (locale) => {
  const letters = loadJson<string[]>(locale, "letters.json");
  const words = loadJson<WordEntry[]>(locale, "words.json");
  const sentences = loadJson<SentenceEntry[]>(locale, "sentences.json");

  it("contains Unicode grapheme letters without duplicates", () => {
    expect(Array.isArray(letters)).toBe(true);
    expect(letters.length).toBeGreaterThanOrEqual(locale === "en" ? 26 : 48);
    expect(new Set(letters).size).toBe(letters.length);
    for (const letter of letters) {
      expect(typeof letter).toBe("string");
      expect([...letter].length).toBe(1);
    }
    if (locale === "en") {
      expect(letters).toEqual([..."abcdefghijklmnopqrstuvwxyz"]);
    }
  });

  it("has at least 120 unique words in all difficulty tiers", () => {
    expect(words.length).toBeGreaterThanOrEqual(120);
    expectValidEntries(words);
    const counts = countsByDifficulty(words);
    for (const difficulty of DIFFICULTIES) {
      expect(counts[difficulty]).toBeGreaterThanOrEqual(10);
    }
  });

  it("has at least 35 unique sentences with spaces and punctuation", () => {
    expect(sentences.length).toBeGreaterThanOrEqual(35);
    expectValidEntries(sentences);
    const counts = countsByDifficulty(sentences);
    for (const difficulty of DIFFICULTIES) {
      expect(counts[difficulty]).toBeGreaterThanOrEqual(5);
    }
    for (const sentence of sentences) {
      expect(sentence.text).toContain(" ");
      expect(sentence.text).toMatch(/[.!?،؟!]/);
    }
  });
});

describe("Persian dataset specifics", () => {
  const letters = loadJson<string[]>("fa-AF", "letters.json");
  const words = loadJson<WordEntry[]>("fa-AF", "words.json");
  const sentences = loadJson<SentenceEntry[]>("fa-AF", "sentences.json");

  it("includes every required Persian character, numeral, space and ZWNJ", () => {
    for (const grapheme of [...REQUIRED_PERSIAN_LETTERS, ...EXTRA_PERSIAN_GRAPHEMES]) {
      expect(letters).toContain(grapheme);
    }
  });

  it("uses authentic Persian words containing the distinctive letters", () => {
    const wordText = words.map((entry) => entry.text).join(" ");
    for (const letter of REQUIRED_PERSIAN_WORD_LETTERS) {
      expect(wordText).toContain(letter);
    }
  });

  it("contains natural sentences with ZWNJ and Persian punctuation", () => {
    expect(sentences.filter((entry) => entry.text.includes(ZWNJ)).length).toBeGreaterThanOrEqual(5);
    expect(sentences.some((entry) => entry.text.includes("،"))).toBe(true);
    expect(sentences.some((entry) => entry.text.includes("؟"))).toBe(true);
    expect(sentences.some((entry) => entry.text.includes("!"))).toBe(true);
    expect(sentences.some((entry) => entry.text.includes("."))).toBe(true);
  });
});
