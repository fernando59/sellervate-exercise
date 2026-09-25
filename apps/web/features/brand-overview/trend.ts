import type { TrendWeek } from "@/server/data/brand-overview";

export type TrendSummary = {
  /** Null when no week in the window has reviews. */
  average: number | null;
  reviewCount: number;
  criticalCount: number;
};

/**
 * The window's headline. Every review weighs the same: the sum of all scores
 * over the number of reviews, from the unrounded weekly sums, so it is exact
 * rather than an average of rounded weekly averages.
 */
export function summarizeTrend(weeks: TrendWeek[]): TrendSummary {
  let reviewCount = 0;
  let criticalCount = 0;
  let scoreSum = 0;
  for (const w of weeks) {
    reviewCount += w.reviewCount;
    criticalCount += w.criticalCount;
    scoreSum += w.scoreSum;
  }
  return { average: reviewCount > 0 ? scoreSum / reviewCount : null, reviewCount, criticalCount };
}
