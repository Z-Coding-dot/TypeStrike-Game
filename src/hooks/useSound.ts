"use client";

import { useCallback, useEffect } from "react";
import { gameAudio, type SoundName } from "@/game/systems/AudioController";
import { useSettingsStore } from "@/stores/settingsStore";

export type { SoundName };

/** Routes effects through the shared audio controller and its settings. */
export function useSound() {
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);

  useEffect(() => {
    gameAudio.configureSound(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    return () => {
      gameAudio.stopSounds();
    };
  }, []);

  return useCallback((name: SoundName) => {
    gameAudio.play(name);
  }, []);
}
