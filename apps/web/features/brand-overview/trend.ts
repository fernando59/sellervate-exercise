import type { TrendWeek } from "@/server/data/brand-overview";

export type TrendSummary = {
  /** Null when no week in the window has reviews. */
  average: number | null;
  reviewCount: number;
  criticalCount: number;
};

/**
 * The window's headline: every review weighs the same, so each weekly average
 * counts by its number of reviews. Weekly averages are rounded to two decimals
 * in the view; shown with one, the difference never surfaces.
 */
export function summarizeTrend(weeks: TrendWeek[]): TrendSummary {
  let reviewCount = 0;
  let criticalCount = 0;
  let total = 0;
  for (const w of weeks) {
    if (w.average === null) continue;
    reviewCount += w.reviewCount;
    criticalCount += w.criticalCount;
    total += w.average * w.reviewCount;
  }
  return { average: reviewCount > 0 ? total / reviewCount : null, reviewCount, criticalCount };
}
