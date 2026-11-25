"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gameAudio } from "@/game/systems/AudioController";

/**
 * Route-level safety net: even if a game component is cached or unmounts in an
 * unusual order, leaving a route always cancels speech and stops every effect.
 */
export function AudioLifecycle() {
  const pathname = usePathname();

  useEffect(() => {
    gameAudio.stopAll();

    const stop = () => gameAudio.stopAll();
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") stop();
    };

    window.addEventListener("pagehide", stop);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", stop);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      gameAudio.stopAll();
    };
  }, [pathname]);

  return null;
}
