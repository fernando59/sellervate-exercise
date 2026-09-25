import type { FeedbackItem } from "@/server/data/feedback";
import type { IssueType } from "@/server/data/reviews";
import type { Membership } from "@/server/auth/session";

const RECENT_SCORES = 5;
const TOP_ISSUES = 3;
const SEVERITY_RANK = { critical: 0, major: 1, minor: 2 } as const;

export type RepeatedIssue = {
  issue: IssueType;
  count: number;
  /** sent_at of the latest reply it was flagged on: when the work happened, not the review. */
  lastSentAt: string;
};

export type BrandFeedback = {
  brandId: string;
  /** Null for a brand the specialist has left. */
  name: string | null;
  reviewCount: number;
  average: number | null;
  /** Up to the last five scores, oldest first, so the row reads left to right. */
  recentScores: number[];
  criticalCount: number;
  topIssues: RepeatedIssue[];
};

export function hasCritical(issueCodes: string[], issuesByCode: Map<string, IssueType>): boolean {
  return issueCodes.some((code) => issuesByCode.get(code)?.severity === "critical");
}

/**
 * One card per brand the person covers as a specialist (with "no reviews yet"
 * when empty), then any brand they have left. Every review counts once, as it
 * will in the brand trend (TASK-005, Q2). The input must be the person's own
 * replies only; listMyFeedback guarantees it.
 */
export function summarizeByBrand(
  items: FeedbackItem[],
  memberships: Membership[],
  issueTypes: IssueType[],
): BrandFeedback[] {
  const issuesByCode = new Map(issueTypes.map((it) => [it.code, it]));
  const byBrand = new Map<string, FeedbackItem[]>();
  for (const m of memberships) {
    if (m.role === "specialist") byBrand.set(m.brandId, []);
  }
  for (const item of items) {
    byBrand.set(item.brandId, [...(byBrand.get(item.brandId) ?? []), item]);
  }

  const names = new Map(memberships.map((m) => [m.brandId, m.name]));
  return [...byBrand.entries()]
    .map(([brandId, brandItems]) => {
      const name = names.get(brandId) ?? brandItems[0]?.brandName ?? null;
      return summarizeBrand(brandId, name, brandItems, issuesByCode);
    })
    .sort((a, b) => (a.name === null ? 1 : 0) - (b.name === null ? 1 : 0));
}

function summarizeBrand(
  brandId: string,
  name: string | null,
  items: FeedbackItem[],
  issuesByCode: Map<string, IssueType>,
): BrandFeedback {
  // Items arrive newest first; reviews of one reply are also newest first.
  const reviews = items.flatMap((item) => item.reviews.map((rv) => ({ ...rv, sentAt: item.sentAt })));
  const repeated = new Map<string, RepeatedIssue>();
  for (const rv of reviews) {
    for (const code of rv.issueCodes) {
      const issue = issuesByCode.get(code);
      if (!issue) continue;
      const seen = repeated.get(code);
      if (seen) seen.count += 1;
      else repeated.set(code, { issue, count: 1, lastSentAt: rv.sentAt });
    }
  }

  const total = reviews.reduce((sum, rv) => sum + rv.score, 0);
  return {
    brandId,
    name,
    reviewCount: reviews.length,
    average: reviews.length > 0 ? Math.round((total / reviews.length) * 10) / 10 : null,
    recentScores: reviews.slice(0, RECENT_SCORES).map((rv) => rv.score).reverse(),
    criticalCount: reviews.filter((rv) => hasCritical(rv.issueCodes, issuesByCode)).length,
    topIssues: [...repeated.values()]
      .sort((a, b) => SEVERITY_RANK[a.issue.severity] - SEVERITY_RANK[b.issue.severity] || b.count - a.count)
      .slice(0, TOP_ISSUES),
  };
}
