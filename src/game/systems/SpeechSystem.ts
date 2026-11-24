import type { LanguageCode } from "@/types/language";

/** Snapshot exposed to UI consumers. Never mutated after being emitted. */
export interface SpeechStatus {
  supported: boolean;
  enabled: boolean;
  persianVoiceAvailable: boolean;
  englishVoiceAvailable: boolean;
  activeVoiceName: string | null;
  reason: string | null;
}

/** Minimal voice shape so selection stays testable without browser globals. */
export interface SpeechVoiceCandidate {
  lang: string;
  name: string;
  localService?: boolean;
}

export interface SpeechSystemOptions {
  enabled?: boolean;
  rate?: number;
  volume?: number;
}

export const NO_PERSIAN_VOICE_REASON = "no Persian voice available";
export const NO_ENGLISH_VOICE_REASON = "no English voice available";

const UNSUPPORTED_REASON = "speech synthesis is not supported in this browser";
const DISABLED_REASON = "speech is disabled";
const PLAYBACK_ERROR_REASON = "speech playback failed";

const PERSIAN_LOCALES = ["prs-af", "fa-af", "fa-ir", "fa"] as const;
const ENGLISH_LOCALES = ["en-us", "en-gb", "en"] as const;

function normalizeLocale(lang: string): string {
  return lang.trim().toLowerCase().replace(/_/g, "-");
}

/**
 * Returns 0-based preference rank for a locale chain, or -1 when unrelated.
 * Region subtags such as `fa-IR-u-nu-latn` still match their base locale.
 */
function localeRank(lang: string, locales: readonly string[]): number {
  for (let index = 0; index < locales.length; index += 1) {
    const locale = locales[index];
    if (lang === locale || lang.startsWith(`${locale}-`)) {
      return index;
    }
  }
  return -1;
}

function isAvailable(voices: readonly SpeechVoiceCandidate[], locales: readonly string[]): boolean {
  return voices.some((voice) => localeRank(normalizeLocale(voice?.lang ?? ""), locales) >= 0);
}

/**
 * Pure, deterministic voice picker.
 *
 * Persian is only ever matched against Persian/Dari locales; an English voice
 * with a Persian-sounding name is deliberately ignored.
 */
export function selectVoiceForLanguage(
  voices: Array<SpeechVoiceCandidate>,
  language: LanguageCode,
): SpeechVoiceCandidate | null {
  if (!Array.isArray(voices) || voices.length === 0) return null;

  const locales = language === "fa-AF" ? PERSIAN_LOCALES : ENGLISH_LOCALES;
  let best: { voice: SpeechVoiceCandidate; rank: number; local: boolean } | null = null;

  for (const candidate of voices) {
    if (!candidate || typeof candidate.lang !== "string" || typeof candidate.name !== "string") {
      continue;
    }
    const rank = localeRank(normalizeLocale(candidate.lang), locales);
    if (rank < 0) continue;

    const local = candidate.localService === true;
    if (best === null) {
      best = { voice: candidate, rank, local };
    } else if (rank < best.rank || (rank === best.rank && local && !best.local)) {
      best = { voice: candidate, rank, local };
    }
  }

  return best === null ? null : best.voice;
}

/**
 * Browser Web Speech API wrapper. Safe to construct during SSR: all browser
 * globals are accessed lazily inside methods after a `typeof window` guard.
 */
export class SpeechSystem {
  private readonly supported: boolean;
  private enabled: boolean;
  private rate: number;
  private volume: number;

  private synthesis: SpeechSynthesis | null = null;
  private voices: SpeechVoiceCandidate[] = [];
  private listeners = new Set<(status: SpeechStatus) => void>();
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private activeVoiceName: string | null = null;
  private lastLanguage: LanguageCode | null = null;
  private missingVoiceReason: string | null = null;
  private playbackError: string | null = null;
  private voicesListenerAttached = false;
  private legacyVoicesListenerAttached = false;
  private destroyed = false;

