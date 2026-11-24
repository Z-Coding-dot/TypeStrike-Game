import type { AnalyticsEvent, AnalyticsProvider } from "@/types/analytics";

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string | number | boolean | null> },
    ) => void;
  }
}

/**
 * Optional Plausible connector. It is only activated when both environment
 * variables are present; otherwise analytics remains a no-op with an empty
 * dashboard state.
 */
export function createPlausibleProvider(siteId: string): AnalyticsProvider {
  if (typeof window !== "undefined" && siteId) {
    const selector = `script[data-domain="${siteId}"]`;
    if (!document.querySelector(selector)) {
      const script = document.createElement("script");
      script.defer = true;
      script.src = "https://plausible.io/js/script.js";
      script.dataset.domain = siteId;
      document.head.appendChild(script);
    }
  }

  return {
    name: "plausible",
    configured: true,
    track(event: AnalyticsEvent) {
      if (typeof window === "undefined" || typeof window.plausible !== "function") return;
      window.plausible(event.name, { props: event.properties });
    },
  };
}
