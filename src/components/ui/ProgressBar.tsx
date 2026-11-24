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
  primary: "bg-[var(--color-primary)] shadow-[0_0_12px_rgba(34,211,238,0.45)]",
  secondary: "bg-[var(--color-secondary)] shadow-[0_0_12px_rgba(59,130,246,0.4)]",
  accent: "bg-[var(--color-accent)] shadow-[0_0_12px_rgba(139,92,246,0.4)]",
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
        className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[rgba(148,163,184,0.16)]"
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
        <span dir="ltr" className="shrink-0 text-xs font-medium tabular-nums text-[var(--text-secondary)]">
          {rounded}%
        </span>
      ) : null}
    </div>
  );
}