  private status: SpeechStatus;

  constructor(options: SpeechSystemOptions = {}) {
    this.enabled = options.enabled ?? true;
    this.rate = options.rate ?? 1;
    this.volume = options.volume ?? 0.8;

    const canUseSpeech =
      typeof window !== "undefined" &&
      typeof window.speechSynthesis !== "undefined" &&
      typeof window.SpeechSynthesisUtterance === "function";

    this.supported = canUseSpeech;
    this.status = {
      supported: canUseSpeech,
      enabled: this.enabled,
      persianVoiceAvailable: false,
      englishVoiceAvailable: false,
      activeVoiceName: null,
      reason: canUseSpeech ? null : UNSUPPORTED_REASON,
    };

    if (!canUseSpeech) return;

    this.synthesis = window.speechSynthesis;
    this.attachVoicesListener();
    this.refreshVoices();
  }

  speak(text: string, language: LanguageCode): void {
    if (this.destroyed || !this.supported || !this.synthesis || !this.enabled) return;
    if (typeof text !== "string" || text.trim().length === 0) return;

    this.lastLanguage = language;
    const voice = selectVoiceForLanguage(this.voices, language);

    // Rapid completions should replace queued speech instead of overlapping it.
    this.clearCurrentUtterance();
    try {
      this.synthesis.cancel();
    } catch {
      // A broken speech provider must never interrupt gameplay.
    }

    if (!voice) {
      this.missingVoiceReason = language === "fa-AF" ? NO_PERSIAN_VOICE_REASON : NO_ENGLISH_VOICE_REASON;
      this.playbackError = null;
      this.publishStatus();
      return;
    }

    this.missingVoiceReason = null;
    this.playbackError = null;

    let utterance: SpeechSynthesisUtterance;
    try {
      utterance = new window.SpeechSynthesisUtterance(text.trim());
      utterance.voice = voice as unknown as SpeechSynthesisVoice;
      utterance.lang = voice.lang || (language === "fa-AF" ? "fa-AF" : "en-US");
      utterance.rate = this.rate;
      utterance.volume = this.volume;
    } catch {
      this.playbackError = PLAYBACK_ERROR_REASON;
      this.publishStatus();
      return;
    }

    utterance.onend = () => {
      if (this.currentUtterance !== utterance) return;
      this.currentUtterance = null;
      this.activeVoiceName = null;
      this.playbackError = null;
      this.publishStatus();
    };
    utterance.onerror = () => {
      if (this.currentUtterance !== utterance) return;
      this.currentUtterance = null;
      this.activeVoiceName = null;
      this.playbackError = PLAYBACK_ERROR_REASON;
      this.publishStatus();
    };

    this.currentUtterance = utterance;
    this.activeVoiceName = voice.name;
    this.publishStatus();

    try {
      this.synthesis.speak(utterance);
    } catch {
      this.clearCurrentUtterance();
      this.playbackError = PLAYBACK_ERROR_REASON;
      this.publishStatus();
    }
  }

  cancel(): void {
    if (this.destroyed) return;
    this.clearCurrentUtterance();
    try {
      this.synthesis?.cancel();
    } catch {
      // Ignore provider failures.
    }
    this.playbackError = null;
    this.publishStatus();
  }

  setEnabled(enabled: boolean): void {
    if (this.destroyed || this.enabled === enabled) return;
    this.enabled = enabled;
    if (!enabled) {
      this.clearCurrentUtterance();
      try {
        this.synthesis?.cancel();
      } catch {
        // Ignore provider failures.
      }
    }
    this.publishStatus();
  }

  setRate(rate: number): void {
    if (!Number.isFinite(rate)) return;
    this.rate = Math.min(10, Math.max(0.1, rate));
    if (this.currentUtterance) {
      this.currentUtterance.rate = this.rate;
    }
  }

