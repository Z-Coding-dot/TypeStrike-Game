import lettersEn from "@/data/en/letters.json";
import sentencesEn from "@/data/en/sentences.json";
import wordsEn from "@/data/en/words.json";
import lettersFa from "@/data/fa-AF/letters.json";
import sentencesFa from "@/data/fa-AF/sentences.json";
import wordsFa from "@/data/fa-AF/words.json";
import type { LanguageDataset, SentenceEntry, WordEntry } from "@/types/content";
import { MODE_TO_TARGET_KIND } from "@/types/game";
import type { GameMode, LevelConfig, TargetData, TargetKind } from "@/types/game";
import type { LanguageCode } from "@/types/language";
import { clamp } from "@/lib/constants";
import { calculateLaneCenters } from "@/game/systems/CollisionSystem";
import {
  DEFAULT_DIFFICULTY_CONFIG,
  difficultyWeightsForComplexity,
  pickDifficultyFromComplexity,
  scaleSpeedForWidth,
} from "@/game/systems/DifficultySystem";
import { graphemeLength } from "@/game/utils/textNormalization";

/**
 * Datasets are authored as static JSON by the content agent. Casting narrows
 * the inferred `difficulty: number` to ContentDifficulty without changing data.
 */
const DATASETS: Record<LanguageCode, LanguageDataset> = {
  en: {
    letters: lettersEn as unknown as string[],
    words: wordsEn as unknown as WordEntry[],
    sentences: sentencesEn as unknown as SentenceEntry[],
  },
  "fa-AF": {
    letters: lettersFa as unknown as string[],
    words: wordsFa as unknown as WordEntry[],
    sentences: sentencesFa as unknown as SentenceEntry[],
  },
};

/** Safety net only: used if a dataset is empty, never as primary content. */
const FALLBACK_DATASETS: Record<LanguageCode, LanguageDataset> = {
  en: {
    letters: ["a", "e", "i", "o", "u", "s", "t", "r"],
    words: [
      { text: "orbit", difficulty: 1 },
      { text: "signal", difficulty: 2 },
      { text: "velocity", difficulty: 3 },
    ],
    sentences: [
      { text: "The signal is clear.", difficulty: 1 },
      { text: "The ship crosses the quiet orbit.", difficulty: 2 },
      { text: "Careful timing keeps every target in range.", difficulty: 3 },
    ],
  },
  "fa-AF": {
    letters: ["ا", "ب", "پ", "ت", "چ", "ژ", "گ", "ک", "ی"],
    words: [
      { text: "سفینه", difficulty: 1 },
      { text: "درخشش", difficulty: 2 },
      { text: "سرعت", difficulty: 3 },
    ],
    sentences: [
      { text: "سفینه به آرامی حرکت میکند.", difficulty: 1 },
      { text: "پرتو درخشانی در تاریکی دیده شد.", difficulty: 2 },
      { text: "با تایپ درست، هدف نابود شد.", difficulty: 3 },
    ],
  },
};

export interface TargetManagerBounds {
  width: number;
  height: number;
  topY: number;
  dangerY: number;
}

export interface TargetManagerOptions {
  mode: GameMode;
  language: LanguageCode;
  level: LevelConfig;
  bounds: TargetManagerBounds;
  onLifeLoss: (target: TargetData) => void;
  onTargetsChange?: (targets: TargetData[]) => void;
  /** Number of additional targets the engine still needs destroyed. */
  getSpawnBudget: () => number;
  random?: () => number;
}

const MIN_VERTICAL_GAP = 56;
const TARGET_HALF_HEIGHT = 18;
const MAX_FRAME_DELTA_MS = 100;

/**
 * Owns target spawning, movement, lane allocation, and danger-boundary loss
 * detection. It contains no React or Phaser dependencies.
 */
export class TargetManager {
  private readonly mode: GameMode;
  private readonly language: LanguageCode;
  private readonly kind: TargetKind;
  private readonly onLifeLoss: (target: TargetData) => void;
  private readonly onTargetsChange?: (targets: TargetData[]) => void;
  private readonly getSpawnBudget: () => number;
  private readonly random: () => number;

  private level: LevelConfig;
  private bounds: TargetManagerBounds;
  private targets: TargetData[] = [];
  private readonly destroying = new Set<string>();
  private readonly laneByTarget = new Map<string, number>();
  private laneCenters: number[] = [];
  private nextLane = 0;
  private sequence = 0;
  private spawnTimerMs = 0;

