// Pure maths behind the dashboard's headline numbers: week-over-week trends and
// the day-bucketing the activity feed groups by. Kept out of the component so
// the edge cases (divide-by-zero, no prior week, midnight boundaries) are
// testable without mounting anything.
import type { UsageDay } from "@/api/client";

export interface Trend {
  dir: "up" | "down";
  label: string;
}

export const total = (
  list: UsageDay[],
  pick: (d: UsageDay) => number,
): number => list.reduce((n, d) => n + pick(d), 0);

/** Completion rate over a window, or null when nobody opened a form in it. */
export function rateOver(list: UsageDay[]): number | null {
  const views = total(list, (d) => d.views);
  return views ? (total(list, (d) => d.submissions) / views) * 100 : null;
}

// Null when there's no prior period to compare against — "+100%" measured from
// zero history is noise, not a signal. Also null for no change.
export function trendPct(cur: number, prev: number): Trend | null {
  if (!prev) return null;
  const pct = Math.round(((cur - prev) / prev) * 100);
  return pct === 0
    ? null
    : { dir: pct > 0 ? "up" : "down", label: `${pct > 0 ? "+" : ""}${pct}%` };
}

/** Same idea for rates, where the honest unit is percentage points. */
export function trendPoints(
  cur: number | null,
  prev: number | null,
): Trend | null {
  if (cur === null || prev === null) return null;
  const d = Math.round(cur - prev);
  return d === 0
    ? null
    : { dir: d > 0 ? "up" : "down", label: `${d > 0 ? "+" : ""}${d} pts` };
}

/** Calendar-day bucket (local time), not a 24h window: 1am today ≠ "yesterday". */
export function bucketOf(
  iso: string,
  now: Date = new Date(),
): "today" | "yesterday" | "earlier" {
  const midnight = (x: Date): number =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = (midnight(now) - midnight(new Date(iso))) / 86_400_000;
  return diff <= 0 ? "today" : diff < 2 ? "yesterday" : "earlier";
}
