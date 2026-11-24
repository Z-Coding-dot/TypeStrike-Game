import type * as Phaser from "phaser";
import {
  INITIAL_STATS,
  type EngineConfig,
  type GameEngineApi,
  type GameResult,
  type GameRenderer,
  type GameSettings,
  type GameStats,
  type GameStatus,
  type TargetData,
  type TypingAttemptResult,
} from "@/types/game";
import { getLevelConfig } from "@/game/systems/LevelSystem";
import { ScoringSystem } from "@/game/systems/ScoringSystem";
import {
  calculateAccuracy,
  calculateWpm,
} from "@/game/utils/gameCalculations";
import { graphemeLength, normalizeForComparison, toGraphemes } from "@/game/utils/textNormalization";
import { findBestCandidate, getMatchedGraphemeCount, matchesTarget } from "@/game/utils/wordValidation";
import type { TargetManager } from "./TargetManager";
import type { GameScene } from "./GameScene";

const EMPTY_ATTEMPT: TypingAttemptResult = {
  accepted: false,
  matchedTargetId: null,
  resetInput: false,
  correctDelta: 0,
  incorrectDelta: 0,
};

const MIN_CANVAS_WIDTH = 280;
const MIN_CANVAS_HEIGHT = 240;
const DANGER_INSET = 110;
const SPAWN_TOP_Y = 36;
const STATS_EMIT_INTERVAL_MS = 250;
const SCENE_READY_TIMEOUT_MS = 5000;

interface EngineBounds {
  width: number;
  height: number;
  topY: number;
  dangerY: number;
}

/**
 * Headless game-rules facade. Phaser is loaded only in `init()`, so the rules
 * can be unit tested without a DOM or canvas.
 */
export class GameEngine implements GameEngineApi {
  private readonly config: EngineConfig;
  private settings: GameSettings;
  private readonly scoring = new ScoringSystem();

  private status: GameStatus = "menu";
  private stats: GameStats = { ...INITIAL_STATS };
  private targets: TargetData[] = [];
  private levelConfig = getLevelConfig("words", 1);

  private targetManager: TargetManager | null = null;
  private targetManagerFactory: typeof TargetManager | null = null;
  private phaserGame: Phaser.Game | null = null;
  private scene: GameScene | null = null;
  private phaserModule: typeof import("phaser") | null = null;
  private sceneClass: typeof GameScene | null = null;

  private renderer: GameRenderer = "pending";
  private sceneReady = false;
  private sceneReadyPromise: Promise<void> = Promise.resolve();
  private resolveSceneReady: (() => void) | null = null;
  private bootAttempt = 0;
  private renderAttempt = 0;
  private removeContextLostListener: (() => void) | null = null;
  private readonly pendingShots = new Map<string, TargetData>();

  private initialized = false;
  private destroyed = false;
  private destroyedThisLevel = 0;
  private levelCompletePending = false;
  private lastTypedGraphemes: string[] = [];

  private startedAt: number | null = null;
  private elapsedBeforePause = 0;
  private lastStatsEmitAt = 0;

  constructor(config: EngineConfig) {
    this.config = config;
    this.settings = { ...config.settings };
    this.levelConfig = getLevelConfig(config.mode, 1);
  }

