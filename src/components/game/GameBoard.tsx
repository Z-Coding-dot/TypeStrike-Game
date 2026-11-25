"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Crosshair, Radio, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { AdSlot } from "@/components/layout/AdSlot";
import { gameAudio } from "@/game/systems/AudioController";
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
import { PauseOverlay } from "./PauseOverlay";
import { focusTypingInput, TypingInput } from "./TypingInput";
import { useI18n } from "@/hooks/useI18n";

const ACTIVE_STATUSES: GameStatus[] = ["playing", "paused", "level-complete"];
const LEVEL_TRANSITION_DELAY_MS = 900;
const LEVEL_NOTICE_DURATION_MS = 2_600;

export function GameBoard() {
  const router = useRouter();
  const { direction, language: documentLanguage } = useLanguage();
  const { t } = useI18n();
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

  const [ready, setReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [renderer, setRenderer] = useState<GameRenderer>("pending");
  const [firing, setFiring] = useState(false);
  const [shotCount, setShotCount] = useState(0);
  const [impactCount, setImpactCount] = useState(0);
  const [levelNotice, setLevelNotice] = useState<number | null>(null);

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
        gameAudio.cancelSpeech();
        const store = useGameStore.getState();
        store.setLevelCompleted(level);
        store.setStatus("level-complete");
        statusRef.current = "level-complete";
        setLevelNotice(level + 1);
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
        setLevelNotice(null);
        gameAudio.cancelSpeech();
        gameAudio.stopSounds();
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
        gameAudio.cancelSpeech();
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
      gameAudio.stopAll();
      const store = useGameStore.getState();
      store.reset();
      store.setSession(mode, language);
      setErrorMessage(null);
      setLevelNotice(null);
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
    // A mode/language change builds a fresh engine; no audio may survive it.
    gameAudio.stopAll();
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
    setLevelNotice(null);

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
        setLevelNotice(null);
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
        setLevelNotice(null);
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
      } catch (error) {
        console.error("TypeStrike: game engine cleanup failed", error);
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

  // Level changes are automatic. The notice is informational only; it never
  // blocks input and never requires a button press.
  useEffect(() => {
    if (levelNotice === null) return;

    const advanceTimer = window.setTimeout(() => {
      const store = useGameStore.getState();
      if (store.status !== "level-complete") return;
      store.setLevelCompleted(null);
      store.setInputValue("");
      engineRef.current?.advanceLevel();
      statusRef.current = "playing";
      focusTypingInput();
    }, LEVEL_TRANSITION_DELAY_MS);

    const noticeTimer = window.setTimeout(() => setLevelNotice(null), LEVEL_NOTICE_DURATION_MS);

    return () => {
      window.clearTimeout(advanceTimer);
      window.clearTimeout(noticeTimer);
    };
  }, [levelNotice]);

  // Keep engine settings in sync with the settings panel.
  useEffect(() => {
    engineRef.current?.updateSettings(settings);
    if (!speechEnabled) gameAudio.cancelSpeech();
  }, [settings, speechEnabled]);

  // Surface speech availability problems through the game store notice area.
  useEffect(() => {
    useGameStore.getState().setSpeechNotice(speech.notice);
  }, [speech.notice]);

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
      gameAudio.stopAll();
    };
  }, []);

  const startGame = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine || !initRef.current) return;
    try {
      await initRef.current;
      gameAudio.stopAll();
      const store = useGameStore.getState();
      store.reset();
      store.setSession(mode, language);
      setErrorMessage(null);
      setLevelNotice(null);
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
      gameAudio.cancelSpeech();
      statusRef.current = "paused";
    } else if (current === "paused") {
      engine.resume();
      statusRef.current = "playing";
      focusTypingInput();
    }
  }, []);

  const quitToHome = useCallback(() => {
    gameAudio.stopAll();
    useGameStore.getState().reset();
    router.push("/");
  }, [router]);

  return (
    <div
      className="ts-game-page-shell flex min-h-dvh flex-col"
      dir={direction}
      lang={documentLanguage}
      data-testid="game-page"
    >
      <Header />

      <main className="ts-game-main flex-1">
        <div className="ts-page-container py-4 sm:py-6 lg:py-8">
          <div className="ts-game-heading">
            <div className="min-w-0">
              <span className="ts-eyebrow-chip">
                <Crosshair aria-hidden="true" size={13} />
                {t("brandTagline")}
              </span>
              <h1 className="ts-game-title mt-3 break-words text-balance">{t("gamePageTitle")}</h1>
              <p className="ts-lead mt-2 max-w-xl text-pretty">{t("gamePageSubtitle")}</p>
            </div>
            <span className="ts-game-live" aria-hidden="true">
              <Radio size={13} />
              {t("live")}
            </span>
          </div>

          <div className="ts-game-grid mt-5 sm:mt-6">
            <aside className="ts-game-rail hidden lg:block" aria-hidden="true">
              <div className="ts-rail-note">
                <span className="ts-feature-icon">
                  <Crosshair size={18} />
                </span>
                <p className="mt-3 text-sm font-semibold text-[var(--text-strong)]">{t("missionBrief")}</p>
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-subtle)]">{t("noPreselect")}</p>
              </div>
              <AdSlot placement="sidebar-left" />
            </aside>

            <div className="ts-play-column flex min-w-0 flex-col gap-3 sm:gap-4">
              <GameHUD
                status={status}
                speechNotice={speechNotice}
                errorMessage={errorMessage}
                onPauseToggle={togglePause}
              />

              <div className="ts-stage-wrap relative min-w-0">
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

                {levelNotice !== null ? (
                  <div
                    data-testid="level-notice"
                    role="status"
                    aria-live="polite"
                    className="ts-level-notice pointer-events-none absolute inset-x-0 top-1/2 z-30 mx-auto flex w-fit -translate-y-1/2 items-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-semibold text-[var(--text-strong)]"
                  >
                    <Sparkles aria-hidden="true" size={16} />
                    <span>{t("enteringLevel")}</span>
                    <span dir="ltr" className="ts-numeric text-[var(--color-primary)]">
                      {levelNotice}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="ts-game-guide flex flex-wrap items-center gap-x-4 gap-y-1" data-testid="game-guide">
                <span className="ts-proof-item">
                  <ShieldCheck aria-hidden="true" size={14} />
                  {t("howStep3")}
                </span>
                <span className="ts-proof-item">
                  <KeyboardHint />
                  {t("inputHint")}
                </span>
              </div>

              {/* Real input, visually hidden: keeps IMEs, screen readers and mobile keyboards working. */}
              <TypingInput onTyping={handleTyping} onEscape={togglePause} />

              <div className="w-full lg:hidden">
                <AdSlot placement="bottom" />
              </div>
            </div>

            <aside className="ts-game-rail hidden lg:block" aria-hidden="true">
              <AdSlot placement="sidebar-right" />
              <div className="ts-rail-note ts-rail-note-compact">
                <span className="ts-eyebrow-dot" />
                <p className="mt-3 text-xs leading-relaxed text-[var(--text-subtle)]">{t("typeHere")}</p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {status === "menu" ? (
          <div key="menu" className="ts-menu-backdrop fixed inset-0 z-20 overflow-y-auto p-3 backdrop-blur-sm sm:p-6">
            <GameMenu onStart={() => void startGame()} ready={ready} />
          </div>
        ) : null}
        {status === "paused" ? (
          <PauseOverlay key="pause" onResume={togglePause} onRestart={restartGame} onQuit={quitToHome} />
        ) : null}
        {status === "game-over" && result ? (
          <GameOver key="game-over" result={result} onRestart={restartGame} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** Tiny visual cue that does not duplicate the hidden keyboard control. */
function KeyboardHint() {
  return (
    <kbd
      aria-hidden="true"
      dir="ltr"
      className="ts-kbd"
    >
      ESC
    </kbd>
  );
}
