import * as Phaser from "phaser";
import type { LanguageCode } from "@/types/language";
import type { TargetData } from "@/types/game";
import { clamp } from "@/lib/constants";
import { getGameArenaGeometry, SHIP_SCALE } from "@/game/systems/GameGeometry";

const COLORS = {
  background: 0x050b14,
  surface: 0x0a1423,
  primary: 0x22d3ee,
  secondary: 0x3b82f6,
  accent: 0x8b5cf6,
  text: "#F1F5F9",
} as const;

const STAR_COUNT = 64;
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
  label: Phaser.GameObjects.Text;
  text: string;
  language: LanguageCode;
}

interface ActiveProjectile {
  target: TargetData;
  final: boolean;
}

/**
 * Phaser rendering layer only. Rules live in GameEngine/TargetManager; this
 * scene draws the arena, the ship and one visible projectile per settled shot.
 */
export class GameScene extends Phaser.Scene {
  private readonly callbacks: GameSceneCallbacks;

  private language: LanguageCode = "en";
  private animationsEnabled = true;
  private paused = false;
  /**
   * Phaser injects `add`, `tweens`, `scale`, etc. during boot. Settings can be
   * applied before that happens, so every system-touching method must wait.
   */
  private systemsReady = false;
  private width = 960;
  private height = 600;

  private background!: Phaser.GameObjects.Rectangle;
  private ship!: Phaser.GameObjects.Container;
  private shipGlow!: Phaser.GameObjects.Arc;
  private stars: Phaser.GameObjects.Arc[] = [];
  private idleTween: Phaser.Tweens.Tween | null = null;

  private readonly visuals = new Map<string, TargetVisual>();
  private readonly dyingTargets = new Set<string>();
  private readonly projectiles = new Set<Phaser.GameObjects.Graphics>();
  private readonly projectileTargets = new Map<Phaser.GameObjects.Graphics, ActiveProjectile>();

  constructor(callbacks: GameSceneCallbacks) {
    super({ key: "TypeStrikeGame" });
    this.callbacks = callbacks;
  }

  create(): void {
    const geometry = getGameArenaGeometry(this.scale.gameSize.width, this.scale.gameSize.height);
    this.width = geometry.width;
    this.height = geometry.height;
    this.systemsReady = true;

    this.background = this.add.rectangle(0, 0, this.width, this.height, COLORS.background);
    this.background.setOrigin(0);

    this.drawStarfield();
    this.drawShip();

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once("shutdown", this.cleanup, this);

    this.applyPauseState();
    this.callbacks.onResize(this.width, this.height);
    this.callbacks.onReady();
  }

  update(_time: number, delta: number): void {
    if (!this.paused) this.callbacks.onFrame(delta);
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
    if (!this.systemsReady) return;
    this.applyAnimationsSetting();
  }

  private applyAnimationsSetting(): void {
    if (!this.animationsEnabled) {
      // Kill tweens only after their projectiles have reported impact; the
      // tween completion is the sole impact signal for a shot in flight.
      this.finishProjectiles();
      this.idleTween?.stop();
      this.idleTween = null;
      this.shipGlow?.setAlpha(0.2);
      this.tweens.killAll();
    } else {
      this.startIdleTween();
    }
  }

  setPaused(paused: boolean): void {
    if (this.paused === paused) return;
    this.paused = paused;
    if (!this.systemsReady) return;
    this.applyPauseState();
  }

  private applyPauseState(): void {
    if (!this.systemsReady) return;
    if (this.paused) this.tweens.pauseAll();
    else this.tweens.resumeAll();
  }