  /**
   * Dynamically loads Phaser, validates the renderer, and waits for the scene
   * to start. A framebuffer probe runs before Phaser boots so unsupported or
   * zero-sized WebGL configurations fall back to Canvas instead of throwing
   * `Framebuffer status: Incomplete Attachment`.
   */
  async init(): Promise<void> {
    if (this.initialized || this.destroyed) return;

    const bootAttempt = ++this.bootAttempt;
    const container = this.config.container;
    const width = Math.max(MIN_CANVAS_WIDTH, container.clientWidth || 960);
    const height = Math.max(MIN_CANVAS_HEIGHT, container.clientHeight || 600);

    try {
      const [phaserModule, sceneModule, managerModule] = await Promise.all([
        import("phaser"),
        import("./GameScene"),
        import("./TargetManager"),
      ]);
      if (this.destroyed || bootAttempt !== this.bootAttempt) return;

      this.phaserModule = phaserModule;
      this.sceneClass = sceneModule.GameScene;
      this.targetManagerFactory = managerModule.TargetManager;

      const useWebGL = canCreateWebGLFramebuffer(width, height);
      this.renderer = useWebGL ? "WebGL" : "Canvas";
      this.config.callbacks.onRendererChange?.(this.renderer);

      try {
        await this.bootRenderer(width, height, useWebGL ? phaserModule.WEBGL : phaserModule.CANVAS);
      } catch (bootError) {
        if (!useWebGL || this.destroyed || bootAttempt !== this.bootAttempt) throw bootError;
        // Phaser may still fail asynchronously on a driver-specific framebuffer
        // configuration. Retry once with the universally available Canvas renderer.
        this.renderer = "Canvas";
        this.config.callbacks.onRendererChange?.("Canvas");
        await this.bootRenderer(width, height, phaserModule.CANVAS);
      }

      if (this.destroyed || bootAttempt !== this.bootAttempt) return;
      this.initialized = true;
    } catch (error) {
      this.renderer = this.renderer === "WebGL" ? "WebGL" : "Canvas";
      this.config.callbacks.onError(
        error instanceof Error ? error.message : "Failed to initialize the game engine",
      );
      throw error;
    }
  }

  /** Creates one Phaser game and resolves only once its scene is rendering. */
  private async bootRenderer(width: number, height: number, rendererType: number): Promise<void> {
    const Phaser = this.phaserModule;
    const SceneClass = this.sceneClass;
    const container = this.config.container;
    if (!Phaser || !SceneClass) throw new Error("Phaser modules are not loaded");

    this.removeContextLostListener?.();
    this.removeContextLostListener = null;
    this.phaserGame?.destroy(true);
    this.phaserGame = null;
    for (const canvas of Array.from(container.querySelectorAll("canvas"))) canvas.remove();

    const attempt = ++this.renderAttempt;
    this.sceneReady = false;
    this.sceneReadyPromise = new Promise<void>((resolve) => {
      this.resolveSceneReady = resolve;
    });

    this.scene = new SceneClass({
      onFrame: (deltaMs) => {
        if (attempt === this.renderAttempt) this.tick(deltaMs);
      },
      getTargets: () => this.getTargets(),
      onReady: () => {
        if (attempt === this.renderAttempt) this.markSceneReady();
      },
      onResize: (sceneWidth, sceneHeight) => {
        if (attempt === this.renderAttempt) this.updateBounds(sceneWidth, sceneHeight);
      },
      onShotFired: (target) => {
        if (attempt === this.renderAttempt) this.config.callbacks.onShotFired?.(target);
      },
      onShotImpact: (target) => {
        if (attempt !== this.renderAttempt) return;
        this.config.callbacks.onShotImpact?.(target);
        this.finalizeShot(target);
      },
    });
    this.scene.setAnimationsEnabled(this.settings.animationsEnabled);
    this.scene.setLanguage(this.config.language);

    const game = new Phaser.Game({
      type: rendererType,
      parent: container,
      width,
      height,
      backgroundColor: "#050B14",
      scale: {
        mode: Phaser.Scale.RESIZE,
        width,
        height,
        min: { width: MIN_CANVAS_WIDTH, height: MIN_CANVAS_HEIGHT },
      },
      render: { antialias: rendererType === Phaser.WEBGL, pixelArt: false, transparent: false },
      audio: { noAudio: true },
      scene: [this.scene],
    });
    this.phaserGame = game;

    try {
      await this.waitForSceneReady();
    } catch (error) {
      game.destroy(true);
      if (this.phaserGame === game) this.phaserGame = null;
      throw error;
    }
  }

