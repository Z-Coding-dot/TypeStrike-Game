"use client";

import Link from "next/link";
import { Keyboard, Pause, Play, Settings2 } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { useI18n } from "@/hooks/useI18n";
import type { GameStatus } from "@/types/game";
import { TYPING_INPUT_ID } from "./TypingInput";

interface GameHUDProps {
  status: GameStatus;
  speechNotice: string | null;
  errorMessage: string | null;
  onPauseToggle: () => void;
}

/**
 * Active-play controls only. Scores, lives, WPM, accuracy, time, mode and
 * language are intentionally not shown while playing: the result screen keeps
 * the full report and the navbar owns language selection.
 */
export function GameHUD({ status, speechNotice, errorMessage, onPauseToggle }: GameHUDProps) {
  const { t } = useI18n();
  const isPaused = status === "paused";

  return (
    <section
      aria-label={t("gameControls")}
      className="ts-panel w-full p-2 sm:p-2.5"
      data-testid="game-hud"
    >
      <div className="flex min-h-11 items-center justify-end gap-2">
        <IconButton
          type="button"
          aria-label={t("openKeyboard")}
          title={t("openKeyboard")}
          data-testid="focus-keyboard"
          className="sm:hidden"
          onClick={() => {
            if (typeof document !== "undefined") document.getElementById(TYPING_INPUT_ID)?.focus();
          }}
        >
          <Keyboard className="size-4" aria-hidden="true" />
        </IconButton>
        <Link
          href="/settings"
          aria-label={t("settings")}
          title={t("settings")}
          data-testid="open-settings"
          className="ts-icon-btn focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Settings2 className="size-4" aria-hidden="true" />
        </Link>
        <IconButton
          type="button"
          aria-label={isPaused ? t("resume") : t("pause")}
          title={isPaused ? t("resume") : t("pause")}
          data-testid="pause-toggle"
          onClick={onPauseToggle}
          disabled={status === "menu" || status === "game-over"}
        >
          {isPaused ? <Play className="size-4" aria-hidden="true" /> : <Pause className="size-4" aria-hidden="true" />}
        </IconButton>
      </div>

      {speechNotice ? (
        <p role="status" className="mt-2 rounded-md border border-secondary/30 bg-secondary/10 px-3 py-2 text-xs text-fg-secondary" data-testid="speech-notice">
          {speechNotice}
        </p>
      ) : null}
      {errorMessage ? (
        <p role="alert" className="mt-2 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger" data-testid="game-error">
          {t("errorsTitle")}: {errorMessage}
        </p>
      ) : null}
    </section>
  );
}
