"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SpeechSystem,
  type SpeechStatus,
  type SpeechSystemOptions,
} from "@/game/systems/SpeechSystem";
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
 * Bridges the settings store to a single long-lived SpeechSystem instance.
 * Speech is fire-and-forget: callers never await it, so typing is never blocked.
 */
export function useSpeech(): UseSpeechResult {
  const { language, t } = useI18n();
  const speechEnabled = useSettingsStore((state) => state.speechEnabled);
  const speechRate = useSettingsStore((state) => state.speechRate);
  const speechVolume = useSettingsStore((state) => state.speechVolume);

  const systemRef = useRef<SpeechSystem | null>(null);
  const initialOptionsRef = useRef<SpeechSystemOptions>({
    enabled: speechEnabled,
    rate: speechRate,
    volume: speechVolume,
  });

  const [status, setStatus] = useState<SpeechStatus>(INITIAL_STATUS);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const system = new SpeechSystem(initialOptionsRef.current);
    systemRef.current = system;
    setStatus(system.getStatus());
    const unsubscribe = system.subscribe(setStatus);
    setInitialized(true);

    return () => {
      unsubscribe();
      system.destroy();
      if (systemRef.current === system) {
        systemRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    systemRef.current?.setEnabled(speechEnabled);
  }, [speechEnabled]);

  useEffect(() => {
    systemRef.current?.setRate(speechRate);
  }, [speechRate]);

  useEffect(() => {
    systemRef.current?.setVolume(speechVolume);
  }, [speechVolume]);

  const speak = useCallback(
    (text: string, targetLanguage: LanguageCode = language) => {
      systemRef.current?.speak(text, targetLanguage);
    },
    [language],
  );

  const cancel = useCallback(() => {
    systemRef.current?.cancel();
  }, []);

  const notice = useMemo(() => {
    if (!initialized) return null;
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
  }, [initialized, status, language, t]);

  return { speak, cancel, status, notice };
}
