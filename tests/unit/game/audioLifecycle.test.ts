import { afterEach, describe, expect, it, vi } from "vitest";
import { GameAudioController } from "@/game/systems/AudioController";

class FakeUtterance {
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  lang = "";
  rate = 1;
  volume = 1;
  voice: unknown = null;

  constructor(readonly text: string) {}
}

class FakeAudio {
  static instances: FakeAudio[] = [];

  readonly play = vi.fn().mockResolvedValue(undefined);
  readonly pause = vi.fn();
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  volume = 1;
  src: string;

  constructor(src: string) {
    this.src = src;
    FakeAudio.instances.push(this);
  }
}

function installBrowserStubs() {
  const speak = vi.fn();
  const cancel = vi.fn();

  vi.stubGlobal("Audio", FakeAudio);
  vi.stubGlobal("window", {
    Audio: FakeAudio,
    SpeechSynthesisUtterance: FakeUtterance,
    speechSynthesis: {
      speak,
      cancel,
      getVoices: () => [{ name: "Test English", lang: "en-US", localService: true }],
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
  });

  return { speak, cancel };
}

afterEach(() => {
  vi.unstubAllGlobals();
  FakeAudio.instances = [];
});

describe("GameAudioController lifecycle", () => {
  it("cancels speech on a route stop without replaying queued utterances", () => {
    const { speak, cancel } = installBrowserStubs();
    const controller = new GameAudioController();
    controller.configureSpeech({ enabled: true, rate: 1, volume: 0.8 });
    controller.configureSound(true);

    controller.speak("signal", "en");
    expect(speak).toHaveBeenCalledTimes(1);

    const speakCallsBeforeStop = speak.mock.calls.length;
    controller.stopAll();
    expect(cancel).toHaveBeenCalled();
    expect(speak.mock.calls.length).toBe(speakCallsBeforeStop);

    // A later, explicit session can speak again; nothing queued replays by itself.
    controller.speak("fresh", "en");
    expect(speak).toHaveBeenCalledTimes(speakCallsBeforeStop + 1);
  });

  it("stops and releases every effect when leaving a route", () => {
    installBrowserStubs();
    const controller = new GameAudioController();
    controller.configureSound(true);

    controller.play("shoot");
    controller.play("impact");
    expect(FakeAudio.instances).toHaveLength(2);
    expect(FakeAudio.instances.every((audio) => audio.play.mock.calls.length === 1)).toBe(true);

    controller.stopAll();
    expect(FakeAudio.instances.every((audio) => audio.pause.mock.calls.length === 1)).toBe(true);
    expect(FakeAudio.instances.every((audio) => audio.src === "")).toBe(true);
  });

  it("ignores effects when sound is disabled", () => {
    installBrowserStubs();
    const controller = new GameAudioController();
    controller.configureSound(false);

    controller.play("shoot");
    expect(FakeAudio.instances).toHaveLength(0);
  });
});
