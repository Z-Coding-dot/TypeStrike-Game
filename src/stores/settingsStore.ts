import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/constants";
import { safeStateStorage } from "@/lib/storage";
import type { GameMode, GameSettings } from "@/types/game";
import type { LanguageCode } from "@/types/language";

interface SettingsState extends GameSettings {
  language: LanguageCode;
  mode: GameMode;
  hydrated: boolean;
  setLanguage: (language: LanguageCode) => void;
  setMode: (mode: GameMode) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSpeechEnabled: (enabled: boolean) => void;
  setSpeechRate: (rate: number) => void;
  setSpeechVolume: (volume: number) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: "en",
      mode: "words",
      soundEnabled: true,
      speechEnabled: true,
      speechRate: 1,
      speechVolume: 0.8,
      animationsEnabled: true,
      hydrated: false,
      setLanguage: (language) => set({ language }),
      setMode: (mode) => set({ mode }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setSpeechEnabled: (speechEnabled) => set({ speechEnabled }),
      setSpeechRate: (speechRate) => set({ speechRate }),
      setSpeechVolume: (speechVolume) => set({ speechVolume }),
      setAnimationsEnabled: (animationsEnabled) => set({ animationsEnabled }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: STORAGE_KEYS.settings,
      storage: createJSONStorage(() => safeStateStorage),
      skipHydration: true,
      partialize: ({ language, mode, soundEnabled, speechEnabled, speechRate, speechVolume, animationsEnabled }) => ({
        language,
        mode,
        soundEnabled,
        speechEnabled,
        speechRate,
        speechVolume,
        animationsEnabled,
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);

export function selectGameSettings(state: SettingsState): GameSettings {
  return {
    soundEnabled: state.soundEnabled,
    speechEnabled: state.speechEnabled,
    speechRate: state.speechRate,
    speechVolume: state.speechVolume,
    animationsEnabled: state.animationsEnabled,
  };
}