  private waitForSceneReady(): Promise<void> {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      timeout = setTimeout(
        () => reject(new Error("Game renderer did not start; using Canvas fallback")),
        SCENE_READY_TIMEOUT_MS,
      );
    });
    return Promise.race([this.sceneReadyPromise, timeoutPromise]).finally(() => {
      if (timeout !== null) clearTimeout(timeout);
    });
  }

  private markSceneReady(): void {
    if (this.sceneReady) return;
    this.sceneReady = true;
    if (this.phaserGame && this.renderer === "WebGL") this.watchContextLoss(this.phaserGame);
    this.resolveSceneReady?.();
    this.config.callbacks.onSceneReady?.();
  }

  private watchContextLoss(game: Phaser.Game): void {
    const canvas = game.canvas;
    if (!canvas || typeof canvas.addEventListener !== "function") return;
    const onLost = () => {
      void this.switchToCanvas();
    };
    canvas.addEventListener("webglcontextlost", onLost);
    this.removeContextLostListener = () => canvas.removeEventListener("webglcontextlost", onLost);
  }

  /** Recreates the renderer with Canvas after a WebGL context failure. */
  private async switchToCanvas(): Promise<void> {
    if (this.destroyed || this.renderer !== "WebGL" || !this.phaserModule) return;
    const container = this.config.container;
    const width = Math.max(MIN_CANVAS_WIDTH, container.clientWidth || 960);
    const height = Math.max(MIN_CANVAS_HEIGHT, container.clientHeight || 600);
    const wasPaused = this.status === "paused";

    this.renderer = "Canvas";
    this.config.callbacks.onRendererChange?.("Canvas");
    try {
      await this.bootRenderer(width, height, this.phaserModule.CANVAS);
      if (this.destroyed) return;
      this.scene?.setPaused(wasPaused || this.status !== "playing");
    } catch (error) {
      this.config.callbacks.onError(
        error instanceof Error ? error.message : "Canvas renderer failed to start",
      );
    }
  }

  private updateBounds(width: number, height: number): void {
    const safeHeight = Math.max(MIN_CANVAS_HEIGHT, height);
    this.targetManager?.setBounds({
      width: Math.max(MIN_CANVAS_WIDTH, width),
      height: safeHeight,
      topY: SPAWN_TOP_Y,
      dangerY: Math.max(SPAWN_TOP_Y + 48, safeHeight - DANGER_INSET),
    });
  }

  start(): void {
    if (this.destroyed || this.status === "playing" || this.status === "paused") return;

    this.resetSession();
    this.startClock();
    this.ensureTargetManager();
    this.scene?.setPaused(false);
    this.scene?.setLanguage(this.config.language);
    this.setStatus("playing");
    this.emitStats();
    this.emitTargets();
  }

  pause(): void {
    if (this.status !== "playing") return;
    this.freezeClock();
    this.scene?.setPaused(true);
    this.setStatus("paused");
  }

  resume(): void {
    if (this.status !== "paused") return;
    this.startClock();
    this.scene?.setPaused(false);
    this.setStatus("playing");
  }

  advanceLevel(): void {
    if (this.status !== "level-complete") return;

    const nextLevel = this.stats.level + 1;
    this.targets = [];
    this.pendingShots.clear();
    this.destroyedThisLevel = 0;
    this.levelCompletePending = false;
    this.lastTypedGraphemes = [];
    this.levelConfig = getLevelConfig(this.config.mode, nextLevel);
    this.stats = { ...this.stats, level: nextLevel };

    this.targetManager?.clear();
    this.targetManager?.setLevel(this.levelConfig);
    this.scene?.clearTargets(true);
    this.scene?.setPaused(false);

    this.startClock();
    this.setStatus("playing");
    this.emitStats();
    this.emitTargets();
  }

  restart(): void {
    if (this.destroyed) return;

    this.pendingShots.clear();
    this.resetSession();
    this.startClock();
    this.scene?.clearTargets(true);
    this.scene?.setPaused(false);
    this.setStatus("playing");
    this.emitStats();
    this.emitTargets();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.bootAttempt += 1;
    this.renderAttempt += 1;
    this.resolveSceneReady?.();

    this.freezeClock();
    this.pendingShots.clear();
    this.targetManager?.clear();
    this.targetManager = null;
    this.targetManagerFactory = null;
    this.scene?.clearTargets(true);
    this.removeContextLostListener?.();
    this.removeContextLostListener = null;
    this.phaserGame?.destroy(true);
    this.phaserGame = null;
    this.scene = null;
    this.phaserModule = null;
    this.sceneClass = null;
    this.initialized = false;
  }

  getRenderer(): GameRenderer {
    return this.renderer;
  }

  handleTyping(value: string): TypingAttemptResult {
    if (this.status !== "playing" || this.destroyed) return { ...EMPTY_ATTEMPT };

    const language = this.config.language;
    const typedGraphemes = toGraphemes(normalizeForComparison(value, language));
    const previous = this.lastTypedGraphemes;
    const appendedGraphemes = isGraphemePrefix(previous, typedGraphemes)
      ? typedGraphemes.slice(previous.length)
      : [];
    this.lastTypedGraphemes = typedGraphemes;

    const hittableTargets = this.targets.filter(
      (target) => !target.destroying && !this.pendingShots.has(target.id),
    );
    const candidate = findBestCandidate(value, hittableTargets, language);
    const candidateGraphemes = candidate ? toGraphemes(normalizeForComparison(candidate.text, language)) : [];

    let correctDelta = 0;
    let incorrectDelta = 0;
    for (let index = 0; index < appendedGraphemes.length; index += 1) {
      const expected = candidateGraphemes[previous.length + index];
      if (expected !== undefined && appendedGraphemes[index] === expected) correctDelta += 1;
      else incorrectDelta += 1;
    }

    this.stats = {
      ...this.stats,
      correctChars: this.stats.correctChars + correctDelta,
      incorrectChars: this.stats.incorrectChars + incorrectDelta,
      totalAttempts: this.stats.totalAttempts + appendedGraphemes.length,
    };

    if (!candidate) {
      this.refreshDerivedStats();
      this.emitStats();
      return {
        accepted: false,
        matchedTargetId: null,
        resetInput: false,
        correctDelta,
        incorrectDelta,
      };
    }

    const matched = getMatchedGraphemeCount(value, candidate.text, language);
    this.applyMatched(candidate.id, matched);

    const isComplete = matched >= graphemeLength(candidate.text) && matchesTarget(value, candidate.text, language);
    if (!isComplete) {
      this.refreshDerivedStats();
      this.emitStats();
      return {
        accepted: true,
        matchedTargetId: null,
        resetInput: false,
        correctDelta,
        incorrectDelta,
      };
    }

    const frozen = this.targetManager?.markDestroying(candidate.id) ?? this.freezeLocalTarget(candidate.id);
    if (!frozen) {
      this.refreshDerivedStats();
      this.emitStats();
      return { ...EMPTY_ATTEMPT, correctDelta, incorrectDelta };
    }

    const snapshot: TargetData = {
      ...candidate,
      matchedGraphemes: graphemeLength(candidate.text),
      destroying: true,
    };
    this.pendingShots.set(snapshot.id, snapshot);
    this.lastTypedGraphemes = [];
    this.config.callbacks.onInputReset();
    this.emitTargets();

    // With no renderer (unit tests/headless mode) there is no projectile tween
    // to report impact, so finalize synchronously.
    if (this.scene) this.scene.playDestroy(snapshot);
    else this.finalizeShot(snapshot);

    return {
      accepted: true,
      matchedTargetId: snapshot.id,
      resetInput: true,
      correctDelta,
      incorrectDelta,
    };
  }

  /** Called by GameScene when the projectile reaches its target. */
  private finalizeShot(target: TargetData): void {
    if (this.status !== "playing" || this.destroyed || !this.pendingShots.has(target.id)) return;
    this.pendingShots.delete(target.id);

    const destroyed =
      this.targetManager?.remove(target.id) ?? this.removeLocalTarget(target.id) ?? { ...target, destroying: false };
    const breakdown = this.scoring.scoreTarget(
      destroyed.kind,
      graphemeLength(destroyed.text),
      this.stats.combo,
    );
    const combo = this.stats.combo + 1;

    this.stats = {
      ...this.stats,
      score: this.stats.score + breakdown.total,
      combo,
      maxCombo: Math.max(this.stats.maxCombo, combo),
      targetsCompleted: this.stats.targetsCompleted + 1,
    };
    this.destroyedThisLevel += 1;
    this.refreshDerivedStats();
    this.emitStats();
    this.emitTargets();
    this.config.callbacks.onTargetDestroyed({ ...destroyed, destroying: false });

    if (this.destroyedThisLevel >= this.levelConfig.quota) this.completeLevel();
  }

  private freezeLocalTarget(id: string): boolean {
    const index = this.targets.findIndex((target) => target.id === id);
    if (index < 0) return false;
    this.targets[index] = { ...this.targets[index], destroying: true };
    return true;
  }

  updateSettings(settings: GameSettings): void {
    this.settings = { ...settings };
    this.scene?.setAnimationsEnabled(settings.animationsEnabled);
  }

  getStats(): GameStats {
    return { ...this.stats };
  }

  getTargets(): TargetData[] {
    return this.targets.map((target) => ({ ...target }));
  }

  getStatus(): GameStatus {
    return this.status;
  }

  /** Called by GameScene once per rendered frame. */
  private tick(deltaMs: number): void {
    if (this.status !== "playing" || this.destroyed) return;

    this.targetManager?.update(deltaMs);

    const now = Date.now();
    if (now - this.lastStatsEmitAt >= STATS_EMIT_INTERVAL_MS) {
      this.refreshDerivedStats();
      this.emitStats();
      this.lastStatsEmitAt = now;
    }
  }

  private ensureTargetManager(): void {
    if (this.targetManager || !this.targetManagerFactory) return;

    this.targetManager = new this.targetManagerFactory({
      mode: this.config.mode,
      language: this.config.language,
      level: this.levelConfig,
      bounds: this.getBounds(),
      onLifeLoss: (target) => this.handleLifeLoss(target),
      onTargetsChange: (targets) => this.acceptTargets(targets),
      getSpawnBudget: () => this.getSpawnBudget(),
    });
  }

  private resetSession(): void {
    this.stats = { ...INITIAL_STATS };
    this.targets = [];
    this.pendingShots.clear();
    this.destroyedThisLevel = 0;
    this.levelCompletePending = false;
    this.lastTypedGraphemes = [];
    this.elapsedBeforePause = 0;
    this.startedAt = null;
    this.levelConfig = getLevelConfig(this.config.mode, 1);

    this.targetManager?.reset();
    this.targetManager?.setLevel(this.levelConfig);
    this.scene?.clearTargets(true);
  }

  private handleLifeLoss(target: TargetData): void {
    if (this.status !== "playing") return;
    if (this.pendingShots.has(target.id)) return;

    this.targets = this.targets.filter((item) => item.id !== target.id);
    const lives = Math.max(0, this.stats.lives - 1);
    this.stats = { ...this.stats, lives, combo: 0 };
    this.lastTypedGraphemes = [];

    this.scene?.playLifeLost();
    this.config.callbacks.onLifeLost(lives);
    this.config.callbacks.onInputReset();
    this.refreshDerivedStats();
    this.emitStats();
    this.emitTargets();

    if (lives === 0) this.gameOver(false);
  }

  private completeLevel(): void {
    if (this.status !== "playing") return;
    this.levelCompletePending = true;
    this.freezeClock();
    this.refreshDerivedStats();

    this.stats = {
      ...this.stats,
      score: this.stats.score + this.scoring.levelCompletionBonus(),
      combo: 0,
    };

    this.pendingShots.clear();
    this.targetManager?.clear();
    this.targets = [];
    this.scene?.clearTargets(true);
    this.scene?.playLevelComplete();

    this.emitStats();
    this.emitTargets();
    this.config.callbacks.onLevelComplete(this.stats.level);
    this.setStatus("level-complete");
  }

  private gameOver(completed: boolean): void {
    if (this.status === "game-over") return;

    this.freezeClock();
    this.refreshDerivedStats();
    this.pendingShots.clear();
    this.targetManager?.clear();
    this.targets = [];
    this.scene?.clearTargets(true);

    const result: GameResult = {
      mode: this.config.mode,
      language: this.config.language,
      score: this.stats.score,
      highestLevel: this.stats.level,
      targetsCompleted: this.stats.targetsCompleted,
      correctChars: this.stats.correctChars,
      incorrectChars: this.stats.incorrectChars,
      accuracy: this.stats.accuracy,
      averageWpm: calculateWpm(this.stats.correctChars, this.stats.elapsedMs),
      bestWpm: this.stats.bestWpm,
      durationMs: this.stats.elapsedMs,
      completed,
      finishedAt: new Date().toISOString(),
    };

    this.emitTargets();
    this.config.callbacks.onGameOver(result);
    this.setStatus("game-over");
  }

  private getSpawnBudget(): number {
    if (this.status !== "playing" || this.levelCompletePending) return 0;
    return Math.max(0, this.levelConfig.quota - this.destroyedThisLevel - this.targets.length);
  }

  private getBounds(): EngineBounds {
    const container = this.config.container;
    const width = Math.max(MIN_CANVAS_WIDTH, container?.clientWidth || 960);
    const height = Math.max(MIN_CANVAS_HEIGHT, container?.clientHeight || 600);
    return {
      width,
      height,
      topY: SPAWN_TOP_Y,
      dangerY: Math.max(SPAWN_TOP_Y + 48, height - DANGER_INSET),
    };
  }

  private applyMatched(targetId: string, matched: number): void {
    const manager = this.targetManager;
    if (manager) {
      manager.setMatched(targetId, matched);
      return;
    }
    this.targets = this.targets.map((target) => ({
      ...target,
      matchedGraphemes: target.id === targetId ? matched : 0,
    }));
    this.emitTargets();
  }

  private removeLocalTarget(id: string): TargetData | null {
    const index = this.targets.findIndex((target) => target.id === id);
    if (index < 0) return null;
    const [removed] = this.targets.splice(index, 1);
    this.targets = [...this.targets];
    return removed;
  }

  private acceptTargets(targets: readonly TargetData[]): void {
    this.targets = targets.map((target) => ({ ...target }));
    this.emitTargets();
  }

  private setStatus(status: GameStatus): void {
    this.status = status;
    this.config.callbacks.onStatusChange(status);
  }

  private emitStats(): void {
    this.config.callbacks.onStatsChange({ ...this.stats });
  }

  private emitTargets(): void {
    this.config.callbacks.onTargetsChange(this.getTargets());
  }

  private refreshDerivedStats(): void {
    const elapsedMs = this.getElapsedMs();
    const wpm = calculateWpm(this.stats.correctChars, elapsedMs);
    this.stats = {
      ...this.stats,
      elapsedMs,
      wpm,
      bestWpm: Math.max(this.stats.bestWpm, wpm),
      accuracy: calculateAccuracy(this.stats.correctChars, this.stats.incorrectChars),
    };
  }

  private startClock(): void {
    this.startedAt = Date.now();
    this.lastStatsEmitAt = this.startedAt;
  }

  private freezeClock(): void {
    if (this.startedAt !== null) {
      this.elapsedBeforePause += Date.now() - this.startedAt;
      this.startedAt = null;
    }
  }

  private getElapsedMs(): number {
    return this.elapsedBeforePause + (this.startedAt === null ? 0 : Date.now() - this.startedAt);
  }
}

