"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "start" | "end";
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "ts-btn-primary",
  secondary: "ts-btn-secondary",
  danger: "ts-btn-danger",
  ghost:
    "border border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[rgba(148,163,184,0.12)] hover:text-[var(--text-primary)]",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "min-h-11 px-4 text-sm",
  md: "min-h-12 px-5 text-sm",
  lg: "min-h-14 px-7 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    icon,
    iconPosition = "start",
    className = "",
    children,
    type = "button",
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;
  const classes = [
    "ts-btn cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const iconNode = icon ? (
    <span aria-hidden="true" className="inline-flex shrink-0 items-center justify-center">
      {icon}
    </span>
  ) : null;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={classes}
      {...props}
    >
      {loading ? (
        <LoaderCircle aria-hidden="true" className="size-4 shrink-0 animate-spin" />
      ) : iconPosition === "start" ? (
        iconNode
      ) : null}
      {children ? <span className="min-w-0">{children}</span> : null}
      {!loading && iconPosition === "end" ? iconNode : null}
    </button>
  );
});
