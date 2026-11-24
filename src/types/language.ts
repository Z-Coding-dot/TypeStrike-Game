export type LanguageCode = "en" | "fa-AF";

export type TextDirection = "ltr" | "rtl";

export interface LanguageDefinition {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  direction: TextDirection;
  speechLocales: readonly string[];
  fontFamily: string;
}

export const LANGUAGE_DEFINITIONS: Record<LanguageCode, LanguageDefinition> = {
  en: {
    code: "en",
    label: "English",
    nativeLabel: "English",
    direction: "ltr",
    speechLocales: ["en-US", "en-GB", "en"],
    fontFamily: "var(--font-en)",
  },
  "fa-AF": {
    code: "fa-AF",
    label: "Persian",
    nativeLabel: "دری",
    direction: "rtl",
    speechLocales: ["prs-AF", "fa-AF", "fa-IR", "fa"],
    fontFamily: "var(--font-fa)",
  },
};

export function isLanguageCode(value: unknown): value is LanguageCode {
  return value === "en" || value === "fa-AF";
}

export function directionForLanguage(language: LanguageCode): TextDirection {
  return LANGUAGE_DEFINITIONS[language].direction;
}
