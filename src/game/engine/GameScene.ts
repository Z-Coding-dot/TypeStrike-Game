import * as Phaser from "phaser";
import type { LanguageCode } from "@/types/language";
import type { TargetData } from "@/types/game";
import { clamp } from "@/lib/constants";

const COLORS = {
  background: 0x050b14,
  surface: 0x0a1423,
  primary: 0x22d3ee,
  secondary: 0x3b82f6,
  accent: 0x8b5cf6,
  danger: 0xf87171,
  text: "#F1F5F9",
} as const;

const STAR_COUNT = 70;
const MAX_EXPLOSION_PARTICLES = 10;

export interface GameSceneCallbacks {
  /** Called once per Phaser frame; the engine advances target simulation here. */
  onFrame: (deltaMs: number) => void;
  /** Current targets read directly from the engine, without React re-renders. */
  getTargets: () => TargetData[];
  /** Confirms the scene finished booting and its rAF loop is active. */
  onReady: () => void;
  /** Keeps the rules layer in sync with the rendered canvas size. */
  onResize: (width: number, height: number) => void;
  onShotFired?: (target: TargetData) => void;
  onShotImpact?: (target: TargetData) => void;
}

interface TargetVisual {
  container: Phaser.GameObjects.Container;
  frame: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  progress: Phaser.GameObjects.Graphics;
  text: string;
  matched: number;
  language: LanguageCode;
}

/**
 * Phaser rendering layer only. Game rules live in GameEngine/TargetManager;
 * this scene draws the neon arcade presentation and forwards frame deltas.
 */
export class GameScene extends Phaser.Scene {
  private readonly callbacks: GameSceneCallbacks;

  private language: LanguageCode = "en";
  private animationsEnabled = true;
  private paused = false;
  private width = 960;
  private height = 600;

  private background!: Phaser.GameObjects.Rectangle;
  private dangerLine!: Phaser.GameObjects.Graphics;
  private ship!: Phaser.GameObjects.Container;
  private shipGlow!: Phaser.GameObjects.Arc;
  private stars: Phaser.GameObjects.Arc[] = [];
  private idleTween: Phaser.Tweens.Tween | null = null;

  private readonly visuals = new Map<string, TargetVisual>();
  private readonly dyingTargets = new Set<string>();
  private readonly projectiles = new Set<Phaser.GameObjects.Graphics>();

  constructor(callbacks: GameSceneCallbacks) {
    super({ key: "TypeStrikeGame" });
    this.callbacks = callbacks;
  }

  create(): void {
    const { width, height } = this.scale.gameSize;
    this.width = Math.max(280, width);
    this.height = Math.max(240, height);

    this.background = this.add.rectangle(0, 0, this.width, this.height, COLORS.background);
    this.background.setOrigin(0);

    this.drawStarfield();
    this.dangerLine = this.add.graphics();
    this.drawDangerLine(COLORS.primary, 0.28);
    this.drawShip();

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once("shutdown", this.cleanup, this);
    this.callbacks.onResize(this.width, this.height);
    this.callbacks.onReady();
  }

  update(_time: number, delta: number): void {
    if (!this.paused) {
      this.callbacks.onFrame(delta);
    }
    this.syncTargets(this.callbacks.getTargets());
  }

  setLanguage(language: LanguageCode): void {
    if (this.language === language) return;
    this.language = language;
    for (const visual of this.visuals.values()) visual.language = language;
  }

  setAnimationsEnabled(enabled: boolean): void {
    if (this.animationsEnabled === enabled) return;
    this.animationsEnabled = enabled;

    if (!enabled) {
      this.idleTween?.stop();
      this.idleTween = null;
      this.shipGlow?.setAlpha(0.2);
      this.tweens.killAll();
    } else if (this.ship) {
      this.startIdleTween();
    }
  }

  setPaused(paused: boolean): void {
    if (this.paused === paused) return;
    this.paused = paused;
    if (paused) this.tweens.pauseAll();
    else this.tweens.resumeAll();
  }

  /** Visual firing sequence. Rules and stats are already settled by the engine. */
  playDestroy(target: TargetData): void {
    const visual = this.visuals.get(target.id);
    const destination = { x: target.x, y: target.y };

    this.callbacks.onShotFired?.(target);

    if (!this.animationsEnabled) {
      if (visual) this.destroyVisual(target.id);
      this.callbacks.onShotImpact?.(target);
      return;
    }

    this.dyingTargets.add(target.id);
    const originX = this.ship?.x ?? this.width / 2;
    const originY = (this.ship?.y ?? this.height - 56) - 18;

    const projectile = this.add.graphics();
    this.projectiles.add(projectile);
    projectile.fillStyle(COLORS.primary, 1);
    projectile.fillCircle(0, 0, 4);
    projectile.fillStyle(COLORS.secondary, 0.35);
    projectile.fillCircle(0, 0, 9);
    projectile.setPosition(originX, originY);

    if (this.ship) {
      this.ship.y += 4;
      this.tweens.add({
        targets: this.ship,
        y: this.height - 56,
        duration: 180,
        ease: "Quad.easeOut",
      });
    }

    this.tweens.add({
      targets: projectile,
      x: destination.x,
      y: destination.y,
      duration: 230,
      ease: "Quad.easeIn",
      onComplete: () => {
        this.projectiles.delete(projectile);
        projectile.destroy();
        this.spawnExplosion(destination.x, destination.y);
        this.destroyVisual(target.id);
        this.dyingTargets.delete(target.id);
        this.callbacks.onShotImpact?.(target);
      },
    });
  }

