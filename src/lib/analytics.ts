import type { AnalyticsEvent, AnalyticsProvider } from "@/types/analytics";

/**
 * Analytics stays deliberately provider-agnostic. Player keystrokes and typed
 * text are never included in events.
 */
class NoopAnalyticsProvider implements AnalyticsProvider {
  readonly name = "none";
  readonly configured = false;

  track(_event: AnalyticsEvent): void {
    // Intentionally empty: no provider configured.
  }
}

let provider: AnalyticsProvider = new NoopAnalyticsProvider();

export function setAnalyticsProvider(next: AnalyticsProvider): void {
  provider = next;
}

export function getAnalyticsProvider(): AnalyticsProvider {
  return provider;
}

export function trackEvent(
  name: AnalyticsEvent["name"],
  properties: AnalyticsEvent["properties"] = {},
): void {
  const event: AnalyticsEvent = {
    name,
    timestamp: new Date().toISOString(),
    properties,
  };

  try {
    provider.track(event);
  } catch {
    // Analytics must never break gameplay.
  }
}

/** In-memory buffer used by the local-only demo provider and admin empty state. */
export function createInMemoryAnalyticsProvider(): AnalyticsProvider {
  const events: AnalyticsEvent[] = [];
  return {
    name: "in-memory",
    configured: false,
    track(event) {
      events.push(event);
      if (events.length > 1000) events.shift();
    },
  };
}