  /**
   * Visual firing sequence for exactly one settled shot. `final` is false for
   * an intermediate letter shot: its target survives and loses one grapheme.
   */
  playDestroy(target: TargetData, final = true): void {
    this.callbacks.onShotFired?.(target);

    // Settings or a renderer swap can settle a shot before the scene exists.
    if (!this.systemsReady) {
      this.callbacks.onShotImpact?.(target);
      return;
    }

    if (!this.animationsEnabled) {
      if (final) this.destroyVisual(target.id);
      this.callbacks.onShotImpact?.(target);
      return;
    }

    this.dyingTargets.add(target.id);
    const geometry = getGameArenaGeometry(this.width, this.height);
    const originX = this.ship?.x ?? this.width / 2;
    const originY = (this.ship?.y ?? geometry.shipY) - 18 * SHIP_SCALE;
    const destination = { x: target.x, y: target.y };

    const projectile = this.add.graphics();
    this.projectiles.add(projectile);
    this.projectileTargets.set(projectile, { target, final });
    projectile.fillStyle(COLORS.primary, 1);
    projectile.fillCircle(0, 0, 3.5);
    projectile.fillStyle(COLORS.secondary, 0.32);
    projectile.fillCircle(0, 0, 8);
    projectile.setPosition(originX, originY);

    if (this.ship) {
      const recoil = 3 * SHIP_SCALE;
      this.ship.y += recoil;
      this.tweens.add({
        targets: this.ship,
        y: geometry.shipY,
        duration: 150,
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
        this.removeProjectile(projectile);
        this.spawnExplosion(destination.x, destination.y);
        if (final) this.destroyVisual(target.id);
        this.dyingTargets.delete(target.id);
        this.callbacks.onShotImpact?.(target);
      },
    });
  }

  /** Reports and removes every projectile still travelling. */
  private finishProjectiles(): void {
    for (const projectile of Array.from(this.projectiles)) {
      const shot = this.projectileTargets.get(projectile);
      this.removeProjectile(projectile);
      this.dyingTargets.delete(shot?.target.id ?? "");
      if (shot) this.callbacks.onShotImpact?.(shot.target);
    }
  }

  private removeProjectile(projectile: Phaser.GameObjects.Graphics): void {
    this.projectiles.delete(projectile);
    this.projectileTargets.delete(projectile);
    projectile.destroy();
  }

  playLifeLost(): void {
    if (!this.animationsEnabled || !this.shipGlow) return;
    this.tweens.add({
      targets: this.shipGlow,
      alpha: 0.7,
      duration: 120,
      yoyo: true,
      ease: "Sine.easeInOut",
      onComplete: () => {
        if (!this.shipGlow) return;
        this.shipGlow.setAlpha(0.2);
      },
    });
  }

  playLevelComplete(): void {
    if (!this.systemsReady || !this.animationsEnabled) return;
    const sweep = this.add.rectangle(this.width / 2, this.height / 2, this.width, this.height, COLORS.primary, 0.08);
    this.tweens.add({
      targets: sweep,
      alpha: 0,
      duration: 360,
      ease: "Quad.easeOut",
      onComplete: () => sweep.destroy(),
    });
  }

  /** Removes visuals immediately (restart/level clear). */
  clearTargets(force = false): void {
    for (const id of Array.from(this.visuals.keys())) {
      if (force || !this.dyingTargets.has(id)) this.destroyVisual(id);
    }
    if (force) {
      for (const projectile of Array.from(this.projectiles)) this.removeProjectile(projectile);
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
      const displayText = target.displayText ?? target.text;
      if (visual.text !== displayText || visual.language !== this.language) {
        visual.text = displayText;
        visual.language = this.language;
        this.styleLabel(visual, target);
      }
    }

    for (const [id] of this.visuals) {
      if (!activeIds.has(id) && !this.dyingTargets.has(id)) this.destroyVisual(id);
    }
  }

  private createTargetVisual(target: TargetData): TargetVisual {
    const label = this.add.text(0, 0, target.displayText ?? target.text, {
      fontFamily: '"Inter", system-ui, sans-serif',
      fontSize: "20px",
      color: COLORS.text,
      align: "center",
    });
    label.setOrigin(0.5);

    const container = this.add.container(target.x, target.y, [label]);
    const visual: TargetVisual = {
      container,
      label,
      text: target.displayText ?? target.text,
      language: this.language,
    };
    this.styleLabel(visual, target);
    return visual;
  }

