import { describe, expect, it } from "vitest";
import { bucketOf, rateOver, trendPct, trendPoints } from "@/lib/stats";

const day = (views: number, submissions: number) => ({
  day: "2026-07-01",
  views,
  submissions,
});

describe("dashboard stats", () => {
  it("rates a window, and reports null when nothing was viewed", () => {
    expect(rateOver([day(10, 5), day(10, 1)])).toBe(30);
    expect(rateOver([day(0, 0)])).toBeNull();
    expect(rateOver([])).toBeNull();
  });

  it("only reports a trend when there's a prior period and a change", () => {
    expect(trendPct(12, 10)).toEqual({ dir: "up", label: "+20%" });
    expect(trendPct(5, 10)).toEqual({ dir: "down", label: "-50%" });
    expect(trendPct(10, 10)).toBeNull();
    expect(trendPct(7, 0)).toBeNull(); // no history to compare against
  });

  it("reports rate changes in points, skipping unknown periods", () => {
    expect(trendPoints(40, 25)).toEqual({ dir: "up", label: "+15 pts" });
    expect(trendPoints(25, null)).toBeNull();
    expect(trendPoints(null, 25)).toBeNull();
  });

  it("buckets by calendar day, not by elapsed hours", () => {
    const now = new Date(2026, 6, 21, 9, 0); // 21 Jul 2026, 09:00 local
    const at = (h: number, d = 21) =>
      new Date(2026, 6, d, h, 0).toISOString();
    expect(bucketOf(at(1), now)).toBe("today"); // 8h earlier, same day
    expect(bucketOf(at(23, 20), now)).toBe("yesterday"); // 10h earlier, day before
    expect(bucketOf(at(12, 19), now)).toBe("earlier");
  });
});
