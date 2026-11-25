"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Home, Play, RotateCcw } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

interface PauseOverlayProps {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

export function PauseOverlay({ onResume, onRestart, onQuit }: PauseOverlayProps) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="ts-overlay fixed inset-0 z-30 flex items-center justify-center overflow-y-auto p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
      data-testid="pause-overlay"
    >
      <div className="ts-overlay-card my-auto w-full max-w-sm p-6 text-center">
        <span className="ts-eyebrow-chip mx-auto" aria-hidden="true">
          {t("brandTagline")}
        </span>
        <h2 id="pause-title" className="mt-4 text-xl font-bold text-[var(--text-strong)]">
          {t("pause")}
        </h2>
        <div className="mt-5 flex flex-col gap-2">
          <button type="button" data-testid="resume-game" onClick={onResume} className="ts-btn ts-btn-primary w-full">
            <Play className="size-4" aria-hidden="true" />
            {t("resume")}
          </button>
          <button type="button" data-testid="restart-game" onClick={onRestart} className="ts-btn ts-btn-secondary w-full">
            <RotateCcw className="size-4" aria-hidden="true" />
            {t("restart")}
          </button>
          <button type="button" data-testid="quit-game" onClick={onQuit} className="ts-btn ts-btn-danger w-full">
            <Home className="size-4" aria-hidden="true" />
            {t("quit")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
