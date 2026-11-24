import { afterEach, describe, expect, it, vi } from "vitest";
import {
  NO_PERSIAN_VOICE_REASON,
  SpeechSystem,
  type SpeechVoiceCandidate,
} from "@/game/systems/SpeechSystem";

class FakeUtterance {
  text: string;
  voice: SpeechVoiceCandidate | null = null;
  lang = "";
  rate = 1;
  volume = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

interface FakeEnvironment {
  voices: SpeechVoiceCandidate[];
  spoken: FakeUtterance[];
  listeners: Set<() => void>;
  cancels: number;
}

function installFakeSpeech(voices: SpeechVoiceCandidate[]): FakeEnvironment {
  const env: FakeEnvironment = { voices, spoken: [], listeners: new Set(), cancels: 0 };
  const synthesis = {
    getVoices: () => env.voices,
    speak: (utterance: FakeUtterance) => {
      env.spoken.push(utterance);
    },
    cancel: () => {
      env.cancels += 1;
    },
    addEventListener: (_type: string, listener: () => void) => {
      env.listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: () => void) => {
      env.listeners.delete(listener);
    },
  };

  vi.stubGlobal("window", {
    speechSynthesis: synthesis,
    SpeechSynthesisUtterance: FakeUtterance,
  });
  return env;
}

function emitVoicesChanged(env: FakeEnvironment): void {
  env.listeners.forEach((listener) => listener());
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SpeechSystem", () => {
  it("is safe without browser globals (SSR)", () => {
    vi.stubGlobal("window", undefined);
    const system = new SpeechSystem({ enabled: true });

    expect(system.getStatus().supported).toBe(false);
    expect(system.getStatus().reason).toMatch(/not supported/);
    expect(() => system.speak("hello", "en")).not.toThrow();
    expect(() => system.cancel()).not.toThrow();
    const unsubscribe = system.subscribe(() => undefined);
    expect(unsubscribe).toBeTypeOf("function");
    expect(() => unsubscribe()).not.toThrow();
    expect(() => system.destroy()).not.toThrow();
  });

  it("refuses Persian without a Persian voice and speaks English with the right settings", () => {
    const env = installFakeSpeech([{ lang: "en-US", name: "English US", localService: true }]);
    const system = new SpeechSystem({ enabled: true, rate: 1.2, volume: 0.5 });
    const statuses: string[] = [];
    const unsubscribe = system.subscribe((status) => statuses.push(status.reason ?? "ok"));

    expect(system.getStatus().persianVoiceAvailable).toBe(false);
    expect(system.getStatus().englishVoiceAvailable).toBe(true);

    system.speak("سلام", "fa-AF");
    expect(env.spoken).toHaveLength(0);
    expect(system.getStatus().reason).toBe(NO_PERSIAN_VOICE_REASON);

    system.speak("hello", "en");
    expect(env.spoken).toHaveLength(1);
    expect(env.spoken[0].voice?.name).toBe("English US");
    expect(env.spoken[0].lang).toBe("en-US");
    expect(env.spoken[0].rate).toBe(1.2);
    expect(env.spoken[0].volume).toBe(0.5);
    expect(system.getStatus().reason).toBeNull();
    expect(system.getStatus().activeVoiceName).toBe("English US");

    env.spoken[0].onend?.();
    expect(system.getStatus().activeVoiceName).toBeNull();
    expect(statuses.length).toBeGreaterThan(0);

    unsubscribe();
    system.destroy();
  });

  it("updates availability on voiceschanged and then speaks Persian", () => {
    const env = installFakeSpeech([{ lang: "en-US", name: "English US" }]);
    const system = new SpeechSystem();

    system.speak("دری", "fa-AF");
    expect(system.getStatus().reason).toBe(NO_PERSIAN_VOICE_REASON);

    env.voices.push({ lang: "fa-IR", name: "Persian" });
    emitVoicesChanged(env);

    expect(system.getStatus().persianVoiceAvailable).toBe(true);
    expect(system.getStatus().reason).toBeNull();

    system.speak("دری", "fa-AF");
    expect(env.spoken).toHaveLength(1);
    expect(env.spoken[0].voice?.lang).toBe("fa-IR");
    expect(env.spoken[0].lang).toBe("fa-IR");

    system.destroy();
    expect(env.listeners.size).toBe(0);
  });
});
