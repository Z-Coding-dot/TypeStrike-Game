import { describe, expect, it } from "vitest";
import { graphemeLength, normalizeText, toGraphemes } from "@/game/utils/textNormalization";

describe("textNormalization", () => {
  it("composes canonically equivalent text with NFC", () => {
    expect(normalizeText("e\u0301", "en")).toBe("é");
    expect(normalizeText("é", "en")).toBe("é");
  });

  it("maps Arabic yeh/kaf to Persian forms without changing meaning", () => {
    // Contract codepoint for Arabic kaf is U+06AF; comparison uses U+06A9
    // so real Persian content still matches without conflating ک and گ.
    expect(normalizeText("كتاب و قلمي", "fa-AF")).toBe("\u06AFتاب و قلمی");
    expect(normalizeText("كتاب", "en")).toBe("كتاب");
  });

  it("preserves ZWNJ, punctuation and Persian diacritics", () => {
    const input = "کتاب\u200Cخانه، سفینه!";
    expect(normalizeText(input, "fa-AF")).toBe(input);
  });

  it("collapses ordinary whitespace and trims", () => {
    expect(normalizeText("  neon\t ship\n strike  ", "en")).toBe("neon ship strike");
    expect(normalizeText("  سفینه   درخشان  ", "fa-AF")).toBe("سفینه درخشان");
  });

  it("case-folds English only", () => {
    expect(normalizeText("Neon SHIP", "en")).toBe("neon ship");
    expect(normalizeText("Neon SHIP", "fa-AF")).toBe("Neon SHIP");
  });

  it("counts grapheme clusters rather than UTF-16 units", () => {
    expect(toGraphemes("👨‍👩‍👧‍👦")).toHaveLength(1);
    expect(toGraphemes("پ")).toHaveLength(1);
    expect(toGraphemes("e\u0301")).toHaveLength(1);
    expect(graphemeLength("👨‍👩‍👧‍👦 پ")).toBe(3);
    expect(toGraphemes("")).toEqual([]);
  });
});
