import { describe, expect, it } from "vitest";
import {
  findBestCandidate,
  getMatchedGraphemeCount,
  isPrefixMatch,
  matchesTarget,
} from "@/game/utils/wordValidation";
import type { TypingCandidate } from "@/game/utils/wordValidation";

const candidate = (id: string, text: string, y = 0): TypingCandidate => ({ id, text, y });

describe("wordValidation", () => {
  it("matches English targets case-insensitively", () => {
    expect(matchesTarget("ORBIT", "orbit", "en")).toBe(true);
    expect(matchesTarget("orbi", "orbit", "en")).toBe(false);
  });

  it("matches Persian targets with alternate Arabic yeh/kaf", () => {
    expect(matchesTarget("كتاب", "کتاب", "fa-AF")).toBe(true);
    expect(matchesTarget("قلمي", "قلمی", "fa-AF")).toBe(true);
    expect(matchesTarget("پ", "پ", "fa-AF")).toBe(true);
    expect(matchesTarget("چ", "ج", "fa-AF")).toBe(false);
  });

  it("supports sentences with spaces, punctuation and ZWNJ", () => {
    const target = "سفینه\u200Cها به آرامی حرکت میکنند.";
    expect(matchesTarget(target, target, "fa-AF")).toBe(true);
    expect(matchesTarget("سفینهها به آرامی حرکت میکنند.", target, "fa-AF")).toBe(false);
    expect(matchesTarget("The ship moves.", "The ship moves.", "en")).toBe(true);
  });

  it("detects prefixes using normalized graphemes", () => {
    expect(isPrefixMatch("or", "orbit", "en")).toBe(true);
    expect(isPrefixMatch("orbit", "orbit", "en")).toBe(true);
    expect(isPrefixMatch("", "orbit", "en")).toBe(false);
    expect(isPrefixMatch("orbit!", "orbit", "en")).toBe(false);
    expect(getMatchedGraphemeCount("كتاب", "کتاب", "fa-AF")).toBe(4);
  });

  it("prefers an exact match over a longer partial match", () => {
    const targets = [
      candidate("partial", "orbiting", 500),
      candidate("exact", "orbit", 10),
    ];
    expect(findBestCandidate("orbit", targets, "en")?.id).toBe("exact");
  });

  it("breaks partial ties by closeness to the player, then id", () => {
    const targets = [
      candidate("far", "orbital", 20),
      candidate("near", "orbiting", 480),
      candidate("near-b", "orbited", 480),
    ];
    expect(findBestCandidate("orbi", targets, "en")?.id).toBe("near");
  });

  it("counts emoji as one grapheme when highlighting", () => {
    expect(getMatchedGraphemeCount("👨", "👨‍👩‍👧‍👦", "en")).toBe(0);
    expect((findBestCandidate("👨‍👩‍👧‍👦", [candidate("family", "👨‍👩‍👧‍👦")], "en"))?.id).toBe("family");
  });

  it("returns null for empty input or no prefix", () => {
    expect(findBestCandidate("", [candidate("a", "orbit")], "en")).toBeNull();
    expect(findBestCandidate("xyz", [candidate("a", "orbit")], "en")).toBeNull();
  });
});
