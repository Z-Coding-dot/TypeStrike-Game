export type ContentDifficulty = 1 | 2 | 3;

export interface WordEntry {
  text: string;
  difficulty: ContentDifficulty;
}

export interface SentenceEntry {
  text: string;
  difficulty: ContentDifficulty;
}

export interface LanguageDataset {
  letters: string[];
  words: WordEntry[];
  sentences: SentenceEntry[];
}
