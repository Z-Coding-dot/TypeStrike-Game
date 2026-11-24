import { describe, expect, it, vi } from "vitest";
import { GameEngine } from "@/game/engine/GameEngine";
import { getLevelConfig } from "@/game/systems/LevelSystem";
import type { GameEngineCallbacks, GameStatus, TargetData } from "@/types/game";
import type { LanguageCode } from "@/types/language";

interface InternalEngine {
  targets: TargetData[];
  destroyedThisLevel: number;
  handleLifeLoss: (target: TargetData) => void;
}

function asInternal(engine: GameEngine): InternalEngine {
  return engine as unknown as InternalEngine;
}

function makeTarget(text: string, y = 100): TargetData {
  return {
    id: `target-${text}`,
    text,
    kind: "word",
    language: "en",
    x: 200,
    y,
    speed: 10,
    matchedGraphemes: 0,
  };
}

function createEngine(language: LanguageCode = "en") {
  const callbacks: GameEngineCallbacks = {
    onStatsChange: vi.fn(),
    onTargetsChange: vi.fn(),
    onStatusChange: vi.fn(),
    onInputReset: vi.fn(),
    onTargetDestroyed: vi.fn(),
    onLevelComplete: vi.fn(),
    onGameOver: vi.fn(),
    onLifeLost: vi.fn(),
    onError: vi.fn(),
  };
  const container = { clientWidth: 960, clientHeight: 600 } as HTMLElement;
  const engine = new GameEngine({
    container,
    mode: "words",
    language,
    settings: {
      soundEnabled: false,
      speechEnabled: false,
      speechRate: 1,
      speechVolume: 0.5,
      animationsEnabled: false,
    },
    callbacks,
  });
  return { engine, callbacks };
}

function statuses(callbacks: GameEngineCallbacks): GameStatus[] {
  const mock = callbacks.onStatusChange as ReturnType<typeof vi.fn>;
  return mock.mock.calls.map(([status]) => status as GameStatus);
}

describe("GameEngine (headless rules)", () => {
  it("transitions through start, pause, resume, and restart", () => {
    const { engine, callbacks } = createEngine();
    expect(engine.getStatus()).toBe("menu");

    engine.start();
    expect(engine.getStatus()).toBe("playing");
    expect(statuses(callbacks)).toEqual(["playing"]);

    engine.pause();
    expect(engine.getStatus()).toBe("paused");
    expect(engine.handleTyping("orbit").accepted).toBe(false);

    engine.resume();
    expect(engine.getStatus()).toBe("playing");
    expect(statuses(callbacks)).toEqual(["playing", "paused", "playing"]);

    engine.restart();
    expect(engine.getStats()).toMatchObject({
      score: 0,
      lives: 3,
      level: 1,
      combo: 0,
      targetsCompleted: 0,
    });
  });

  it("highlights a prefix and awards score only for an exact match", () => {
    const { engine, callbacks } = createEngine();
    engine.start();
    asInternal(engine).targets = [makeTarget("orbit")];

    const partial = engine.handleTyping("orb");
    expect(partial).toMatchObject({ accepted: true, correctDelta: 3, incorrectDelta: 0 });
    expect(engine.getTargets()[0].matchedGraphemes).toBe(3);
    expect(callbacks.onTargetDestroyed).not.toHaveBeenCalled();

    const exact = engine.handleTyping("orbit");
    expect(exact).toMatchObject({ accepted: true, matchedTargetId: "target-orbit", resetInput: true });
    expect(callbacks.onTargetDestroyed).toHaveBeenCalledTimes(1);
    expect(callbacks.onInputReset).toHaveBeenCalledTimes(1);
    expect(engine.getStats()).toMatchObject({
      score: 130,
      combo: 1,
      targetsCompleted: 1,
      accuracy: 100,
    });
    expect(engine.getTargets()).toHaveLength(0);

    const scoreBefore = engine.getStats().score;
    const wrong = engine.handleTyping("xyz");
    expect(wrong).toMatchObject({ accepted: false, correctDelta: 0, incorrectDelta: 3 });
    expect(engine.getStats().score).toBe(scoreBefore);
    expect(engine.getStats().accuracy).toBeLessThan(100);
  });

  it("clears the level with a bonus and advances to the next level", () => {
    const { engine, callbacks } = createEngine();
    engine.start();
    asInternal(engine).targets = [makeTarget("orbit")];
    asInternal(engine).destroyedThisLevel = getLevelConfig("words", 1).quota - 1;

    engine.handleTyping("orbit");

    expect(callbacks.onLevelComplete).toHaveBeenCalledWith(1);
    expect(engine.getStatus()).toBe("level-complete");
    expect(engine.getStats().score).toBe(130 + 300);
    expect(engine.getTargets()).toHaveLength(0);

    engine.advanceLevel();
    expect(engine.getStatus()).toBe("playing");
    expect(engine.getStats().level).toBe(2);
  });

  it("ends the game after three life losses", () => {
    const { engine, callbacks } = createEngine();
    engine.start();
    const target = makeTarget("orbit");

    asInternal(engine).handleLifeLoss(target);
    asInternal(engine).handleLifeLoss(target);
    expect(engine.getStatus()).toBe("playing");
    expect(callbacks.onLifeLost).toHaveBeenCalledTimes(2);

    asInternal(engine).handleLifeLoss(target);
    expect(engine.getStatus()).toBe("game-over");
    expect(callbacks.onLifeLost).toHaveBeenNthCalledWith(3, 0);
    expect(callbacks.onGameOver).toHaveBeenCalledTimes(1);
    expect(callbacks.onGameOver).toHaveBeenCalledWith(
      expect.objectContaining({ completed: false, highestLevel: 1, score: 0 }),
    );
    expect(statuses(callbacks)).toEqual(["playing", "game-over"]);
  });

  it("matches Persian targets typed with alternate Arabic letters", () => {
    const { engine, callbacks } = createEngine("fa-AF");
    engine.start();
    const target = { ...makeTarget("کتاب"), language: "fa-AF" as const, kind: "word" as const };
    asInternal(engine).targets = [target];

    expect(engine.handleTyping("كتاب")).toMatchObject({
      accepted: true,
      matchedTargetId: target.id,
      correctDelta: 4,
      incorrectDelta: 0,
    });
    expect(engine.getStats().correctChars).toBe(4);
    expect(callbacks.onTargetDestroyed).toHaveBeenCalledWith(expect.objectContaining({ text: "کتاب" }));
  });
});
