"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
  /** Icon-only buttons always need an explicit accessible name. */
  "aria-label": string;
  /** The icon can be provided as a prop or as the button's children. */
  icon?: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, className = "", type = "button", children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={[
        "ts-icon-btn size-11 shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <span aria-hidden="true" className="inline-flex items-center justify-center">
        {icon ?? children}
      </span>
    </button>
  );
});
