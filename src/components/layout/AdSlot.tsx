"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/hooks/useI18n";
import { trackEvent } from "@/lib/analytics";

export type AdPlacement = "sidebar-left" | "sidebar-right" | "bottom" | "content";

export interface AdSlotProps {
  placement: AdPlacement;
  className?: string;
}

const SLOT_HEIGHT: Record<AdPlacement, number> = {
  "sidebar-left": 240,
  "sidebar-right": 240,
  bottom: 96,
  content: 128,
};

const VISIBILITY: Record<AdPlacement, string> = {
  "sidebar-left": "hidden lg:flex",
  "sidebar-right": "hidden lg:flex",
  bottom: "flex",
  content: "flex",
};

export function AdSlot({ placement, className = "" }: AdSlotProps) {
  const { t } = useI18n();
  const trackedPlacement = useRef<AdPlacement | null>(null);

  useEffect(() => {
    if (trackedPlacement.current === placement) return;
    trackedPlacement.current = placement;
    trackEvent("ad_impression", { placement });
  }, [placement]);

  const height = SLOT_HEIGHT[placement];

  return (
    <aside
      aria-label={t("adPlaceholder")}
      data-testid={`ad-${placement}`}
      className={[
        "ts-ad-slot w-full max-w-full overflow-hidden",
        VISIBILITY[placement],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ height, minHeight: height }}
    >
      <span className="ts-sr-only">{t("adPlaceholder")}</span>
    </aside>
  );
}