  constructor(options: TargetManagerOptions) {
    this.mode = options.mode;
    this.language = options.language;
    this.kind = MODE_TO_TARGET_KIND[options.mode];
    this.level = options.level;
    this.bounds = { ...options.bounds };
    this.onLifeLoss = options.onLifeLoss;
    this.onTargetsChange = options.onTargetsChange;
    this.getSpawnBudget = options.getSpawnBudget;
    this.random = options.random ?? Math.random;
    this.recalculateLanes();
  }

  getTargets(): TargetData[] {
    return this.targets.map((target) => ({ ...target }));
  }

  setLevel(level: LevelConfig): void {
    this.level = level;
    this.spawnTimerMs = 0;
    this.recalculateLanes();
  }

  setBounds(bounds: Partial<TargetManagerBounds>): void {
    this.bounds = { ...this.bounds, ...bounds };
    this.recalculateLanes();
    for (const target of this.targets) {
      const lane = this.laneByTarget.get(target.id);
      if (lane !== undefined && this.laneCenters[lane] !== undefined) {
        target.x = this.laneCenters[lane];
      }
    }
    this.emitTargets();
  }

  /** Freezes a completed target until the projectile impact finalizes it. */
  markDestroying(id: string): boolean {
    const target = this.targets.find((item) => item.id === id);
    if (!target) return false;
    this.destroying.add(id);
    target.destroying = true;
    return true;
  }

  /** Advances all targets and spawns new ones when the level still needs them. */
  update(deltaMs: number): void {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) return;
    const dt = Math.min(deltaMs, MAX_FRAME_DELTA_MS);

    const speed = scaleSpeedForWidth(this.level.speed, this.bounds.width, DEFAULT_DIFFICULTY_CONFIG);
    let changed = false;

    for (const target of this.targets) {
      target.speed = speed;
      if (this.destroying.has(target.id)) continue;
      target.y += speed * (dt / 1000);
    }

    const escaped = this.targets.filter(
      (target) =>
        !this.destroying.has(target.id) && target.y + TARGET_HALF_HEIGHT >= this.bounds.dangerY,
    );

    if (escaped.length > 0) {
      const escapedIds = new Set(escaped.map((target) => target.id));
      this.targets = this.targets.filter((target) => !escapedIds.has(target.id));
      for (const id of escapedIds) {
        this.laneByTarget.delete(id);
        this.destroying.delete(id);
      }
      changed = true;
      // Notify after state is consistent; the engine may reset/clear on life loss.
      for (const target of escaped) this.onLifeLoss({ ...target });
    }

    if (this.targets.length === 0 && escaped.length > 0) {
      if (changed) this.emitTargets();
      return;
    }

    this.spawnTimerMs += dt;
    const interval = Math.max(120, this.level.spawnIntervalMs);

    while (this.spawnTimerMs >= interval) {
      if (this.getSpawnBudget() <= 0 || this.targets.length >= this.level.maxConcurrent) {
        this.spawnTimerMs = interval;
        break;
      }

      const target = this.spawnTarget(speed);
      if (!target) {
        this.spawnTimerMs = interval;
        break;
      }

      this.targets.push(target);
      changed = true;
      this.spawnTimerMs -= interval;
    }

