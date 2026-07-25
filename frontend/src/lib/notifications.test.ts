import { describe, it, expect } from 'vitest';
import { groupByDay, type AppNotification } from './notifications';

function at(iso: string): AppNotification {
  return { id: iso, title: 't', body: 'b', at: iso, unread: false };
}

// Buckets are calendar-day based, not "24h ago" — something at 00:30 today and
// something at 23:00 yesterday are 90 minutes apart but belong to different days.
describe('groupByDay', () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const iso = (ms: number) => new Date(ms).toISOString();

  it('splits today / yesterday / earlier by calendar day', () => {
    const groups = groupByDay([
      at(iso(startOfToday.getTime() + 3600_000)), // today, 01:00
      at(iso(startOfToday.getTime() - 3600_000)), // yesterday, 23:00
      at(iso(startOfToday.getTime() - 5 * 86400_000)), // last week
    ]);
    expect(groups.map((g) => g.label)).toEqual(['Today', 'Yesterday', 'Earlier']);
    expect(groups.every((g) => g.items.length === 1)).toBe(true);
  });

  it('omits empty buckets rather than rendering blank headings', () => {
    const groups = groupByDay([at(iso(startOfToday.getTime() + 60_000))]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.label).toBe('Today');
  });

  it('returns nothing for an empty feed', () => {
    expect(groupByDay([])).toEqual([]);
  });
});
