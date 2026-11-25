"use client";

import { DatabaseZap } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useI18n } from "@/hooks/useI18n";
import type { AdminAnalyticsSnapshot } from "@/types/analytics";
import { AdminLayout } from "./AdminLayout";
import { AnalyticsChart } from "./AnalyticsChart";
import { MetricCard } from "./MetricCard";

export function AdminDashboard({ snapshot }: { snapshot: AdminAnalyticsSnapshot }) {
  const { t } = useI18n();

  return (
    <AdminLayout>
      {!snapshot.configured ? (
        <Card className="flex flex-col items-start gap-3 p-6" data-testid="admin-unconfigured">
          <DatabaseZap className="size-7 text-primary" aria-hidden="true" />
          <p className="text-sm text-fg-secondary">{t("adminEmpty")}</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4" data-testid="admin-configured">
          {snapshot.metrics.length > 0 ? (
            <section
              aria-label={t("adminTitle")}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              data-testid="metric-grid"
            >
              {snapshot.metrics.map((metric) => (
                <MetricCard key={metric.id} metric={metric} />
              ))}
            </section>
          ) : null}
          <AnalyticsChart metrics={snapshot.metrics} events={snapshot.events} />
          <p dir="ltr" className="ts-numeric text-xs text-fg-muted" data-testid="admin-generated-at">
            {snapshot.provider ?? "—"} · {new Date(snapshot.generatedAt).toLocaleString()}
          </p>
        </div>
      )}
    </AdminLayout>
  );
}
