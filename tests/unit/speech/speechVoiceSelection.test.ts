import { describe, expect, it } from "vitest";
import {
  selectVoiceForLanguage,
  type SpeechVoiceCandidate,
} from "@/game/systems/SpeechSystem";

function voice(lang: string, name: string, localService = false): SpeechVoiceCandidate {
  return { lang, name, localService };
}

describe("selectVoiceForLanguage", () => {
  it("returns null when there are no voices", () => {
    expect(selectVoiceForLanguage([], "en")).toBeNull();
    expect(selectVoiceForLanguage([], "fa-AF")).toBeNull();
  });

  it("prefers en-US, then en-GB, then other English voices", () => {
    const british = voice("en-GB", "British English");
    const generic = voice("en", "English");
    const american = voice("en-US", "American English");

    expect(selectVoiceForLanguage([generic, british, american], "en")).toBe(american);
    expect(selectVoiceForLanguage([generic, british], "en")).toBe(british);
    expect(selectVoiceForLanguage([generic], "en")).toBe(generic);
    expect(selectVoiceForLanguage([voice("en-AU", "Australian")], "en")?.lang).toBe("en-AU");
  });

  it("follows the Persian fallback chain prs-AF -> fa-AF -> fa-IR -> fa", () => {
    const fa = voice("fa", "Persian");
    const faIr = voice("fa-IR", "Persian (Iran)");
    const faAf = voice("fa-AF", "Persian (Afghanistan)");
    const prsAf = voice("prs-AF", "Dari (Afghanistan)");

    expect(selectVoiceForLanguage([fa, faIr, faAf, prsAf], "fa-AF")).toBe(prsAf);
    expect(selectVoiceForLanguage([fa, faIr, faAf], "fa-AF")).toBe(faAf);
    expect(selectVoiceForLanguage([fa, faIr], "fa-AF")).toBe(faIr);
    expect(selectVoiceForLanguage([fa], "fa-AF")).toBe(fa);
  });

  it("never uses an English voice to read Persian", () => {
    const englishOnly = [
      voice("en-US", "American English"),
      voice("en-GB", "British English"),
      voice("en", "English"),
      voice("en-US", "Persian"),
    ];
    expect(selectVoiceForLanguage(englishOnly, "fa-AF")).toBeNull();
  });

  it("never uses a Persian voice to read English", () => {
    const persianOnly = [voice("prs-AF", "Dari"), voice("fa-IR", "Persian")];
    expect(selectVoiceForLanguage(persianOnly, "en")).toBeNull();
  });

  it("normalizes case and underscores and accepts locale subtags", () => {
    expect(selectVoiceForLanguage([voice("FA_IR", "Persian")], "fa-AF")?.lang).toBe("FA_IR");
    expect(selectVoiceForLanguage([voice("fa-IR-u-nu-latn", "Persian")], "fa-AF")?.lang).toBe(
      "fa-IR-u-nu-latn",
    );
  });

  it("prefers a local service voice when locale preference is equal", () => {
    const remote = voice("en-US", "Remote voice", false);
    const local = voice("en-US", "Local voice", true);
    expect(selectVoiceForLanguage([remote, local], "en")).toBe(local);
  });

  it("ignores unrelated languages and does not mutate the input", () => {
    const voices = [voice("fr-FR", "French"), voice("de-DE", "German")];
    const snapshot = [...voices];

    expect(selectVoiceForLanguage(voices, "en")).toBeNull();
    expect(selectVoiceForLanguage(voices, "fa-AF")).toBeNull();
    expect(voices).toEqual(snapshot);
  });
});
