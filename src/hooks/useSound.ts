"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSettingsStore } from "@/stores/settingsStore";

export type SoundName =
  | "shoot"
  | "impact"
  | "target-destroy"
  | "level-complete"
  | "life-lost"
  | "game-over"
  | "button-press"
  | "button-hover";

const SOUND_URLS: Record<SoundName, string> = {
  shoot: "/sounds/effects/shoot.wav",
  impact: "/sounds/effects/impact.wav",
  "target-destroy": "/sounds/effects/target-destroy.wav",
  "level-complete": "/sounds/effects/level-complete.wav",
  "life-lost": "/sounds/effects/life-lost.wav",
  "game-over": "/sounds/effects/game-over.wav",
  "button-press": "/sounds/interface/button-press.wav",
  "button-hover": "/sounds/interface/button-hover.wav",
};

/** Plays locally synthesized effects only after explicit in-app events. */
export function useSound() {
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const active = useRef<HTMLAudioElement[]>([]);

  useEffect(() => {
    return () => {
      for (const audio of active.current) {
        audio.pause();
        audio.src = "";
      }
      active.current = [];
    };
  }, []);

  return useCallback(
    (name: SoundName) => {
      if (!soundEnabled || typeof window === "undefined") return;
      try {
        const audio = new Audio(SOUND_URLS[name]);
        audio.volume = name.startsWith("button") ? 0.35 : 0.5;
        active.current.push(audio);
        if (active.current.length > 8) {
          const oldest = active.current.shift();
          oldest?.pause();
        }
        void audio.play().catch(() => {
          // Autoplay policies may still block audio; gameplay must continue.
        });
        audio.onended = () => {
          active.current = active.current.filter((item) => item !== audio);
          audio.src = "";
        };
      } catch {
        // Audio is optional.
      }
    },
    [soundEnabled],
  );
}
