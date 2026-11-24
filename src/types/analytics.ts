export type AnalyticsEventName =
  | "page_view"
  | "game_start"
  | "game_complete"
  | "mode_select"
  | "language_select"
  | "level_reached"
  | "session_duration"
  | "ad_impression"
  | "settings_change";

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  timestamp: string;
  properties: Record<string, string | number | boolean | null>;
}

export interface AnalyticsProvider {
  readonly name: string;
  readonly configured: boolean;
  track(event: AnalyticsEvent): void;
  page?(path: string): void;
}

export interface AdminMetric {
  id: string;
  label: string;
  value: string | number | null;
  hint?: string;
}

export interface AdminAnalyticsSnapshot {
  configured: boolean;
  provider: string | null;
  generatedAt: string;
  metrics: AdminMetric[];
  events: AnalyticsEvent[];
}