  playLifeLost(): void {
    if (!this.animationsEnabled || !this.dangerLine) return;
    this.drawDangerLine(COLORS.danger, 0.85);
    this.tweens.add({
      targets: this.shipGlow,
      alpha: 0.7,
      duration: 120,
      yoyo: true,
      ease: "Sine.easeInOut",
      onComplete: () => {
        if (!this.shipGlow) return;
        this.shipGlow.setAlpha(0.2);
        this.drawDangerLine(COLORS.primary, 0.28);
      },
    });
  }

  playLevelComplete(): void {
    if (!this.animationsEnabled) return;
    const sweep = this.add.rectangle(this.width / 2, this.height / 2, this.width, this.height, COLORS.primary, 0.1);
    this.tweens.add({
      targets: sweep,
      alpha: 0,
      duration: 420,
      ease: "Quad.easeOut",
      onComplete: () => sweep.destroy(),
    });
  }

  /**
   * Removes visuals immediately (restart/level clear). During normal play an
   * in-flight projectile is left alone so the final shot is never cut short.
   */
  clearTargets(force = false): void {
    for (const id of Array.from(this.visuals.keys())) {
      if (force || !this.dyingTargets.has(id)) this.destroyVisual(id);
    }
    if (force) {
      for (const projectile of this.projectiles) projectile.destroy();
      this.projectiles.clear();
      this.dyingTargets.clear();
    }
  }

  private syncTargets(targets: readonly TargetData[]): void {
    const activeIds = new Set(targets.map((target) => target.id));

    for (const target of targets) {
      let visual = this.visuals.get(target.id);
      if (!visual) {
        visual = this.createTargetVisual(target);
        this.visuals.set(target.id, visual);
      }

      visual.container.setPosition(target.x, target.y);
      if (visual.text !== target.text || visual.language !== this.language) {
        visual.text = target.text;
        visual.language = this.language;
        this.styleLabel(visual, target);
      }
      if (visual.matched !== target.matchedGraphemes) {
        visual.matched = target.matchedGraphemes;
        this.drawTargetFrame(visual);
      }
    }

    for (const [id, visual] of this.visuals) {
      if (!activeIds.has(id) && !this.dyingTargets.has(id)) {
        visual.container.destroy();
        this.visuals.delete(id);
      }
    }
  }

  private createTargetVisual(target: TargetData): TargetVisual {
    const frame = this.add.graphics();
    const progress = this.add.graphics();
    const label = this.add.text(0, 0, target.text, {
      fontFamily: '"Inter", system-ui, sans-serif',
      fontSize: "20px",
      color: COLORS.text,
      align: "center",
    });
    label.setOrigin(0.5);

    const container = this.add.container(target.x, target.y, [frame, progress, label]);
    const visual: TargetVisual = {
      container,
      frame,
      label,
      progress,
      text: target.text,
      matched: target.matchedGraphemes,
      language: this.language,
    };
    this.styleLabel(visual, target);
    this.drawTargetFrame(visual);
    return visual;
  }

  private styleLabel(visual: TargetVisual, target: TargetData): void {
    const isPersian = visual.language === "fa-AF";
    const fontSize =
      target.kind === "letter" ? 28 : target.kind === "word" ? 20 : 16;
    const scaledSize = Math.max(12, Math.round(fontSize * clamp(this.width / 900, 0.72, 1.1)));

    visual.label.setText(target.text);
    visual.label.setFontFamily(
      isPersian ? '"Vazirmatn", "Inter", sans-serif' : '"Inter", system-ui, sans-serif',
    );
    visual.label.setFontSize(scaledSize);
    // RTL is a rendering property only: never reverse the string or graphemes.
    visual.label.setRTL(isPersian);
    visual.label.setWordWrapWidth(Math.max(120, this.width * 0.48), true);
    visual.label.setOrigin(0.5);
    this.drawTargetFrame(visual);
  }

