"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import { useStatsStore } from "@/stores/statsStore";

/** Rehydrates persisted preferences/statistics safely on the client. */
export function useLocalStats(): void {
  useEffect(() => {
    void useSettingsStore.persist.rehydrate();
    void useStatsStore.persist.rehydrate();
  }, []);
}
