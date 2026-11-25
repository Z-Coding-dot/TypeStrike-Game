"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { gameAudio } from "@/game/systems/AudioController";
import type { SpeechStatus } from "@/game/systems/SpeechSystem";
import { useI18n } from "@/hooks/useI18n";
import { useSettingsStore } from "@/stores/settingsStore";
import type { LanguageCode } from "@/types/language";

export interface UseSpeechResult {
  speak: (text: string, language?: LanguageCode) => void;
  cancel: () => void;
  status: SpeechStatus;
  notice: string | null;
}

const INITIAL_STATUS: SpeechStatus = {
  supported: false,
  enabled: true,
  persianVoiceAvailable: false,
  englishVoiceAvailable: false,
  activeVoiceName: null,
  reason: null,
};

/**
 * Thin React bridge to the one shared SpeechSystem. Unmounting any consumer
 * cancels active and queued speech through the controller.
 */
export function useSpeech(): UseSpeechResult {
  const { language, t } = useI18n();
  const speechEnabled = useSettingsStore((state) => state.speechEnabled);
  const speechRate = useSettingsStore((state) => state.speechRate);
  const speechVolume = useSettingsStore((state) => state.speechVolume);

  const [status, setStatus] = useState<SpeechStatus>(INITIAL_STATUS);

  useEffect(() => {
    const unsubscribe = gameAudio.subscribeSpeech(setStatus);
    return () => {
      unsubscribe();
      gameAudio.cancelSpeech();
    };
  }, []);

  useEffect(() => {
    gameAudio.configureSpeech({
      enabled: speechEnabled,
      rate: speechRate,
      volume: speechVolume,
    });
  }, [speechEnabled, speechRate, speechVolume]);

  const speak = useCallback(
    (text: string, targetLanguage: LanguageCode = language) => {
      gameAudio.speak(text, targetLanguage);
    },
    [language],
  );

  const cancel = useCallback(() => {
    gameAudio.cancelSpeech();
  }, []);

  const notice = useMemo(() => {
    if (!status.supported) return t("speechUnavailable");
    if (!status.enabled) return null;
    if (language === "fa-AF" && !status.persianVoiceAvailable) {
      return t("speechUnsupportedLanguage");
    }
    if (language === "en" && !status.englishVoiceAvailable) {
      return t("noSpeechVoice");
    }
    if (status.reason?.startsWith("no ")) {
      return t("noSpeechVoice");
    }
    return null;
  }, [status, language, t]);

  return { speak, cancel, status, notice };
}