  private drawTargetFrame(visual: TargetVisual): void {
    const labelWidth = visual.label.width || 40;
    const labelHeight = visual.label.height || 24;
    const boxWidth = Math.min(this.width - 28, labelWidth + 26);
    const boxHeight = labelHeight + 16;
    const matchedRatio = visual.text
      ? clamp(visual.matched / Math.max(1, this.displayedGraphemeCount(visual.text)), 0, 1)
      : 0;

    visual.frame.clear();
    visual.frame.fillStyle(COLORS.surface, 0.86);
    visual.frame.lineStyle(matchedRatio > 0 ? 2 : 1, matchedRatio > 0 ? COLORS.primary : COLORS.secondary, 0.82);
    visual.frame.fillRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 8);
    visual.frame.strokeRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 8);

    visual.progress.clear();
    if (matchedRatio > 0) {
      visual.progress.fillStyle(COLORS.primary, 0.95);
      visual.progress.fillRoundedRect(-boxWidth / 2 + 6, boxHeight / 2 - 5, (boxWidth - 12) * matchedRatio, 3, 2);
    }
  }

  private displayedGraphemeCount(text: string): number {
    return Array.from(text).length;
  }

  private spawnExplosion(x: number, y: number): void {
    if (!this.animationsEnabled) return;

    const colorChoices = [COLORS.primary, COLORS.secondary, COLORS.accent];
    for (let index = 0; index < MAX_EXPLOSION_PARTICLES; index += 1) {
      const particle = this.add.circle(x, y, 2 + (index % 3), colorChoices[index % colorChoices.length], 0.95);
      const angle = (Math.PI * 2 * index) / MAX_EXPLOSION_PARTICLES;
      const distance = 22 + (index % 4) * 8;
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.4,
        duration: 360,
        ease: "Quad.easeOut",
        onComplete: () => particle.destroy(),
      });
    }
  }

  private destroyVisual(id: string): void {
    const visual = this.visuals.get(id);
    if (!visual) return;
    visual.container.destroy();
    this.visuals.delete(id);
  }

  private drawStarfield(): void {
    for (const star of this.stars) star.destroy();
    this.stars = [];

    for (let index = 0; index < STAR_COUNT; index += 1) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const radius = index % 9 === 0 ? 1.6 : 1;
      const star = this.add.circle(x, y, radius, index % 7 === 0 ? COLORS.accent : COLORS.primary, 0.12 + Math.random() * 0.22);
      this.stars.push(star);

      if (this.animationsEnabled && index % 5 === 0) {
        this.tweens.add({
          targets: star,
          alpha: 0.08,
          duration: 1200 + Math.random() * 1600,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      }
    }
  }

  private drawShip(): void {
    const x = this.width / 2;
    const y = this.height - 56;

    this.shipGlow = this.add.circle(0, 16, 20, COLORS.primary, 0.2);

    const hull = this.add.graphics();
    hull.fillStyle(COLORS.surface, 1);
    hull.lineStyle(2, COLORS.primary, 0.95);
    hull.beginPath();
    hull.moveTo(0, -28);
    hull.lineTo(22, 18);
    hull.lineTo(0, 8);
    hull.lineTo(-22, 18);
    hull.closePath();
    hull.fillPath();
    hull.strokePath();

    hull.fillStyle(COLORS.secondary, 0.95);
    hull.fillRect(-4, -8, 8, 24);
    hull.fillStyle(COLORS.accent, 0.8);
    hull.fillCircle(0, -14, 4);

    this.ship = this.add.container(x, y, [this.shipGlow, hull]);
    this.startIdleTween();
  }

  private startIdleTween(): void {
    if (!this.animationsEnabled || !this.shipGlow || this.idleTween) return;
    this.idleTween = this.tweens.add({
      targets: this.shipGlow,
      alpha: 0.38,
      scale: 1.18,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private drawDangerLine(color: number, alpha: number): void {
    if (!this.dangerLine) return;
    const y = this.height - 110;
    this.dangerLine.clear();
    this.dangerLine.lineStyle(1, color, alpha);
    this.dangerLine.beginPath();
    this.dangerLine.moveTo(24, y);
    this.dangerLine.lineTo(this.width - 24, y);
    this.dangerLine.strokePath();
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.width = Math.max(280, gameSize.width);
    this.height = Math.max(240, gameSize.height);

    this.background?.setDisplaySize(this.width, this.height);
    this.drawDangerLine(COLORS.primary, 0.28);
    if (this.ship) this.ship.setPosition(this.width / 2, this.height - 56);

    for (const star of this.stars) {
      if (star.x > this.width) star.x = Math.random() * this.width;
      if (star.y > this.height) star.y = Math.random() * this.height;
    }

    this.callbacks.onResize(this.width, this.height);

    for (const target of this.callbacks.getTargets()) {
      const visual = this.visuals.get(target.id);
      if (visual) {
        visual.container.setPosition(target.x, target.y);
        this.styleLabel(visual, target);
      }
    }
  }

  private cleanup(): void {
    this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.idleTween?.stop();
    this.idleTween = null;
    this.visuals.clear();
    this.dyingTargets.clear();
    for (const projectile of this.projectiles) projectile.destroy();
    this.projectiles.clear();
    this.stars = [];
  }
}
