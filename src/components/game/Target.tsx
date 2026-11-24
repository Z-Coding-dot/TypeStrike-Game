"use client";

import { Crosshair } from "lucide-react";
import { directionForLanguage } from "@/types/language";
import type { TargetData } from "@/types/game";

interface TargetProps {
  target: TargetData;
  /** Marks the first alphabetical/unique match as the suggested input. */
  active?: boolean;
}

/**
 * Accessible DOM mirror of a Phaser target. The engine draws the moving sprite;
 * this chip keeps the exact target text readable by assistive technology and
 * browser automation without ever reversing the string for RTL languages.
 */
export function Target({ target, active = false }: TargetProps) {
  const direction = directionForLanguage(target.language);

  return (
    <li
      data-testid="target-item"
      data-target-id={target.id}
      data-x={target.x.toFixed(1)}
      data-y={target.y.toFixed(1)}
      dir={direction}
      lang={target.language}
      className={`flex max-w-full items-center gap-2 rounded-md border px-2.5 py-1 text-sm ${
        active
          ? "border-primary/60 bg-primary/10 text-fg shadow-[0_0_16px_rgba(34,211,238,0.16)]"
          : "border-line bg-bg-surface/70 text-fg-secondary"
      }`}
    >
      <Crosshair className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
      <span className="truncate">{target.text}</span>
    </li>
  );
}
