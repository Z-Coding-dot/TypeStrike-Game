"use client";

import { useEffect, type ReactNode } from "react";
import { setAnalyticsProvider, trackEvent } from "@/lib/analytics";
import { createPlausibleProvider } from "@/lib/providers/plausible";
import { useLocalStats } from "@/hooks/useLocalStats";
import { useLanguage } from "@/hooks/useLanguage";
import { usePathname } from "next/navigation";
import { useSettingsStore } from "@/stores/settingsStore";

export function ClientProviders({ children }: { children: ReactNode }) {
  useLocalStats();
  const { direction } = useLanguage();
  const animationsEnabled = useSettingsStore((state) => state.animationsEnabled);
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.dataset.animations = animationsEnabled ? "on" : "off";
  }, [animationsEnabled]);

  useEffect(() => {
    const provider = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER;
    const siteId = process.env.NEXT_PUBLIC_ANALYTICS_SITE_ID;
    if (provider === "plausible" && siteId) {
      setAnalyticsProvider(createPlausibleProvider(siteId));
    }
  }, []);

  useEffect(() => {
    trackEvent("page_view", { path: pathname, direction });
  }, [pathname, direction]);

  return <>{children}</>;
}
