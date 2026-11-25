"use client";

import { directionForLanguage } from "@/types/language";
import type { TargetData } from "@/types/game";

interface TargetProps {
  target: TargetData;
}

/**
 * Accessible DOM mirror of a Phaser target. Every target is styled identically:
 * players choose what to type instead of following a highlighted suggestion.
 * Sentences wrap instead of being truncated so long text stays readable.
 */
export function Target({ target }: TargetProps) {
  const direction = directionForLanguage(target.language);
  const isSentence = target.kind === "sentence";

  return (
    <li
      data-testid="target-item"
      data-target-id={target.id}
      data-x={target.x.toFixed(1)}
      data-y={target.y.toFixed(1)}
      dir={direction}
      lang={target.language}
      className={`ts-target-chip max-w-full border border-[var(--border-default)] px-2.5 py-1 text-xs leading-snug text-[var(--text-strong)] ${
        isSentence ? "whitespace-normal break-words" : "truncate whitespace-nowrap"
      }`}
    >
      {target.displayText ?? target.text}
    </li>
  );
}
