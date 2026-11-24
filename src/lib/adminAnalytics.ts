import { translate, type UiTextKey } from "@/lib/i18n";
import type { AdminAnalyticsSnapshot, AdminMetric, AnalyticsEvent } from "@/types/analytics";
import type { LanguageCode } from "@/types/language";

/**
 * Server-only snapshot helper for /admin. It never invents traffic: metrics are
 * included only when the configured analytics API actually returns a value.
 * Do not import this module from a client component.
 */

type SupportedProvider = "plausible";

interface AggregateResponse {
  results?: Record<string, number | null>;
}

interface BreakdownEntry {
  eventname?: string;
  count?: number;
  visitors?: number;
}

const KNOWN_EVENT_METRICS: Record<string, UiTextKey> = {
  game_start: "sessions",
  game_complete: "completions",
  ad_impression: "adImpressions",
  page_view: "pageViews",
};

function resolveProvider(): SupportedProvider | null {
  const provider = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER?.trim().toLowerCase();
  return provider === "plausible" ? provider : null;
}

function snapshot(
  configured: boolean,
  provider: string | null,
  language: LanguageCode,
  metrics: AdminMetric[] = [],
  events: AnalyticsEvent[] = [],
): AdminAnalyticsSnapshot {
  return { configured, provider, generatedAt: new Date().toISOString(), metrics, events };
}

async function fetchPlausible<T>(
  baseUrl: string,
  endpoint: string,
  params: Record<string, string>,
  token: string | undefined,
): Promise<T | null> {
  const url = new URL(endpoint, baseUrl);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(6_000),
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function getAdminAnalyticsSnapshot(language: LanguageCode = "en"): Promise<AdminAnalyticsSnapshot> {
  const provider = resolveProvider();
  const siteId = process.env.NEXT_PUBLIC_ANALYTICS_SITE_ID?.trim();
  if (!provider || !siteId) return snapshot(false, provider, language);

  const token = process.env.ANALYTICS_API_TOKEN?.trim() || undefined;
  const baseUrl = process.env.ANALYTICS_BASE_URL?.trim() || "https://plausible.io";
  const common = { site_id: siteId, period: "30d" };

  const [aggregate, gameStarts, completions, breakdown] = await Promise.all([
    fetchPlausible<AggregateResponse>(baseUrl, "/api/v1/stats/aggregate", {
      ...common,
      metrics: "visitors,pageviews",
    }, token),
    fetchPlausible<AggregateResponse>(baseUrl, "/api/v1/stats/aggregate", {
      ...common,
      metrics: "events",
      filters: "eventname==game_start",
    }, token),
    fetchPlausible<AggregateResponse>(baseUrl, "/api/v1/stats/aggregate", {
      ...common,
      metrics: "events",
      filters: "eventname==game_complete",
    }, token),
    fetchPlausible<BreakdownEntry[]>(baseUrl, "/api/v1/stats/breakdown", {
      ...common,
      property: "eventname",
      metrics: "events",
    }, token),
  ]);

  const toMetric = (id: UiTextKey, value: number | null, hint?: string): AdminMetric => ({
    id,
    label: translate(language, id),
    value,
    hint,
  });

  const metrics: AdminMetric[] = [];
  const results = aggregate?.results;
  const pageViews = numberOrNull(results?.pageviews);
  const visitors = numberOrNull(results?.visitors);
  if (pageViews !== null) metrics.push(toMetric("pageViews", pageViews, "30d"));
  if (visitors !== null) metrics.push(toMetric("uniqueVisitors", visitors, "30d"));

  const sessions = numberOrNull(gameStarts?.results?.events);
  const finishedGames = numberOrNull(completions?.results?.events);
  if (sessions !== null) metrics.push(toMetric("sessions", sessions, "30d"));
  if (finishedGames !== null) metrics.push(toMetric("completions", finishedGames, "30d"));

  for (const entry of breakdown ?? []) {
    const id = entry.eventname ? KNOWN_EVENT_METRICS[entry.eventname] : undefined;
    if (!id || metrics.some((metric) => metric.id === id)) continue;
    const count = numberOrNull(entry.count);
    if (count !== null) metrics.push(toMetric(id, count, "30d"));
  }

  // The aggregate API does not expose per-event timestamps or typed text.
  // Emitting synthetic entries would be fabricated data, so events stay empty.
  return snapshot(true, provider, language, metrics, []);
}
