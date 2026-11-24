"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { AdSlot } from "@/components/layout/AdSlot";
import { trackEvent } from "@/lib/analytics";
import { consumeGameAutostart } from "@/lib/clientSession";
import { useLanguage } from "@/hooks/useLanguage";
import { useSound } from "@/hooks/useSound";
import { useSpeech } from "@/hooks/useSpeech";
import { GameEngine } from "@/game/engine/GameEngine";
import { useGameStore } from "@/stores/gameStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useStatsStore } from "@/stores/statsStore";
import type {
  GameEngineCallbacks,
  GameRenderer,
  GameSettings,
  GameStatus,
  TypingAttemptResult,
} from "@/types/game";
import { GameCanvas } from "./GameCanvas";
import { GameHUD } from "./GameHUD";
import { GameMenu } from "./GameMenu";
import { GameOver } from "./GameResults";
import { LevelComplete } from "./LevelComplete";
import { PauseOverlay } from "./PauseOverlay";
import { focusTypingInput, TypingInput } from "./TypingInput";

const ACTIVE_STATUSES: GameStatus[] = ["playing", "paused", "level-complete"];

export function GameBoard() {
  const router = useRouter();
  const { direction, language: documentLanguage } = useLanguage();
  const playSound = useSound();
  const speech = useSpeech();

  const mode = useSettingsStore((state) => state.mode);
  const language = useSettingsStore((state) => state.language);
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const speechEnabled = useSettingsStore((state) => state.speechEnabled);
  const speechRate = useSettingsStore((state) => state.speechRate);
  const speechVolume = useSettingsStore((state) => state.speechVolume);
  const animationsEnabled = useSettingsStore((state) => state.animationsEnabled);

  const status = useGameStore((state) => state.status);
  const stats = useGameStore((state) => state.stats);
  const targets = useGameStore((state) => state.targets);
  const feedback = useGameStore((state) => state.feedback);
  const speechNotice = useGameStore((state) => state.speechNotice);
  const result = useGameStore((state) => state.result);
  const levelCompleted = useGameStore((state) => state.levelCompleted);

  const setSpeechNotice = useGameStore((state) => state.setSpeechNotice);

  const [ready, setReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [renderer, setRenderer] = useState<GameRenderer>("pending");
  const [firing, setFiring] = useState(false);
  const [shotCount, setShotCount] = useState(0);
  const [impactCount, setImpactCount] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const initRef = useRef<Promise<void> | null>(null);
  const sessionKeyRef = useRef<string | null>(null);
  const statusRef = useRef<GameStatus>(status);
  const feedbackTimerRef = useRef<number | null>(null);
  const firingTimerRef = useRef<number | null>(null);
  const callbacksRef = useRef<GameEngineCallbacks | null>(null);
  const restartHandlerRef = useRef<(() => void) | null>(null);

  const settings = useMemo<GameSettings>(
    () => ({ soundEnabled, speechEnabled, speechRate, speechVolume, animationsEnabled }),
    [soundEnabled, speechEnabled, speechRate, speechVolume, animationsEnabled],
  );

  const settingsRef = useRef(settings);
  const speechRef = useRef(speech);
  const soundRef = useRef(playSound);

  const markFeedback = useCallback((next: "idle" | "success" | "error") => {
    useGameStore.getState().setFeedback(next);
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = window.setTimeout(() => {
      useGameStore.getState().setFeedback("idle");
      feedbackTimerRef.current = null;
    }, 260);
  }, []);

  const flashFiring = useCallback(() => {
    setFiring(true);
    if (firingTimerRef.current !== null) window.clearTimeout(firingTimerRef.current);
    firingTimerRef.current = window.setTimeout(() => {
      setFiring(false);
      firingTimerRef.current = null;
    }, 180);
  }, []);

  // Built once; fresh settings/speech/sound values are read through refs.
  const createCallbacks = useCallback((): GameEngineCallbacks => {
    return {
      onStatsChange: (nextStats) => useGameStore.getState().setStats(nextStats),
      onTargetsChange: (nextTargets) => useGameStore.getState().setTargets(nextTargets),
      onStatusChange: (nextStatus) => {
        statusRef.current = nextStatus;
        useGameStore.getState().setStatus(nextStatus);
        if (nextStatus === "playing") focusTypingInput();
      },
      onInputReset: () => useGameStore.getState().setInputValue(""),
      onShotFired: () => {
        soundRef.current("shoot");
        setShotCount((count) => count + 1);
        flashFiring();
        markFeedback("success");
      },
      onShotImpact: () => {
        soundRef.current("impact");
        setImpactCount((count) => count + 1);
      },
      onTargetDestroyed: (target) => {
        if (settingsRef.current.speechEnabled) {
          void speechRef.current.speak(target.text, target.language);
        }
      },
      onLevelComplete: (level) => {
        const store = useGameStore.getState();
        store.setLevelCompleted(level);
        store.setStatus("level-complete");
        statusRef.current = "level-complete";
        soundRef.current("level-complete");
        trackEvent("level_reached", {
          level,
          mode: store.mode,
          language: store.language,
          score: store.stats.score,
        });
      },
      onGameOver: (finalResult) => {
        const store = useGameStore.getState();
        useStatsStore.getState().recordResult(finalResult);
        store.setResult(finalResult);
        store.setStatus("game-over");
        statusRef.current = "game-over";
        speechRef.current.cancel();
        soundRef.current("game-over");
        // No typed text or keystroke data is ever included in analytics.
        trackEvent("game_complete", {
          mode: finalResult.mode,
          language: finalResult.language,
          score: finalResult.score,
          level: finalResult.highestLevel,
          durationMs: finalResult.durationMs,
          completed: finalResult.completed,
        });
      },
      onLifeLost: () => {
        soundRef.current("life-lost");
        markFeedback("error");
      },
      onError: (message) => {
        setErrorMessage(message);
        markFeedback("error");
      },
      onSceneReady: () => setReady(true),
      onRendererChange: (nextRenderer) => setRenderer(nextRenderer),
    };
  }, [flashFiring, markFeedback]);

  const restartGame = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    void (initRef.current ?? Promise.resolve()).then(() => {
      speechRef.current.cancel();
      const store = useGameStore.getState();
      store.reset();
      store.setSession(mode, language);
      setErrorMessage(null);
      setShotCount(0);
      setImpactCount(0);
      engine.restart();
      trackEvent("game_start", { mode, language, reason: "restart" });
      focusTypingInput();
    });
  }, [mode, language]);

  // Sync mutable values into refs after render, never during render.
  useEffect(() => {
    settingsRef.current = settings;
    speechRef.current = speech;
    soundRef.current = playSound;
    statusRef.current = status;
    restartHandlerRef.current = restartGame;
    if (!callbacksRef.current) callbacksRef.current = createCallbacks();
  }, [settings, speech, playSound, status, restartGame, createCallbacks]);

  const sessionKey = `${mode}|${language}`;

  // Create the Phaser engine once per mode/language session and initialise it.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    const engine = new GameEngine({
      container,
      mode,
      language,
      settings: settingsRef.current,
      callbacks: callbacksRef.current!,
    });
    engineRef.current = engine;
    setReady(false);
    setRenderer("pending");

    const initPromise = engine
      .init()
      .then(() => {
        if (cancelled) return;
        setReady(true);
        if (!consumeGameAutostart()) return;
        const store = useGameStore.getState();
        store.reset();
        store.setSession(mode, language);
        setErrorMessage(null);
        engine.start();
        trackEvent("game_start", { mode, language, reason: "settings_restart" });
        focusTypingInput();
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setReady(false);
        setErrorMessage(error instanceof Error ? error.message : String(error));
        useGameStore.getState().setFeedback("error");
      });
    initRef.current = initPromise;

    const previousKey = sessionKeyRef.current;
    sessionKeyRef.current = sessionKey;
    const sessionChangedWhileActive =
      previousKey !== null && previousKey !== sessionKey && ACTIVE_STATUSES.includes(statusRef.current);

    if (sessionChangedWhileActive) {
      // The engine cannot swap language/mode at runtime: start a fresh session.
      void initPromise.then(() => {
        if (cancelled) return;
        const store = useGameStore.getState();
        store.reset();
        store.setSession(mode, language);
        setErrorMessage(null);
        engine.start();
        trackEvent("game_start", { mode, language, reason: "session_settings_changed" });
      });
    }

    return () => {
      cancelled = true;
      if (initRef.current === initPromise) initRef.current = null;
      if (engineRef.current === engine) engineRef.current = null;
      try {
        engine.destroy();
      } catch {
        // A destroy during a pending init is safe to ignore.
      }
    };
  }, [mode, language, sessionKey]);

  // Navigating away (for example to /settings) must not leave a stale active
  // session behind; the autostart flag restarts deliberately when requested.
  useEffect(() => {
    return () => {
      const store = useGameStore.getState();
      if (store.status !== "menu") store.reset();
    };
  }, []);

  // Keep engine settings in sync with the settings panel.
  useEffect(() => {
    engineRef.current?.updateSettings(settings);
    if (!speechEnabled) speechRef.current.cancel();
  }, [settings, speechEnabled]);

  // Surface speech availability problems through the game store notice area.
  useEffect(() => {
    setSpeechNotice(speech.notice);
  }, [speech.notice, setSpeechNotice]);

  useEffect(() => {
    trackEvent("mode_select", { mode });
  }, [mode]);

  useEffect(() => {
    const listener = () => restartHandlerRef.current?.();
    window.addEventListener("typestrike:restart", listener);
    return () => window.removeEventListener("typestrike:restart", listener);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
      if (firingTimerRef.current !== null) window.clearTimeout(firingTimerRef.current);
      speechRef.current.cancel();
    };
  }, []);

  const startGame = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine || !initRef.current) return;
    try {
      await initRef.current;
      speechRef.current.cancel();
      const store = useGameStore.getState();
      store.reset();
      store.setSession(mode, language);
      setErrorMessage(null);
      setShotCount(0);
      setImpactCount(0);
      engine.start();
      trackEvent("game_start", { mode, language });
      focusTypingInput();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
      markFeedback("error");
    }
  }, [mode, language, markFeedback]);

  const handleTyping = useCallback((value: string): TypingAttemptResult | void => {
    const engine = engineRef.current;
    const store = useGameStore.getState();
    if (!engine || store.status !== "playing") return;
    const attempt = engine.handleTyping(value);
    if (attempt.resetInput) store.setInputValue("");
    return attempt;
  }, []);

  const togglePause = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const current = statusRef.current;
    if (current === "playing") {
      engine.pause();
      statusRef.current = "paused";
    } else if (current === "paused") {
      engine.resume();
      statusRef.current = "playing";
      focusTypingInput();
    }
  }, []);

  const nextLevel = useCallback(() => {
    const store = useGameStore.getState();
    store.setLevelCompleted(null);
    store.setFeedback("idle");
    engineRef.current?.advanceLevel();
    statusRef.current = "playing";
    focusTypingInput();
  }, []);

  const quitToHome = useCallback(() => {
    speechRef.current.cancel();
    useGameStore.getState().reset();
    router.push("/");
  }, [router]);

  return (
    <div className="flex min-h-dvh flex-col" dir={direction} lang={documentLanguage} data-testid="game-page">
      <Header />
      <main className="mx-auto w-full max-w-[var(--max-content-width)] flex-1 px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,200px)_minmax(0,1fr)_minmax(0,200px)] xl:grid-cols-[minmax(0,230px)_minmax(0,1fr)_minmax(0,230px)]">
          <div className="hidden lg:block">
            <AdSlot placement="sidebar-left" />
          </div>

          <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
            <GameHUD
              status={status}
              speechNotice={speechNotice}
              errorMessage={errorMessage}
              onPauseToggle={togglePause}
            />

            <div className="relative min-w-0">
              <GameCanvas
                containerRef={containerRef}
                targets={targets}
                status={status}
                feedback={feedback}
                firing={firing}
                shotCount={shotCount}
                impactCount={impactCount}
                renderer={renderer}
                score={stats.score}
                level={stats.level}
                lives={stats.lives}
              />
            </div>

            {/* Real input, visually hidden: keeps IMEs, screen readers and mobile keyboards working. */}
            <TypingInput onTyping={handleTyping} onEscape={togglePause} />

            <div className="w-full lg:hidden">
              <AdSlot placement="bottom" />
            </div>
          </div>

          <div className="hidden lg:block">
            <AdSlot placement="sidebar-right" />
          </div>
        </div>
      </main>
      <Footer />

      <AnimatePresence>
        {status === "menu" ? (
          <div key="menu" className="fixed inset-0 z-20 overflow-y-auto bg-bg-base/95 p-3 backdrop-blur-sm sm:p-6">
            <GameMenu onStart={() => void startGame()} ready={ready} />
          </div>
        ) : null}
        {status === "paused" ? (
          <PauseOverlay key="pause" onResume={togglePause} onRestart={restartGame} onQuit={quitToHome} />
        ) : null}
        {status === "level-complete" && levelCompleted !== null ? (
          <LevelComplete key="level-complete" level={levelCompleted} onNext={nextLevel} />
        ) : null}
        {status === "game-over" && result ? (
          <GameOver key="game-over" result={result} onRestart={restartGame} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
