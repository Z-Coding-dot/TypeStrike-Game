import { afterEach, describe, expect, it, vi } from "vitest";
import { getAnalyticsProvider, setAnalyticsProvider, trackEvent, createInMemoryAnalyticsProvider } from "@/lib/analytics";
import { resetStoredStatistics, safeStateStorage } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/constants";

describe("safe storage", () => {
  it("stores and removes values without throwing in a non-browser environment", () => {
    safeStateStorage.setItem("typestrike.test", "value");
    expect(safeStateStorage.getItem("typestrike.test")).toBe("value");
    safeStateStorage.removeItem("typestrike.test");
    expect(safeStateStorage.getItem("typestrike.test")).toBeNull();
  });

  it("clears the statistics key", () => {
    safeStateStorage.setItem(STORAGE_KEYS.stats, "{}");
    resetStoredStatistics();
    expect(safeStateStorage.getItem(STORAGE_KEYS.stats)).toBeNull();
  });
});

describe("analytics abstraction", () => {
  afterEach(() => {
    setAnalyticsProvider(createInMemoryAnalyticsProvider());
  });

  it("never throws when no provider is configured", () => {
    expect(() => trackEvent("game_start", { mode: "words" })).not.toThrow();
  });

  it("forwards events and properties to the configured provider", () => {
    const provider = createInMemoryAnalyticsProvider();
    const track = vi.spyOn(provider, "track");
    setAnalyticsProvider(provider);
    trackEvent("mode_select", { mode: "sentences" });
    expect(track).toHaveBeenCalledOnce();
    expect(track.mock.calls[0][0].name).toBe("mode_select");
    expect(track.mock.calls[0][0].properties.mode).toBe("sentences");
    expect(getAnalyticsProvider()).toBe(provider);
  });
});
