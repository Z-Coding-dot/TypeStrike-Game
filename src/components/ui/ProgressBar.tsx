"use client";

import { motion, useReducedMotion } from "framer-motion";

export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  "aria-label"?: string;
  showValue?: boolean;
  tone?: "primary" | "secondary" | "accent";
  className?: string;
}

const FILL_CLASSES: Record<NonNullable<ProgressBarProps["tone"]>, string> = {
  primary: "bg-[var(--action-primary-bg)]",
  secondary: "bg-[var(--color-secondary)]",
  accent: "bg-[var(--color-accent)]",
};

export function ProgressBar({
  value,
  max = 100,
  label = "Progress",
  "aria-label": ariaLabel,
  showValue = false,
  tone = "primary",
  className = "",
}: ProgressBarProps) {
  const reduceMotion = useReducedMotion();
  const upperBound = max > 0 ? max : 1;
  const current = Math.min(upperBound, Math.max(0, value));
  const percent = upperBound > 0 ? (current / upperBound) * 100 : 0;
  const rounded = Math.round(percent);

  return (
    <div className={["flex w-full items-center gap-3", className].filter(Boolean).join(" ")}>
      <div
        role="progressbar"
        aria-label={ariaLabel ?? label}
        aria-valuemin={0}
        aria-valuemax={upperBound}
        aria-valuenow={current}
        aria-valuetext={`${rounded}%`}
        className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--surface-hover)]"
      >
        <motion.div
          className={["absolute inset-block-0 h-full rounded-full", FILL_CLASSES[tone]].join(" ")}
          style={{ insetInlineStart: 0 }}
          initial={reduceMotion ? false : { width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 22 }}
        />
      </div>
      {showValue ? (
        <span dir="ltr" className="ts-numeric shrink-0 text-xs font-medium text-[var(--text-default)]">
          {rounded}%
        </span>
      ) : null}
    </div>
  );
}