    if (changed) this.emitTargets();
  }

  remove(id: string): TargetData | null {
    const index = this.targets.findIndex((target) => target.id === id);
    if (index < 0) return null;

    const [removed] = this.targets.splice(index, 1);
    this.laneByTarget.delete(id);
    this.destroying.delete(id);
    this.emitTargets();
    return { ...removed };
  }

  setMatched(id: string, matchedGraphemes: number): void {
    const target = this.targets.find((item) => item.id === id);
    if (!target) return;

    const max = graphemeLength(target.text);
    const next = clamp(Math.floor(matchedGraphemes), 0, max);
    if (target.matchedGraphemes === next) return;

    target.matchedGraphemes = next;
    this.emitTargets();
  }

  clearMatched(): void {
    let changed = false;
    for (const target of this.targets) {
      if (target.matchedGraphemes !== 0) {
        target.matchedGraphemes = 0;
        changed = true;
      }
    }
    if (changed) this.emitTargets();
  }

  clear(): void {
    if (this.targets.length === 0) {
      this.laneByTarget.clear();
      this.destroying.clear();
      return;
    }
    this.targets = [];
    this.laneByTarget.clear();
    this.destroying.clear();
    this.spawnTimerMs = 0;
    this.emitTargets();
  }

  reset(): void {
    this.clear();
    this.sequence = 0;
    this.nextLane = 0;
    this.spawnTimerMs = 0;
    this.recalculateLanes();
  }

  private recalculateLanes(): void {
    const laneCount = Math.max(1, this.level.maxConcurrent);
    this.laneCenters = calculateLaneCenters(this.bounds.width, laneCount);
    this.nextLane = this.nextLane % laneCount;
  }

  private spawnTarget(speed: number): TargetData | null {
    const laneCount = this.laneCenters.length;
    if (laneCount === 0) return null;

    const spawnY = this.bounds.topY;
    let chosenLane = -1;

    for (let offset = 0; offset < laneCount; offset += 1) {
      const lane = (this.nextLane + offset) % laneCount;
      const x = this.laneCenters[lane];
      const blocked = this.targets.some(
        (target) =>
          Math.abs(target.x - x) < 24 && Math.abs(target.y - spawnY) < MIN_VERTICAL_GAP,
      );
      if (!blocked) {
        chosenLane = lane;
        break;
      }
    }

    if (chosenLane < 0) return null;

    const text = this.pickText();
    if (!text) return null;

    this.nextLane = (chosenLane + 1) % laneCount;
    this.sequence += 1;

    return {
      id: `target-${this.mode}-${this.sequence}`,
      text,
      kind: this.kind,
      language: this.language,
      x: this.laneCenters[chosenLane],
      y: spawnY,
      speed,
      matchedGraphemes: 0,
    };
  }

  /** Selects content that fits the current level's length and complexity. */
  private pickText(): string | null {
    const dataset = this.dataset();
    const activeTexts = new Set(this.targets.map((target) => target.text));

    if (this.kind === "letter") {
      const pool = dataset.letters.filter(
        (letter) => graphemeLength(letter) >= this.level.minLength && graphemeLength(letter) <= this.level.maxLength,
      );
      return this.pickUnused(pool, activeTexts) ?? this.pickUnused(dataset.letters, activeTexts);
    }

    const entries = this.kind === "word" ? dataset.words : dataset.sentences;
    const inRange = entries.filter((entry) => {
      const length = graphemeLength(entry.text);
      return length >= this.level.minLength && length <= this.level.maxLength;
    });
    const pool = inRange.length > 0 ? inRange : entries;
    if (pool.length === 0) return null;

    const fresh = this.pickWeighted(pool.filter((entry) => !activeTexts.has(entry.text)));
    return fresh?.text ?? this.pickWeighted(pool)?.text ?? null;
  }

  private dataset(): LanguageDataset {
    const primary = DATASETS[this.language];
    const hasContent =
      (this.kind === "letter" && primary.letters.length > 0) ||
      (this.kind === "word" && primary.words.length > 0) ||
      (this.kind === "sentence" && primary.sentences.length > 0);
    return hasContent ? primary : FALLBACK_DATASETS[this.language];
  }

  private pickUnused(pool: readonly string[], activeTexts: Set<string>): string | null {
    const available = pool.filter((text) => !activeTexts.has(text));
    if (available.length === 0) return null;
    return available[Math.floor(clamp(this.random(), 0, 0.999999) * available.length)] ?? null;
  }

  private pickWeighted(entries: readonly WordEntry[]): WordEntry | null {
    if (entries.length === 0) return null;

    const difficulty = pickDifficultyFromComplexity(this.level.complexity, this.random);
    const weights = difficultyWeightsForComplexity(this.level.complexity);
    const sameDifficulty = entries.filter((entry) => entry.difficulty === difficulty);
    const weightedPool = sameDifficulty.length > 0 ? sameDifficulty : entries;

    const total = weightedPool.reduce((sum, entry) => sum + weights[entry.difficulty - 1], 0);
    if (total <= 0) return weightedPool[0] ?? null;

    let roll = clamp(this.random(), 0, 0.999999) * total;
    for (const entry of weightedPool) {
      roll -= weights[entry.difficulty - 1];
      if (roll <= 0) return entry;
    }
    return weightedPool[weightedPool.length - 1] ?? null;
  }

  private emitTargets(): void {
    this.onTargetsChange?.(this.getTargets());
  }
}
