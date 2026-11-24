import type { GameMode, LevelConfig } from "@/types/game";
import type { LanguageCode } from "@/types/language";

export const MAX_LIVES = 3;
export const WPM_WORD_LENGTH = 5;

export const SCORE_VALUES = {
  letter: 10,
  word: 100,
  sentence: 250,
  levelCompletion: 300,
} as const;

export const COMBO_STEP = 0.05;
export const COMBO_MULTIPLIER_CAP = 2;

export const STORAGE_KEYS = {
  settings: "typestrike.settings.v1",
  stats: "typestrike.stats.v1",
  language: "typestrike.language.v1",
  mode: "typestrike.mode.v1",
} as const;

export const MODE_LABELS: Record<LanguageCode, Record<GameMode, string>> = {
  en: {
    letters: "Letter Strike",
    words: "Word Strike",
    sentences: "Sentence Strike",
  },
  "fa-AF": {
    letters: "حرف\u200cزن",
    words: "واژه\u200cزن",
    sentences: "جمله\u200cزن",
  },
};

export const MODE_DESCRIPTIONS: Record<LanguageCode, Record<GameMode, string>> = {
  en: {
    letters: "React faster as single characters close in on your ship.",
    words: "Lock onto incoming words and fire with a complete match.",
    sentences: "Type full sentences to destroy high-value targets.",
  },
  "fa-AF": {
    letters: "با نزدیک شدن حرف‌ها به سفینه، سریعتر واکنش نشان دهید.",
    words: "واژه‌های در حال حرکت را با تایپ کامل هدف بگیرید.",
    sentences: "جمله‌های کامل را تایپ کنید تا اهداف ارزشمندتر را نابود کنید.",
  },
};

/** Base tuning values. LevelSystem extends them smoothly without a hard cap. */
export const LEVEL_BASE: Record<GameMode, Omit<LevelConfig, "level" | "complexity">> = {
  letters: {
    quota: 8,
    maxConcurrent: 3,
    speed: 52,
    spawnIntervalMs: 1200,
    minLength: 1,
    maxLength: 1,
  },
  words: {
    quota: 6,
    maxConcurrent: 2,
    speed: 44,
    spawnIntervalMs: 1500,
    minLength: 3,
    maxLength: 6,
  },
  sentences: {
    quota: 4,
    maxConcurrent: 2,
    speed: 34,
    spawnIntervalMs: 2100,
    minLength: 8,
    maxLength: 24,
  },
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
