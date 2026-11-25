import type { HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds a hover treatment for cards that behave like selectable surfaces. */
  interactive?: boolean;
  padded?: boolean;
  tone?: "default" | "panel" | "accent";
}

export function Card({
  children,
  className = "",
  interactive = false,
  padded = true,
  tone = "default",
  ...props
}: CardProps) {
  const surface = tone === "panel" ? "ts-panel" : "ts-card";
  const classes = [
    surface,
    "min-w-0 max-w-full text-start",
    padded ? "p-4 sm:p-5" : "",
    tone === "accent" ? "border-[var(--border-accent)]" : "",
    interactive
      ? "cursor-pointer transition-colors duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
      : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
