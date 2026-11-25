"use client";

import type { RefObject } from "react";
import { Crosshair, ShieldAlert } from "lucide-react";
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
 * Owns the DOM node handed to Phaser. React renders only the accessible
 * surround; targets and the ship are drawn as plain text/shapes in the scene.
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

  const boundaryClass =
    feedback === "error"
      ? "ts-game-stage-error"
      : feedback === "success"
        ? "ts-game-stage-success"
        : "ts-game-stage-idle";

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
      className={`ts-game-stage relative h-[clamp(260px,40dvh,520px)] w-full min-w-0 cursor-text overflow-hidden rounded-[var(--radius-lg)] ${boundaryClass} sm:h-[clamp(320px,46dvh,520px)]`}
    >
      <div className="ts-game-stage-grid pointer-events-none absolute inset-0 z-0" aria-hidden="true" />

      {/* Phaser mounts its canvas into this container; React never renders into it. */}
      <div
        ref={containerRef}
        className="absolute inset-0 z-[1] min-w-[280px] min-h-[240px]"
        data-testid="phaser-container"
        aria-hidden="true"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center px-2 pt-2 sm:px-3">
        <ul
          className="ts-scrollbar-thin ts-target-list pointer-events-auto flex max-h-32 max-w-full flex-wrap items-start justify-center gap-1.5 overflow-y-auto"
          aria-label={t("targets")}
          data-testid="target-list"
        >
          {targets.length === 0 ? (
            <li className="ts-target-empty flex items-center gap-2 text-xs text-[var(--text-subtle)]" data-testid="target-list-empty">
              <ShieldAlert className="size-3.5 shrink-0" aria-hidden="true" />
              <span>{status === "menu" ? t("startGame") : t("typeHere")}</span>
            </li>
          ) : (
            targets.map((target) => <Target key={target.id} target={target} />)
          )}
        </ul>
      </div>

      <span className="ts-stage-corner ts-stage-corner-start pointer-events-none absolute z-20" aria-hidden="true">
        <Crosshair size={14} />
      </span>
      <span className="ts-stage-corner ts-stage-corner-end pointer-events-none absolute z-20" aria-hidden="true" />

      <Spaceship firing={firing} />
    </section>
  );
}
