"use client";

import { Rocket } from "lucide-react";

/** Compact DOM representation of the player ship; Phaser draws the live ship. */
export function Spaceship({ firing = false }: { firing?: boolean }) {
  return (
    <div
      className="pointer-events-none absolute bottom-2 start-1/2 z-10 flex -translate-x-1/2 flex-col items-center"
      aria-hidden="true"
      data-testid="spaceship"
    >
      <Rocket
        className={`size-6 rotate-180 text-[var(--color-primary)] sm:size-7 ${
          firing ? "opacity-100" : "opacity-80"
        }`}
        strokeWidth={1.6}
      />
      <span className="h-px w-12 bg-[var(--color-primary)] opacity-40" />
    </div>
  );
}
