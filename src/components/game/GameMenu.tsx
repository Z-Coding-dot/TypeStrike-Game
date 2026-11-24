"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Keyboard, Play, Sparkles } from "lucide-react";
import { ModeSelector } from "@/components/settings/ModeSelector";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
      className="mx-auto my-auto w-full max-w-2xl"
      data-testid="game-menu"
    >
      <Card className="p-4 sm:p-7">
        <div className="flex flex-col gap-5 sm:gap-6">
          <header className="text-center">
            <span className="ts-chip mx-auto mb-4 w-fit max-w-full" data-testid="brand-tagline">
              <Sparkles className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 break-words">{t("brandTagline")}</span>
            </span>
            <h1 className="text-balance break-words text-[clamp(1.5rem,5vw,2.25rem)] font-bold leading-[1.15] tracking-tight text-fg">
              {t("heroTitle")}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-pretty text-sm leading-relaxed text-fg-secondary sm:text-base">
              {t("heroDescription")}
            </p>
          </header>

          <div className="min-w-0 rounded-lg border border-line bg-bg-base/40 p-3 sm:p-4">
            <ModeSelector variant="compact" />
          </div>

          <div className="rounded-lg border border-line bg-bg-base/40 p-3 sm:p-4">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-fg">
              <Keyboard className="size-4 shrink-0 text-primary" aria-hidden="true" />
              {t("howToPlay")}
            </h2>
            <ol className="list-inside list-decimal space-y-1 text-xs leading-relaxed text-fg-secondary sm:text-sm">
              <li>{t("howStep1")}</li>
              <li>{t("howStep2")}</li>
              <li>{t("howStep3")}</li>
            </ol>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button type="button" size="lg" onClick={onStart} disabled={!ready} data-testid="start-game" className="w-full sm:w-auto">
              <Play className="size-4" aria-hidden="true" />
              {ready ? t("startGame") : t("loading")}
            </Button>
            <p className="w-full text-center text-xs text-fg-muted sm:w-auto">
              {t("highScore")}: <span className="font-semibold text-fg tabular-nums">{highScore}</span>
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
