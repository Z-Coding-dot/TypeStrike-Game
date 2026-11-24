import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/constants";
import { resetStoredStatistics, safeStateStorage } from "@/lib/storage";
import type { GameMode, GameResult } from "@/types/game";

export interface ModeStatistics {
  gamesPlayed: number;
  targetsCompleted: number;
  bestScore: number;
  bestWpm: number;
}

export interface LocalStatistics {
  highScore: number;
  highestLevel: number;
  gamesPlayed: number;
  gamesCompleted: number;
  totalTargets: number;
  totalDurationMs: number;
  perMode: Record<GameMode, ModeStatistics>;
  recentResults: GameResult[];
}

const emptyModeStatistics = (): ModeStatistics => ({
  gamesPlayed: 0,
  targetsCompleted: 0,
  bestScore: 0,
  bestWpm: 0,
});

const initialStatistics: LocalStatistics = {
  highScore: 0,
  highestLevel: 0,
  gamesPlayed: 0,
  gamesCompleted: 0,
  totalTargets: 0,
  totalDurationMs: 0,
  perMode: {
    letters: emptyModeStatistics(),
    words: emptyModeStatistics(),
    sentences: emptyModeStatistics(),
  },
  recentResults: [],
};

interface StatsState extends LocalStatistics {
  hydrated: boolean;
  recordResult: (result: GameResult) => void;
  resetStatistics: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useStatsStore = create<StatsState>()(
  persist(
    (set) => ({
      ...initialStatistics,
      hydrated: false,
      recordResult: (result) =>
        set((state) => {
          const modeStats = state.perMode[result.mode];
          return {
            highScore: Math.max(state.highScore, result.score),
            highestLevel: Math.max(state.highestLevel, result.highestLevel),
            gamesPlayed: state.gamesPlayed + 1,
            gamesCompleted: state.gamesCompleted + (result.completed ? 1 : 0),
            totalTargets: state.totalTargets + result.targetsCompleted,
            totalDurationMs: state.totalDurationMs + result.durationMs,
            perMode: {
              ...state.perMode,
              [result.mode]: {
                gamesPlayed: modeStats.gamesPlayed + 1,
                targetsCompleted: modeStats.targetsCompleted + result.targetsCompleted,
                bestScore: Math.max(modeStats.bestScore, result.score),
                bestWpm: Math.max(modeStats.bestWpm, result.bestWpm),
              },
            },
            recentResults: [result, ...state.recentResults].slice(0, 20),
          };
        }),
      resetStatistics: () => {
        resetStoredStatistics();
        set({ ...initialStatistics, perMode: {
          letters: emptyModeStatistics(),
          words: emptyModeStatistics(),
          sentences: emptyModeStatistics(),
        } });
      },
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: STORAGE_KEYS.stats,
      storage: createJSONStorage(() => safeStateStorage),
      skipHydration: true,
      partialize: (state) => ({
        highScore: state.highScore,
        highestLevel: state.highestLevel,
        gamesPlayed: state.gamesPlayed,
        gamesCompleted: state.gamesCompleted,
        totalTargets: state.totalTargets,
        totalDurationMs: state.totalDurationMs,
        perMode: state.perMode,
        recentResults: state.recentResults,
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);
