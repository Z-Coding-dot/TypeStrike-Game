import { describe, expect, it } from "vitest";
import { UI_TEXT, translate } from "@/lib/i18n";
import { directionForLanguage, isLanguageCode } from "@/types/language";

describe("i18n dictionary", () => {
  it("has identical keys for English and Persian", () => {
    expect(Object.keys(UI_TEXT.en).sort()).toEqual(Object.keys(UI_TEXT["fa-AF"]).sort());
  });

  it("contains no empty translations", () => {
    for (const dictionary of Object.values(UI_TEXT)) {
      for (const [key, value] of Object.entries(dictionary)) {
        expect(value.trim(), key).not.toBe("");
      }
    }
  });

  it("translates core game labels", () => {
    expect(translate("en", "score")).toBe("Score");
    expect(translate("fa-AF", "score")).toBe("امتیاز");
    expect(translate("fa-AF", "playNow")).toContain("بازی");
  });

  it("recognizes only the two supported player languages", () => {
    expect(isLanguageCode("en")).toBe(true);
    expect(isLanguageCode("fa-AF")).toBe(true);
    expect(isLanguageCode("fa-IR")).toBe(false);
    expect(directionForLanguage("fa-AF")).toBe("rtl");
    expect(directionForLanguage("en")).toBe("ltr");
  });
});
