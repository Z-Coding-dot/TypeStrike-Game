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
    tone === "accent" ? "!border-[var(--border-glow)] shadow-[var(--shadow-glow)]" : "",
    interactive
      ? "cursor-pointer transition-[border-color,box-shadow,transform] duration-200 hover:!border-[var(--border-glow)] hover:shadow-[var(--shadow-glow)] hover:-translate-y-0.5"
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
