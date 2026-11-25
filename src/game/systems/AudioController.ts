import { SpeechSystem, type SpeechStatus } from "@/game/systems/SpeechSystem";
import type { LanguageCode } from "@/types/language";

export type SoundName =
  | "shoot"
  | "impact"
  | "target-destroy"
  | "level-complete"
  | "life-lost"
  | "game-over"
  | "button-press"
  | "button-hover";

const SOUND_URLS: Record<SoundName, string> = {
  shoot: "/sounds/effects/shoot.wav",
  impact: "/sounds/effects/impact.wav",
  "target-destroy": "/sounds/effects/target-destroy.wav",
  "level-complete": "/sounds/effects/level-complete.wav",
  "life-lost": "/sounds/effects/life-lost.wav",
  "game-over": "/sounds/effects/game-over.wav",
  "button-press": "/sounds/interface/button-press.wav",
  "button-hover": "/sounds/interface/button-hover.wav",
};

const MAX_ACTIVE_SOUNDS = 8;

/**
 * One owner for every game sound and for the single Web Speech instance.
 *
 * Components may come and go (route changes, Strict Mode remounts, renderer
 * restarts) without leaving speech or effects running. Cancellation is
 * generation-guarded so a queued request from an old session cannot speak
 * after a new one starts.
 */
export class GameAudioController {
  private soundEnabled = true;
  private speechEnabled = true;
  private rate = 1;
  private volume = 0.8;

  private speech: SpeechSystem | null = null;
  private readonly activeSounds = new Set<HTMLAudioElement>();
  private generation = 0;
  private disposed = false;

  configureSound(enabled: boolean): void {
    this.soundEnabled = enabled;
    if (!enabled) this.stopSounds();
  }

  configureSpeech(options: { enabled: boolean; rate: number; volume: number }): void {
    this.speechEnabled = options.enabled;
    this.rate = options.rate;
    this.volume = options.volume;

    const system = this.speech;
    if (!system) return;
    system.setRate(this.rate);
    system.setVolume(this.volume);
    system.setEnabled(this.speechEnabled);
    if (!this.speechEnabled) this.cancelSpeech();
  }

  /** Lazily creates the only SpeechSystem instance used by the app. */
  private ensureSpeech(): SpeechSystem | null {
    if (this.disposed || typeof window === "undefined") return null;
    if (!this.speech) {
      this.speech = new SpeechSystem({
        enabled: this.speechEnabled,
        rate: this.rate,
        volume: this.volume,
      });
    }
    return this.speech;
  }

  getSpeechStatus(): SpeechStatus {
    const system = this.ensureSpeech();
    if (system) return system.getStatus();
    return {
      supported: false,
      enabled: this.speechEnabled,
      persianVoiceAvailable: false,
      englishVoiceAvailable: false,
      activeVoiceName: null,
      reason: null,
    };
  }

  subscribeSpeech(listener: (status: SpeechStatus) => void): () => void {
    const system = this.ensureSpeech();
    if (!system) return () => undefined;
    const unsubscribe = system.subscribe(listener);
    listener(system.getStatus());
    return unsubscribe;
  }

  speak(text: string, language: LanguageCode): void {
    if (this.disposed || !this.speechEnabled) return;
    const generation = this.generation;
    const system = this.ensureSpeech();
    if (!system || generation !== this.generation) return;
    system.speak(text, language);
  }

  /** Invalidates pending speech and stops any utterance in all queues. */
  cancelSpeech(): void {
    this.generation += 1;
    this.speech?.cancel();
    if (typeof window === "undefined") return;
    try {
      window.speechSynthesis?.cancel();
    } catch (error) {
      // A broken provider must never interrupt gameplay or navigation.
      console.warn("TypeStrike: speech cancellation failed", error);
    }
  }

  play(name: SoundName): void {
    if (this.disposed || !this.soundEnabled || typeof window === "undefined") return;
    try {
      const audio = new Audio(SOUND_URLS[name]);
      audio.volume = name.startsWith("button") ? 0.35 : 0.5;
      this.activeSounds.add(audio);
      if (this.activeSounds.size > MAX_ACTIVE_SOUNDS) {
        const oldest = this.activeSounds.values().next().value;
        if (oldest) this.stopSound(oldest);
      }

      const finish = () => {
        this.stopSound(audio);
      };
      audio.onended = finish;
      audio.onerror = finish;
      void audio.play().catch((error: unknown) => {
        console.warn("TypeStrike: sound playback was blocked", error);
        finish();
      });
    } catch (error) {
      // Sound is optional; gameplay must continue when audio is blocked.
      console.warn("TypeStrike: sound effect could not be created", error);
    }
  }

  stopSounds(): void {
    for (const audio of Array.from(this.activeSounds)) this.stopSound(audio);
    this.activeSounds.clear();
  }

  private stopSound(audio: HTMLAudioElement): void {
    audio.onended = null;
    audio.onerror = null;
    try {
      audio.pause();
      audio.src = "";
    } catch (error) {
      // Ignore already-released elements, but keep the reason observable.
      console.warn("TypeStrike: sound cleanup failed", error);
    }
    this.activeSounds.delete(audio);
  }

  /** Stops speech and every effect; safe to call on any route transition. */
  stopAll(): void {
    this.cancelSpeech();
    this.stopSounds();
  }

  /** Used only by tests/hot reload when the whole controller is discarded. */
  destroy(): void {
    if (this.disposed) return;
    this.stopAll();
    this.speech?.destroy();
    this.speech = null;
    this.disposed = true;
  }
}

/** Shared singleton: no component creates its own speech or audio pool. */
export const gameAudio = new GameAudioController();
