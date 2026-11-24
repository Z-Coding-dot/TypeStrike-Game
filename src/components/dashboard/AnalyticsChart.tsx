"use client";

import { BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useI18n } from "@/hooks/useI18n";
import type { AdminMetric, AnalyticsEvent } from "@/types/analytics";

interface AnalyticsChartProps {
  metrics: AdminMetric[];
  events: AnalyticsEvent[];
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString();
}

export function AnalyticsChart({ metrics, events }: AnalyticsChartProps) {
  const { t } = useI18n();
  const bars = metrics.filter((metric): metric is AdminMetric & { value: number } => typeof metric.value === "number");
  const maxValue = Math.max(1, ...bars.map((bar) => bar.value));
  const hasData = bars.length > 0 || events.length > 0;
  const chartLabel = bars.map((bar) => `${bar.label}: ${bar.value}`).join(", ");

  if (!hasData) {
    return (
      <Card className="flex flex-col items-center gap-2 p-8 text-center" data-testid="admin-empty-data">
        <BarChart3 className="size-8 text-fg-muted" aria-hidden="true" />
        <p className="text-sm text-fg-secondary">{t("adminNoData")}</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-testid="analytics-chart">
      {bars.length > 0 ? (
        <Card className="p-4 sm:p-5">
          <h2 className="mb-4 text-sm font-semibold text-fg">{t("adminDescription")}</h2>
          <div className="ts-scrollbar-thin w-full overflow-x-auto">
            <svg
              role="img"
              aria-label={chartLabel}
              width={Math.max(320, bars.length * 110)}
              height={190}
              viewBox={`0 0 ${Math.max(320, bars.length * 110)} 190`}
              className="block"
            >
              <title>{chartLabel}</title>
              <line x1="8" y1="150" x2={Math.max(320, bars.length * 110) - 8} y2="150" stroke="var(--border-medium)" />
              {bars.map((bar, index) => {
                const width = 44;
                const slot = Math.max(320, bars.length * 110) / bars.length;
                const x = index * slot + slot / 2 - width / 2;
                const height = Math.max(2, (bar.value / maxValue) * 112);
                return (
                  <g key={bar.id}>
                    <rect x={x} y={150 - height} width={width} height={height} rx={4} fill="var(--color-primary)" opacity={0.82} />
                    <text x={x + width / 2} y={144 - height} textAnchor="middle" fill="var(--text-primary)" fontSize="11">
                      {bar.value}
                    </text>
                    <text x={x + width / 2} y={168} textAnchor="middle" fill="var(--text-secondary)" fontSize="10">
                      {bar.id.length > 14 ? `${bar.id.slice(0, 13)}…` : bar.id}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <table className="ts-sr-only">
            <caption>{t("adminDescription")}</caption>
            <thead>
              <tr>
                <th scope="col">{t("adminTitle")}</th>
                <th scope="col">{t("score")}</th>
              </tr>
            </thead>
            <tbody>
              {bars.map((bar) => (
                <tr key={bar.id}>
                  <th scope="row">{bar.label}</th>
                  <td>{bar.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}

      <Card className="p-4 sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-fg">{t("latestRuns")}</h2>
        {events.length === 0 ? (
          <p className="text-sm text-fg-muted" data-testid="admin-events-empty">
            {t("adminNoData")}
          </p>
        ) : (
          <div className="ts-scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-start text-sm" data-testid="admin-events-table">
              <thead>
                <tr className="border-b border-line text-xs text-fg-muted uppercase">
                  <th scope="col" className="py-2 pe-3">{t("mode")}</th>
                  <th scope="col" className="py-2 pe-3">{t("time")}</th>
                  <th scope="col" className="py-2 pe-3">{t("score")}</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, index) => (
                  <tr key={`${event.name}-${event.timestamp}-${index}`} className="border-b border-line/60">
                    <td className="py-2 pe-3 font-medium text-fg">{event.name}</td>
                    <td className="py-2 pe-3 text-fg-secondary tabular-nums">{formatTime(event.timestamp)}</td>
                    <td className="py-2 pe-3 text-fg-secondary">
                      {Object.entries(event.properties)
                        .filter(([, value]) => value !== null)
                        .map(([key, value]) => `${key}: ${String(value)}`)
                        .join(" · ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
