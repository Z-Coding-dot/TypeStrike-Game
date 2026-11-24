import { create } from "zustand";
import { INITIAL_STATS } from "@/types/game";
import type { GameMode, GameResult, GameStats, GameStatus, TargetData } from "@/types/game";
import type { LanguageCode } from "@/types/language";

interface GameState {
  status: GameStatus;
  mode: GameMode;
  language: LanguageCode;
  stats: GameStats;
  targets: TargetData[];
  inputValue: string;
  result: GameResult | null;
  levelCompleted: number | null;
  feedback: "idle" | "success" | "error";
  speechNotice: string | null;
  setSession: (mode: GameMode, language: LanguageCode) => void;
  setStatus: (status: GameStatus) => void;
  setStats: (stats: GameStats) => void;
  setTargets: (targets: TargetData[]) => void;
  setInputValue: (value: string) => void;
  setResult: (result: GameResult | null) => void;
  setLevelCompleted: (level: number | null) => void;
  setFeedback: (feedback: GameState["feedback"]) => void;
  setSpeechNotice: (notice: string | null) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  status: "menu",
  mode: "words",
  language: "en",
  stats: INITIAL_STATS,
  targets: [],
  inputValue: "",
  result: null,
  levelCompleted: null,
  feedback: "idle",
  speechNotice: null,
  setSession: (mode, language) => set({ mode, language }),
  setStatus: (status) => set({ status }),
  setStats: (stats) => set({ stats }),
  setTargets: (targets) => set({ targets }),
  setInputValue: (inputValue) => set({ inputValue }),
  setResult: (result) => set({ result }),
  setLevelCompleted: (levelCompleted) => set({ levelCompleted }),
  setFeedback: (feedback) => set({ feedback }),
  setSpeechNotice: (speechNotice) => set({ speechNotice }),
  reset: () =>
    set({
      status: "menu",
      stats: INITIAL_STATS,
      targets: [],
      inputValue: "",
      result: null,
      levelCompleted: null,
      feedback: "idle",
    }),
}));
