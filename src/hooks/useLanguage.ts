"use client";

import { useCallback, useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import { useSettingsStore } from "@/stores/settingsStore";
import { directionForLanguage } from "@/types/language";
import type { LanguageCode } from "@/types/language";

export interface UseLanguageResult {
  language: LanguageCode;
  direction: "ltr" | "rtl";
  setLanguage: (language: LanguageCode) => void;
}

export function useLanguage(): UseLanguageResult {
  const language = useSettingsStore((state) => state.language);
  const setLanguageInStore = useSettingsStore((state) => state.setLanguage);
  const direction = directionForLanguage(language);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [language, direction]);

  const setLanguage = useCallback(
    (next: LanguageCode) => {
      if (next === language) return;
      setLanguageInStore(next);
      trackEvent("language_select", { language: next });
    },
    [language, setLanguageInStore],
  );

  return { language, direction, setLanguage };
}
