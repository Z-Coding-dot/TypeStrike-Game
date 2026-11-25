"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Keyboard, Play, Sparkles } from "lucide-react";
import { ModeSelector } from "@/components/settings/ModeSelector";
import { useI18n } from "@/hooks/useI18n";
import { useStatsStore } from "@/stores/statsStore";

interface GameMenuProps {
  onStart: () => void;
  ready: boolean;
}

export function GameMenu({ onStart, ready }: GameMenuProps) {
  const { t } = useI18n();
  const highScore = useStatsStore((state) => state.highScore);
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className="mx-auto my-auto w-full max-w-3xl"
      data-testid="game-menu"
    >
      <div className="ts-menu-card">
        <div className="ts-menu-grid">
          <header className="ts-menu-hero min-w-0">
            <span className="ts-eyebrow-chip" data-testid="brand-tagline">
              <Sparkles className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 break-words">{t("brandTagline")}</span>
            </span>
            <h1 className="ts-display-title mt-4 break-words text-balance">{t("heroTitle")}</h1>
            <p className="ts-lead mt-4 text-pretty">{t("heroDescription")}</p>
            <div className="ts-proof-row mt-6">
              <span className="ts-proof-item">
                <Keyboard aria-hidden="true" size={14} />
                {t("noPreselect")}
              </span>
            </div>
          </header>

          <div className="ts-menu-controls min-w-0">
            <div className="ts-menu-panel">
              <p className="ts-overline">{t("mode")}</p>
              <div className="mt-3">
                <ModeSelector variant="compact" />
              </div>
            </div>

            <div className="ts-menu-panel">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-strong)]">
                <Keyboard className="size-4 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
                {t("howToPlay")}
              </h2>
              <ol className="ts-menu-steps">
                <li>{t("howStep1")}</li>
                <li>{t("howStep2")}</li>
                <li>{t("howStep3")}</li>
              </ol>
            </div>

            <div className="ts-menu-actions">
              <button
                type="button"
                onClick={onStart}
                disabled={!ready}
                data-testid="start-game"
                className="ts-btn ts-btn-primary min-h-12 w-full cursor-pointer px-6 focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-auto"
              >
                <Play aria-hidden="true" size={17} />
                {ready ? t("startGame") : t("loading")}
              </button>
              <p className="text-xs text-[var(--text-subtle)]">
                {t("highScore")}: <span className="ts-numeric font-semibold text-[var(--text-strong)]">{highScore}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
