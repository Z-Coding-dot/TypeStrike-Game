"use client";

import { Rocket } from "lucide-react";

/** Decorative DOM representation of the player ship at the danger boundary. */
export function Spaceship({ firing = false }: { firing?: boolean }) {
  return (
    <div
      className="pointer-events-none absolute bottom-2 start-1/2 z-10 flex -translate-x-1/2 flex-col items-center"
      aria-hidden="true"
      data-testid="spaceship"
    >
      <div className={`relative ${firing ? "drop-shadow-[0_0_18px_rgba(34,211,238,0.85)]" : "drop-shadow-[0_0_12px_rgba(34,211,238,0.45)]"}`}>
        <Rocket className="size-9 rotate-180 text-primary sm:size-11" strokeWidth={1.6} />
        <span className="absolute -bottom-1 start-1/2 h-1.5 w-6 -translate-x-1/2 rounded-full bg-secondary/70 blur-[3px]" />
      </div>
      <span className="h-1.5 w-20 rounded-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    </div>
  );
}