/**
 * Creates the same kind of color framebuffer Phaser uses internally. This
 * catches `Incomplete Attachment` before Phaser boots and lets the engine pick
 * the Canvas renderer on constrained GPUs, zero-sized parents or high DPRs.
 */
function canCreateWebGLFramebuffer(width: number, height: number): boolean {
  if (typeof document === "undefined") return false;

  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  let texture: WebGLTexture | null = null;
  let framebuffer: WebGLFramebuffer | null = null;

  try {
    const canvas = document.createElement("canvas");
    const attributes: WebGLContextAttributes = {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    };
    gl =
      (canvas.getContext("webgl2", attributes) as WebGL2RenderingContext | null) ??
      (canvas.getContext("webgl", attributes) as WebGLRenderingContext | null);
    if (!gl || gl.isContextLost()) return false;

    const maxTextureSize = Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) || 0;
    if (maxTextureSize > 0 && (width > maxTextureSize || height > maxTextureSize)) return false;

    texture = gl.createTexture();
    framebuffer = gl.createFramebuffer();
    if (!texture || !framebuffer) return false;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    return gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  } catch {
    return false;
  } finally {
    // Always release the probe context; otherwise repeated page loads exhaust
    // the browser's WebGL context limit and later games fail to boot.
    if (gl) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      if (framebuffer) gl.deleteFramebuffer(framebuffer);
      if (texture) gl.deleteTexture(texture);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  }
}

/** True when `prefix` equals the first `prefix.length` graphemes of `full`. */
function isGraphemePrefix(prefix: readonly string[], full: readonly string[]): boolean {
  if (prefix.length > full.length) return false;
  return prefix.every((grapheme, index) => grapheme === full[index]);
}