  private styleLabel(visual: TargetVisual, target: TargetData): void {
    const isPersian = visual.language === "fa-AF";
    const isLongSentence = target.kind === "sentence" && visual.text.length > 44;
    const fontSize = target.kind === "letter" ? 28 : target.kind === "word" ? 20 : isLongSentence ? 13 : 16;
    const scaledSize = Math.max(11, Math.round(fontSize * clamp(this.width / 900, 0.72, 1.1)));

    visual.label.setText(visual.text);
    visual.label.setFontFamily(
      isPersian ? '"Vazirmatn", "Inter", sans-serif' : '"Inter", system-ui, sans-serif',
    );
    visual.label.setFontSize(scaledSize);
    // Targets are deliberately uniform: no preselected or partially typed text.
    visual.label.setColor(COLORS.text);
    // RTL is a rendering property only: never reverse the string or graphemes.
    visual.label.setRTL(isPersian);
    visual.label.setWordWrapWidth(Math.max(140, this.width * (isLongSentence ? 0.62 : 0.5)), true);
    visual.label.setOrigin(0.5);
  }

  private spawnExplosion(x: number, y: number): void {
    if (!this.animationsEnabled) return;

    const colorChoices = [COLORS.primary, COLORS.secondary, COLORS.accent];
    for (let index = 0; index < MAX_EXPLOSION_PARTICLES; index += 1) {
      const particle = this.add.circle(x, y, 2 + (index % 3), colorChoices[index % colorChoices.length], 0.9);
      const angle = (Math.PI * 2 * index) / MAX_EXPLOSION_PARTICLES;
      const distance = 18 + (index % 4) * 7;
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.4,
        duration: 320,
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
      const radius = index % 11 === 0 ? 1.4 : 1;
      const star = this.add.circle(x, y, radius, index % 9 === 0 ? COLORS.accent : COLORS.primary, 0.1 + Math.random() * 0.14);
      this.stars.push(star);

      if (this.animationsEnabled && index % 5 === 0) {
        this.tweens.add({
          targets: star,
          alpha: 0.06,
          duration: 1200 + Math.random() * 1600,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      }
    }
  }

  private drawShip(): void {
    const geometry = getGameArenaGeometry(this.width, this.height);

    this.shipGlow = this.add.circle(0, 14, 16, COLORS.primary, 0.2);

    const hull = this.add.graphics();
    hull.fillStyle(COLORS.surface, 1);
    hull.lineStyle(2, COLORS.primary, 0.9);
    hull.beginPath();
    hull.moveTo(0, -26);
    hull.lineTo(20, 16);
    hull.lineTo(0, 7);
    hull.lineTo(-20, 16);
    hull.closePath();
    hull.fillPath();
    hull.strokePath();

    hull.fillStyle(COLORS.secondary, 0.9);
    hull.fillRect(-3.5, -7, 7, 20);
    hull.fillStyle(COLORS.accent, 0.75);
    hull.fillCircle(0, -12, 3.5);

    this.ship = this.add.container(geometry.width / 2, geometry.shipY, [this.shipGlow, hull]);
    this.ship.setScale(SHIP_SCALE);
    this.startIdleTween();
  }

  private startIdleTween(): void {
    if (!this.animationsEnabled || !this.shipGlow || this.idleTween) return;
    this.idleTween = this.tweens.add({
      targets: this.shipGlow,
      alpha: 0.34,
      scale: 1.14,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const geometry = getGameArenaGeometry(gameSize.width, gameSize.height);
    this.width = geometry.width;
    this.height = geometry.height;

    this.background?.setDisplaySize(this.width, this.height);
    if (this.ship) this.ship.setPosition(this.width / 2, geometry.shipY);

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
    for (const projectile of Array.from(this.projectiles)) this.removeProjectile(projectile);
    this.stars = [];
  }
}
