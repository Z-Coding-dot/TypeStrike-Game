import type { LanguageCode } from "./language";

export type GameMode = "letters" | "words" | "sentences";

export type TargetKind = "letter" | "word" | "sentence";

export type GameStatus =
  | "menu"
  | "playing"
  | "paused"
  | "level-complete"
  | "game-over";

export interface LevelConfig {
  level: number;
  /** Number of targets that must be destroyed to clear the level. */
  quota: number;
  /** Maximum number of targets simultaneously present in the scene. */
  maxConcurrent: number;
  /** Movement speed in scene pixels per second at a 1000px reference width. */
  speed: number;
  /** Delay between spawns in milliseconds. */
  spawnIntervalMs: number;
  /** Inclusive minimum content length in grapheme clusters. */
  minLength: number;
  /** Inclusive maximum content length in grapheme clusters. */
  maxLength: number;
  /** 0-1 value used by datasets/sentences to pick harder content. */
  complexity: number;
}

export interface TargetData {
  id: string;
  text: string;
  kind: TargetKind;
  language: LanguageCode;
  /** Scene coordinates in pixels. */
  x: number;
  y: number;
  /** Current movement speed in scene pixels per second. */
  speed: number;
  /** Number of leading grapheme clusters currently matched by the player. */
  matchedGraphemes: number;
  /** A completed target stays frozen until the projectile reaches it. */
  destroying?: boolean;
}

export interface TypingAttemptResult {
  accepted: boolean;
  matchedTargetId: string | null;
  resetInput: boolean;
  correctDelta: number;
  incorrectDelta: number;
}

export interface GameStats {
  score: number;
  combo: number;
  maxCombo: number;
  lives: number;
  level: number;
  targetsCompleted: number;
  correctChars: number;
  incorrectChars: number;
  /** Total printable-character attempts, excluding formatting keys. */
  totalAttempts: number;
  elapsedMs: number;
  wpm: number;
  bestWpm: number;
  accuracy: number;
}

export interface GameResult {
  mode: GameMode;
  language: LanguageCode;
  score: number;
  highestLevel: number;
  targetsCompleted: number;
  correctChars: number;
  incorrectChars: number;
  accuracy: number;
  averageWpm: number;
  bestWpm: number;
  durationMs: number;
  completed: boolean;
  finishedAt: string;
}

export interface ScoreBreakdown {
  base: number;
  comboMultiplier: number;
  lengthBonus: number;
  total: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  speechEnabled: boolean;
  speechRate: number;
  speechVolume: number;
  animationsEnabled: boolean;
}

export interface EngineConfig {
  container: HTMLElement;
  mode: GameMode;
  language: LanguageCode;
  settings: GameSettings;
  callbacks: GameEngineCallbacks;
}

export type GameRenderer = "WebGL" | "Canvas" | "pending";

export interface GameEngineCallbacks {
  onStatsChange: (stats: GameStats) => void;
  onTargetsChange: (targets: TargetData[]) => void;
  onStatusChange: (status: GameStatus) => void;
  onInputReset: () => void;
  onTargetDestroyed: (target: TargetData) => void;
  /** Fired when the visual projectile leaves the ship. */
  onShotFired?: (target: TargetData) => void;
  /** Fired when the visual projectile reaches the target and explodes. */
  onShotImpact?: (target: TargetData) => void;
  onLevelComplete: (level: number) => void;
  onGameOver: (result: GameResult) => void;
  onLifeLost: (lives: number) => void;
  onError: (message: string) => void;
  onSceneReady?: () => void;
  onRendererChange?: (renderer: GameRenderer) => void;
}

export interface GameEngineApi {
  init(): Promise<void>;
  start(): void;
  pause(): void;
  resume(): void;
  advanceLevel(): void;
  restart(): void;
  destroy(): void;
  handleTyping(value: string): TypingAttemptResult;
  updateSettings(settings: GameSettings): void;
  getStats(): GameStats;
  getTargets(): TargetData[];
  getStatus(): GameStatus;
  getRenderer(): GameRenderer;
}

export const INITIAL_STATS: GameStats = {
  score: 0,
  combo: 0,
  maxCombo: 0,
  lives: 3,
  level: 1,
  targetsCompleted: 0,
  correctChars: 0,
  incorrectChars: 0,
  totalAttempts: 0,
  elapsedMs: 0,
  wpm: 0,
  bestWpm: 0,
  accuracy: 100,
};

export const MODE_TO_TARGET_KIND: Record<GameMode, TargetKind> = {
  letters: "letter",
  words: "word",
  sentences: "sentence",
};
