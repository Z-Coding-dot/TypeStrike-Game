"use client";

import { BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useI18n } from "@/hooks/useI18n";
import { UI_TEXT } from "@/lib/i18n";
import type { AdminMetric } from "@/types/analytics";

export function MetricCard({ metric }: { metric: AdminMetric }) {
  const { language, t } = useI18n();
  const hasTranslation = Object.prototype.hasOwnProperty.call(UI_TEXT[language], metric.id);
  const label = hasTranslation ? t(metric.id as Parameters<typeof t>[0]) : metric.label;
  const displayValue = metric.value === null || metric.value === undefined ? "—" : String(metric.value);

  return (
    <Card className="p-4" data-testid={`metric-card-${metric.id}`}>
      <dl>
        <dt className="flex min-w-0 items-center gap-2 text-xs font-semibold tracking-wide text-fg-muted uppercase [overflow-wrap:anywhere]">
          <BarChart3 className="size-3.5 text-primary" aria-hidden="true" />
          {label}
        </dt>
        <dd className="mt-2 text-2xl font-bold tabular-nums text-fg ts-glow-text">{displayValue}</dd>
      </dl>
      {metric.hint ? <p className="mt-1 text-[0.7rem] text-fg-muted">{metric.hint}</p> : null}
    </Card>
  );
}
