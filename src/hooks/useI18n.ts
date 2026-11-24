"use client";

import { useCallback } from "react";
import { UI_TEXT, type UiTextKey } from "@/lib/i18n";
import { useSettingsStore } from "@/stores/settingsStore";

export function useI18n() {
  const language = useSettingsStore((state) => state.language);
  const t = useCallback((key: UiTextKey) => UI_TEXT[language][key], [language]);
  return { language, t };
}
