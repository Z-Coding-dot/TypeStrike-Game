"use client";

import type { RefObject } from "react";
import { ShieldAlert } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import type { GameRenderer, GameStatus, TargetData } from "@/types/game";
import { Spaceship } from "./Spaceship";
import { Target } from "./Target";
import { focusTypingInput } from "./TypingInput";

interface GameCanvasProps {
  containerRef: RefObject<HTMLDivElement | null>;
  targets: TargetData[];
  status: GameStatus;
  feedback: "idle" | "success" | "error";
  firing: boolean;
  shotCount: number;
  impactCount: number;
  renderer: GameRenderer;
  score: number;
  level: number;
  lives: number;
}

/**
 * Owns the DOM node handed to Phaser. React only renders the accessible
 * surround: a readable list of live targets and the ship boundary indicator.
 */
export function GameCanvas({
  containerRef,
  targets,
  status,
  feedback,
  firing,
  shotCount,
  impactCount,
  renderer,
  score,
  level,
  lives,
}: GameCanvasProps) {
  const { t } = useI18n();

  return (
    <section
      aria-label={t("game")}
      data-testid="game-scene"
      data-status={status}
      data-shot-count={shotCount}
      data-impact-count={impactCount}
      data-renderer={renderer}
      data-score={score}
      data-level={level}
      data-lives={lives}
      onClick={() => {
        if (status === "playing") focusTypingInput(true);
      }}
      className={`relative h-[clamp(240px,42dvh,700px)] w-full min-w-0 cursor-text overflow-hidden rounded-xl border bg-bg-base/95 shadow-lg transition-colors duration-200 sm:h-[clamp(340px,56dvh,700px)] ${
        feedback === "error" ? "border-danger/80 shadow-[0_0_28px_rgba(248,113,113,0.18)]" : "border-primary/25"
      } ${feedback === "success" ? "border-success/60 shadow-[0_0_28px_rgba(52,211,153,0.14)]" : ""}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_10%,rgba(59,130,246,0.12),transparent_60%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-[14%] border-t border-dashed border-danger/35" aria-hidden="true" />

      {/* Phaser mounts its canvas into this container; React never renders into it. */}
      <div
        ref={containerRef}
        className="absolute inset-0 z-[1] min-w-[280px] min-h-[240px]"
        data-testid="phaser-container"
        aria-hidden="true"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center px-2 pt-2 sm:px-3">
        <ul
          className="ts-scrollbar-thin pointer-events-auto flex max-h-24 max-w-full flex-wrap items-start justify-center gap-1.5 overflow-y-auto rounded-lg bg-bg-base/55 p-1.5 backdrop-blur-[2px]"
          aria-label={t("targets")}
          data-testid="target-list"
        >
          {targets.length === 0 ? (
            <li className="flex items-center gap-2 px-2 py-1 text-xs text-fg-muted" data-testid="target-list-empty">
              <ShieldAlert className="size-3.5" aria-hidden="true" />
              <span>{status === "menu" ? t("startGame") : t("typeHere")}</span>
            </li>
          ) : (
            targets.map((target, index) => <Target key={target.id} target={target} active={index === 0} />)
          )}
        </ul>
      </div>

      <Spaceship firing={firing} />
    </section>
  );
}
