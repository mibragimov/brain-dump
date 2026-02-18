export type AnalyticsEvent = {
  name: string;
  ts: string;
  payload?: Record<string, unknown>;
};

const STORAGE_KEY = "brain_dump_v2_analytics";

export function track(name: string, payload?: Record<string, unknown>) {
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as AnalyticsEvent[];
    const next: AnalyticsEvent = { name, ts: new Date().toISOString(), payload };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...current.slice(-999), next]));
  } catch {
    // no-op in MVP local analytics
  }
}

export function exportAnalytics(): string {
  return localStorage.getItem(STORAGE_KEY) || "[]";
}
