"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Home, RotateCcw, Trophy } from "lucide-react";
import Link from "next/link";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useI18n } from "@/hooks/useI18n";
import { MODE_LABELS } from "@/lib/constants";
import { LANGUAGE_DEFINITIONS } from "@/types/language";
import type { GameResult } from "@/types/game";

interface GameResultsProps {
  result: GameResult;
  onRestart: () => void;
  heading?: "results" | "gameOver";
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function GameResults({ result, onRestart, heading = "results" }: GameResultsProps) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  const fields: Array<{ key: string; label: string; value: string; testId: string }> = [
    { key: "score", label: t("finalScore"), value: result.score.toLocaleString(result.language === "fa-AF" ? "fa-AF" : "en-US"), testId: "result-score" },
    { key: "level", label: t("highestLevel"), value: String(result.highestLevel), testId: "result-level" },
    { key: "targets", label: t("targets"), value: String(result.targetsCompleted), testId: "result-targets" },
    { key: "correct", label: t("correctChars"), value: String(result.correctChars), testId: "result-correct" },
    { key: "incorrect", label: t("incorrectChars"), value: String(result.incorrectChars), testId: "result-incorrect" },
    { key: "accuracy", label: t("accuracy"), value: `${Math.round(result.accuracy)}%`, testId: "result-accuracy" },
    { key: "averageWpm", label: t("averageWpm"), value: String(Math.round(result.averageWpm)), testId: "result-average-wpm" },
    { key: "bestWpm", label: t("bestWpm"), value: String(Math.round(result.bestWpm)), testId: "result-best-wpm" },
    { key: "duration", label: t("gameDuration"), value: formatDuration(result.durationMs), testId: "result-duration" },
  ];

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24 }}
      className="ts-overlay fixed inset-0 z-40 flex items-center justify-center overflow-y-auto p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="results-title"
      data-testid="results-overlay"
    >
      <div className="ts-overlay-card my-auto w-full max-w-xl p-5 sm:p-7">
        <header className="flex flex-col items-center gap-2 text-center">
          <Trophy className="size-8 text-[var(--color-warning)]" aria-hidden="true" />
          <h2 id="results-title" className="text-xl font-bold text-[var(--text-strong)] sm:text-2xl">
            {t(heading)}
          </h2>
          <p className="max-w-full break-words text-xs text-[var(--text-subtle)]">
            {result.completed ? t("levelComplete") : t("gameOver")} ·{" "}
            {MODE_LABELS[result.language][result.mode]} · {LANGUAGE_DEFINITIONS[result.language].nativeLabel}
          </p>
        </header>

        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3" data-testid="results-grid">
          {fields.map((field) => (
            <div key={field.key} className="ts-result-tile" data-testid={field.testId}>
              <dt className="ts-overline">{field.label}</dt>
              <dd className="mt-0.5 text-base font-semibold text-[var(--text-strong)] ts-numeric" dir="ltr" lang={result.language}>
                {field.value}
              </dd>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs text-[var(--text-default)]">
            <span>{t("accuracy")}</span>
            <span className="ts-numeric">{Math.round(result.accuracy)}%</span>
          </div>
          <ProgressBar value={Math.max(0, Math.min(100, result.accuracy))} aria-label={t("accuracy")} />
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button type="button" className="ts-btn ts-btn-primary flex-1" data-testid="restart-from-results" onClick={onRestart}>
            <RotateCcw className="size-4" aria-hidden="true" />
            {t("restart")}
          </button>
          <Link href="/" className="ts-btn ts-btn-secondary flex-1" data-testid="back-home">
            <Home className="size-4" aria-hidden="true" />
            {t("backHome")}
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/** Thin wrapper used for the game-over state. */
export function GameOver({ result, onRestart }: { result: GameResult; onRestart: () => void }) {
  return <GameResults result={result} onRestart={onRestart} heading="gameOver" />;
}
