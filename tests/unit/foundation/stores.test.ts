import { beforeEach, describe, expect, it } from "vitest";
import { INITIAL_STATS } from "@/types/game";
import { useGameStore } from "@/stores/gameStore";
import { selectGameSettings, useSettingsStore } from "@/stores/settingsStore";
import { useStatsStore } from "@/stores/statsStore";
import type { GameResult } from "@/types/game";

const result = (score: number, highestLevel: number, completed = false): GameResult => ({
  mode: "words",
  language: "en",
  score,
  highestLevel,
  targetsCompleted: 6,
  correctChars: 120,
  incorrectChars: 8,
  accuracy: 93.75,
  averageWpm: 48,
  bestWpm: 55,
  durationMs: 60_000,
  completed,
  finishedAt: "2026-01-01T00:00:00.000Z",
});

describe("local game stores", () => {
  beforeEach(() => {
    useGameStore.getState().reset();
    useStatsStore.getState().resetStatistics();
  });

  it("records high score, highest level and per-mode statistics", () => {
    useStatsStore.getState().recordResult(result(900, 3, true));
    useStatsStore.getState().recordResult(result(400, 5));

    const state = useStatsStore.getState();
    expect(state.highScore).toBe(900);
    expect(state.highestLevel).toBe(5);
    expect(state.gamesPlayed).toBe(2);
    expect(state.gamesCompleted).toBe(1);
    expect(state.perMode.words.bestWpm).toBe(55);
    expect(state.recentResults).toHaveLength(2);
  });

  it("resets statistics to empty values", () => {
    useStatsStore.getState().recordResult(result(900, 3));
    useStatsStore.getState().resetStatistics();
    expect(useStatsStore.getState().highScore).toBe(0);
    expect(useStatsStore.getState().recentResults).toHaveLength(0);
  });

  it("keeps session state isolated and exposes settings snapshots", () => {
    useSettingsStore.getState().setLanguage("fa-AF");
    useSettingsStore.getState().setMode("sentences");
    useSettingsStore.getState().setSpeechEnabled(false);

    expect(selectGameSettings(useSettingsStore.getState()).speechEnabled).toBe(false);
    expect(useSettingsStore.getState().language).toBe("fa-AF");

    useGameStore.getState().setSession("letters", "fa-AF");
    useGameStore.getState().setStats({ ...INITIAL_STATS, score: 120 });
    expect(useGameStore.getState().stats.score).toBe(120);

    useSettingsStore.getState().setLanguage("en");
    useSettingsStore.getState().setMode("words");
    useSettingsStore.getState().setSpeechEnabled(true);
  });
});