  setVolume(volume: number): void {
    if (!Number.isFinite(volume)) return;
    this.volume = Math.min(1, Math.max(0, volume));
    if (this.currentUtterance) {
      this.currentUtterance.volume = this.volume;
    }
  }

  getStatus(): SpeechStatus {
    return { ...this.status };
  }

  subscribe(listener: (status: SpeechStatus) => void): () => void {
    if (this.destroyed) return () => undefined;
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  destroy(): void {
    if (this.destroyed) return;
    this.clearCurrentUtterance();
    try {
      this.synthesis?.cancel();
    } catch {
      // Ignore provider failures.
    }
    this.detachVoicesListener();
    this.listeners.clear();
    this.voices = [];
    this.synthesis = null;
    this.destroyed = true;
  }

  private clearCurrentUtterance(): void {
    if (!this.currentUtterance) return;
    this.currentUtterance.onend = null;
    this.currentUtterance.onerror = null;
    this.currentUtterance = null;
    this.activeVoiceName = null;
  }

  private computeReason(): string | null {
    if (!this.supported) return UNSUPPORTED_REASON;
    if (!this.enabled) return DISABLED_REASON;
    if (this.playbackError) return this.playbackError;
    if (this.missingVoiceReason) {
      // A voice can appear after `voiceschanged`; clear the notice then.
      if (this.lastLanguage && selectVoiceForLanguage(this.voices, this.lastLanguage)) {
        return null;
      }
      return this.missingVoiceReason;
    }
    return null;
  }

  private publishStatus(): void {
    const next: SpeechStatus = {
      supported: this.supported,
      enabled: this.enabled,
      persianVoiceAvailable: isAvailable(this.voices, PERSIAN_LOCALES),
      englishVoiceAvailable: isAvailable(this.voices, ENGLISH_LOCALES),
      activeVoiceName: this.activeVoiceName,
      reason: this.computeReason(),
    };

    const previous = this.status;
    if (
      previous.supported === next.supported &&
      previous.enabled === next.enabled &&
      previous.persianVoiceAvailable === next.persianVoiceAvailable &&
      previous.englishVoiceAvailable === next.englishVoiceAvailable &&
      previous.activeVoiceName === next.activeVoiceName &&
      previous.reason === next.reason
    ) {
      return;
    }

    this.status = next;
    this.listeners.forEach((listener) => {
      try {
        listener(next);
      } catch {
        // A failing UI listener must never break speech state updates.
      }
    });
  }

  private refreshVoices = (): void => {
    if (this.destroyed || !this.synthesis) return;
    let voices: SpeechVoiceCandidate[] = [];
    try {
      voices = Array.from(this.synthesis.getVoices() ?? []);
    } catch {
      voices = [];
    }
    this.voices = voices;
    this.publishStatus();
  };

  private handleVoicesChanged = (): void => {
    this.refreshVoices();
  };

  private attachVoicesListener(): void {
    if (!this.synthesis) return;

    if (typeof this.synthesis.addEventListener === "function") {
      this.synthesis.addEventListener("voiceschanged", this.handleVoicesChanged);
      this.voicesListenerAttached = true;
    }

    const legacy = this.synthesis as SpeechSynthesis & { onvoiceschanged?: (() => void) | null };
    if ("onvoiceschanged" in legacy) {
      legacy.onvoiceschanged = this.handleVoicesChanged;
      this.legacyVoicesListenerAttached = true;
    }
  }

  private detachVoicesListener(): void {
    if (!this.synthesis) return;

    if (this.voicesListenerAttached && typeof this.synthesis.removeEventListener === "function") {
      this.synthesis.removeEventListener("voiceschanged", this.handleVoicesChanged);
      this.voicesListenerAttached = false;
    }
    if (this.legacyVoicesListenerAttached) {
      const legacy = this.synthesis as SpeechSynthesis & { onvoiceschanged?: (() => void) | null };
      legacy.onvoiceschanged = null;
      this.legacyVoicesListenerAttached = false;
    }
  }
}
