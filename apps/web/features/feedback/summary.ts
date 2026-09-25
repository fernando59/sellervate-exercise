import type { Membership } from "@/server/auth/session";
import type { BrandScore, IssueCount } from "@/server/data/feedback";
import type { IssueType } from "@/server/data/reviews";

const TOP_ISSUES = 3;
const SEVERITY_RANK = { critical: 0, major: 1, minor: 2 } as const;

export type RepeatedIssue = {
  issue: IssueType;
  count: number;
  lastSentAt: string;
};

export type BrandFeedback = {
  brandId: string;
  /** Null for a brand the specialist has left. */
  name: string | null;
  /** Slug for the filter links; null for a brand the specialist has left. */
  slug: string | null;
  score: BrandScore | null;
  recentScores: number[];
  topIssues: RepeatedIssue[];
};

export function hasCritical(issueCodes: string[], issuesByCode: Map<string, IssueType>): boolean {
  return issueCodes.some((code) => issuesByCode.get(code)?.severity === "critical");
}

/**
 * One card per brand the person covers as a specialist (empty until reviewed),
 * then any brand they have left but still have reviews in. The numbers come
 * from the specialist views, already limited to the person; this only arranges
 * them and picks the top issues: critical first, then the most frequent.
 */
export function arrangeBrandCards(
  memberships: Membership[],
  scores: BrandScore[],
  issueCounts: IssueCount[],
  recentScores: Map<string, number[]>,
  issueTypes: IssueType[],
): BrandFeedback[] {
  const issuesByCode = new Map(issueTypes.map((it) => [it.code, it]));
  const covered = memberships.filter((m) => m.role === "specialist");
  const known = new Map(memberships.map((m) => [m.brandId, m]));
  const brandIds = [
    ...covered.map((m) => m.brandId),
    ...scores.map((s) => s.brandId).filter((id) => !covered.some((m) => m.brandId === id)),
  ];

  return brandIds.map((brandId) => {
    const topIssues = issueCounts
      .filter((c) => c.brandId === brandId)
      .flatMap((c) => {
        const issue = issuesByCode.get(c.issueCode);
        return issue ? [{ issue, count: c.count, lastSentAt: c.lastSentAt }] : [];
      })
      .sort((a, b) => SEVERITY_RANK[a.issue.severity] - SEVERITY_RANK[b.issue.severity] || b.count - a.count)
      .slice(0, TOP_ISSUES);
    const membership = known.get(brandId);
    return {
      brandId,
      name: membership?.name ?? null,
      slug: membership?.slug ?? null,
      score: scores.find((s) => s.brandId === brandId) ?? null,
      recentScores: recentScores.get(brandId) ?? [],
      topIssues,
    };
  });
}
