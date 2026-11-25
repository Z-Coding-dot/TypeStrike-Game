import { describe, expect, it, vi } from "vitest";
import { GameEngine } from "@/game/engine/GameEngine";
import type { GameEngineCallbacks, GameMode, TargetData } from "@/types/game";

interface ShotRecord {
  target: TargetData;
  final: boolean;
}

interface InternalEngine {
  targets: TargetData[];
  finalizeShot: (target: TargetData) => void;
  resolvePendingShots: () => void;
  scene: unknown;
}

function asInternal(engine: GameEngine): InternalEngine {
  return engine as unknown as InternalEngine;
}

function makeTarget(text: string, kind: TargetData["kind"], id: string): TargetData {
  return {
    id,
    text,
    displayText: text,
    baseText: text,
    kind,
    language: "en",
    x: 200,
    y: 100,
    speed: 0,
    matchedGraphemes: 0,
    ...(kind === "letter" ? { remainingGraphemes: Array.from(text).length } : {}),
  };
}

function createEngine(mode: GameMode, autoImpact = true) {
  const callbacks: GameEngineCallbacks = {
    onStatsChange: vi.fn(),
    onTargetsChange: vi.fn(),
    onStatusChange: vi.fn(),
    onInputReset: vi.fn(),
    onTargetDestroyed: vi.fn(),
    onShotFired: vi.fn(),
    onShotImpact: vi.fn(),
    onLevelComplete: vi.fn(),
    onGameOver: vi.fn(),
    onLifeLost: vi.fn(),
    onError: vi.fn(),
  };
  const container = { clientWidth: 960, clientHeight: 600 } as HTMLElement;
  const engine = new GameEngine({
    container,
    mode,
    language: "en",
    settings: {
      soundEnabled: false,
      speechEnabled: false,
      speechRate: 1,
      speechVolume: 0.5,
      animationsEnabled: true,
    },
    callbacks,
  });
  const shots: ShotRecord[] = [];

  const scene = {
    playDestroy: (target: TargetData, final: boolean) => {
      shots.push({ target: { ...target }, final });
      callbacks.onShotFired?.(target);
      if (autoImpact) {
        asInternal(engine).finalizeShot(target);
        callbacks.onShotImpact?.(target);
      }
    },
    playLifeLost: () => undefined,
    playLevelComplete: () => undefined,
    clearTargets: () => undefined,
    setPaused: () => undefined,
    setLanguage: () => undefined,
    setAnimationsEnabled: () => undefined,
  };
  asInternal(engine).scene = scene;

  return { engine, callbacks, shots };
}

function impact(engine: GameEngine, target: TargetData): void {
  asInternal(engine).finalizeShot(target);
}

function mockOf(callback: unknown) {
  return callback as ReturnType<typeof vi.fn>;
}

describe("mode-specific shooting", () => {
  it("fires one bullet per correctly typed letter and removes one letter per shot", () => {
    const { engine, callbacks, shots } = createEngine("letters", false);
    engine.start();
    asInternal(engine).targets = [makeTarget("ab", "letter", "letters-1")];

    const first = engine.handleTyping("a");
    expect(first).toMatchObject({ accepted: true, resetInput: true });
    expect(shots).toHaveLength(1);
    expect(shots[0]).toMatchObject({ final: false });
    expect(callbacks.onTargetDestroyed).not.toHaveBeenCalled();
    expect(engine.getStats().score).toBe(0);

    impact(engine, shots[0].target);
    expect(engine.getTargets()).toMatchObject([
      { id: "letters-1", text: "b", displayText: "b", remainingGraphemes: 1, destroying: false },
    ]);

    engine.handleTyping("b");
    expect(shots).toHaveLength(2);
    expect(shots[1]).toMatchObject({ final: true });
    impact(engine, shots[1].target);

    expect(mockOf(callbacks.onTargetDestroyed)).toHaveBeenCalledTimes(1);
    expect(mockOf(callbacks.onTargetDestroyed)).toHaveBeenCalledWith(
      expect.objectContaining({ text: "ab", baseText: "ab" }),
    );
    expect(engine.getStats()).toMatchObject({ score: 15, targetsCompleted: 1 });
    expect(engine.getTargets()).toHaveLength(0);
  });

  it("does not fire a second bullet while a target's shot is still in flight", () => {
    const { engine, callbacks, shots } = createEngine("letters", false);
    engine.start();
    asInternal(engine).targets = [makeTarget("a", "letter", "letters-1")];

    expect(engine.handleTyping("a")).toMatchObject({ accepted: true, resetInput: true });
    const duplicate = engine.handleTyping("a");

    expect(shots).toHaveLength(1);
    // Rejected input is released so the player can immediately try another target.
    expect(duplicate).toMatchObject({ accepted: false, resetInput: true });
    expect(mockOf(callbacks.onInputReset)).toHaveBeenCalledTimes(2);
    expect(engine.getTargets()[0].destroying).toBe(true);
  });

  it("fires one projectile for a complete word only, once", () => {
    const { engine, callbacks, shots } = createEngine("words");
    engine.start();
    asInternal(engine).targets = [makeTarget("orbit", "word", "words-1")];

    const partial = engine.handleTyping("orb");
    expect(partial).toMatchObject({ accepted: true, resetInput: false });
    expect(shots).toHaveLength(0);

    engine.handleTyping("orbit");
    expect(shots).toHaveLength(1);
    expect(shots[0].final).toBe(true);
    expect(mockOf(callbacks.onTargetDestroyed)).toHaveBeenCalledTimes(1);
    expect(engine.getStats()).toMatchObject({ score: 130, targetsCompleted: 1 });

    impact(engine, shots[0].target);
    expect(mockOf(callbacks.onTargetDestroyed)).toHaveBeenCalledTimes(1);
    expect(engine.getStats().score).toBe(130);
  });

  it("settles a shot frozen by a pause without awarding it twice", () => {
    const { engine, callbacks, shots } = createEngine("words", false);
    engine.start();
    asInternal(engine).targets = [makeTarget("orbit", "word", "words-1")];

    engine.handleTyping("orbit");
    expect(shots).toHaveLength(1);
    expect(callbacks.onTargetDestroyed).not.toHaveBeenCalled();

    engine.pause();
    asInternal(engine).resolvePendingShots();
    expect(mockOf(callbacks.onTargetDestroyed)).toHaveBeenCalledTimes(1);
    expect(engine.getStats().score).toBe(130);
    expect(engine.getTargets()).toHaveLength(0);
    expect(engine.getStatus()).toBe("paused");

    asInternal(engine).resolvePendingShots();
    expect(mockOf(callbacks.onTargetDestroyed)).toHaveBeenCalledTimes(1);
    expect(engine.getStats().score).toBe(130);
  });

  it("fires one projectile for a complete sentence only", () => {
    const { engine, callbacks, shots } = createEngine("sentences");
    engine.start();
    const sentence = "The signal is clear.";
    asInternal(engine).targets = [makeTarget(sentence, "sentence", "sentences-1")];

    engine.handleTyping("The signal");
    expect(shots).toHaveLength(0);
    expect(callbacks.onTargetDestroyed).not.toHaveBeenCalled();

    engine.handleTyping(sentence);
    expect(shots).toHaveLength(1);
    expect(shots[0].final).toBe(true);
    expect(mockOf(callbacks.onShotFired)).toHaveBeenCalledTimes(1);
    expect(mockOf(callbacks.onTargetDestroyed)).toHaveBeenCalledTimes(1);
    expect(engine.getStats().targetsCompleted).toBe(1);
    expect(engine.getTargets()).toHaveLength(0);
  });
});
