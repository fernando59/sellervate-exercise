import "server-only";

import { getCurrentUser } from "@/server/auth/session";
import { createClient } from "@/server/supabase/server";

// Every query here filters by specialist_id = the session user. RLS alone would
// hand a lead every reply of their team, and "my" would stop being true. The id
// comes from the session, never from a parameter (TASK-005, Q1).

export const FEEDBACK_PAGE_SIZE = 20;
const RECENT_SCORES = 5;
/** PostgREST: "Requested range not satisfiable". */
const OFFSET_PAST_END = "PGRST103";

export type BrandScore = {
  brandId: string;
  average: number;
  reviewCount: number;
  criticalCount: number;
};

/** The caller's average, review count and critical count per brand. */
export async function getMyBrandScores(): Promise<BrandScore[]> {
  const { id } = await getCurrentUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("specialist_brand_scores")
    .select("brand_id, avg_score, review_count, critical_count")
    .eq("specialist_id", id);
  if (error) throw error;

  // View columns are typed nullable; the grouping keys and aggregates never are.
  return data.map((r) => ({
    brandId: r.brand_id ?? "",
    average: Number(r.avg_score),
    reviewCount: r.review_count ?? 0,
    criticalCount: r.critical_count ?? 0,
  }));
}

export type IssueCount = {
  brandId: string;
  issueCode: string;
  count: number;
  /** sent_at of the latest reply it was flagged on. */
  lastSentAt: string;
};

/** How often each issue was flagged on the caller's replies, per brand. */
export async function getMyIssueCounts(): Promise<IssueCount[]> {
  const { id } = await getCurrentUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("specialist_issue_counts")
    .select("brand_id, issue_code, flagged_count, last_sent_at")
    .eq("specialist_id", id);
  if (error) throw error;

  return data.map((r) => ({
    brandId: r.brand_id ?? "",
    issueCode: r.issue_code ?? "",
    count: r.flagged_count ?? 0,
    lastSentAt: r.last_sent_at ?? "",
  }));
}

/**
 * The caller's latest scores in one brand, oldest first so they read left to
 * right. Takes the five latest reviewed replies; with two reviews on one reply
 * both count, as they do in the average.
 */
export async function getMyRecentScores(brandId: string): Promise<number[]> {
  const { id } = await getCurrentUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("replies")
    .select("id, reviews!inner(score, updated_at)")
    .eq("specialist_id", id)
    .eq("brand_id", brandId)
    .order("sent_at", { ascending: false })
    .order("id")
    .order("updated_at", { referencedTable: "reviews", ascending: false })
    .limit(RECENT_SCORES);
  if (error) throw error;

  return data
    .flatMap((r) => r.reviews.map((rv) => rv.score))
    .slice(0, RECENT_SCORES)
    .reverse();
}

export type FeedbackReview = {
  id: string;
  reviewerName: string;
  score: number;
  comment: string;
  issueCodes: string[];
  updatedAt: string;
};

export type FeedbackItem = {
  id: string;
  ticketRef: string;
  subject: string;
  sentAt: string;
  brandId: string;
  /** Null when the caller has left the brand: RLS hides the brand row, not their replies. */
  brandName: string | null;
  reviews: FeedbackReview[];
};

export type FeedbackFilters = {
  brandId: string | null;
  issueCode: string | null;
  /** Already cleaned by parseFeedbackParams: no PostgREST syntax characters. */
  search: string | null;
  page: number;
};

export type FeedbackPage = {
  items: FeedbackItem[];
  total: number;
};

/**
 * One page of the caller's reviewed replies, newest first. The filtering and
 * the count run on the reviewed_replies view; the reviews of the page are then
 * read for those ids only.
 */
export async function listMyFeedback(filters: FeedbackFilters): Promise<FeedbackPage> {
  const { id } = await getCurrentUser();
  const supabase = await createClient();

  const matching = (head: boolean) => {
    let query = supabase
      .from("reviewed_replies")
      .select("id", { count: "exact", head })
      .eq("specialist_id", id);
    if (filters.brandId) query = query.eq("brand_id", filters.brandId);
    if (filters.issueCode) query = query.contains("issue_codes", [filters.issueCode]);
    if (filters.search) {
      const pattern = `"%${filters.search}%"`;
      query = query.or(`ticket_ref.ilike.${pattern},subject.ilike.${pattern}`);
    }
    return query;
  };

  const from = (filters.page - 1) * FEEDBACK_PAGE_SIZE;
  const { data: page, count, error } = await matching(false)
    .order("sent_at", { ascending: false })
    .order("id")
    .range(from, from + FEEDBACK_PAGE_SIZE - 1);
  if (error?.code === OFFSET_PAST_END) {
    // PostgREST refuses a range past the last row instead of returning none;
    // the page still needs the total to offer a way back.
    const { count: total, error: countError } = await matching(true);
    if (countError) throw countError;
    return { items: [], total: total ?? 0 };
  }
  if (error) throw error;

  const ids = page.flatMap((r) => (r.id ? [r.id] : []));
  if (ids.length === 0) return { items: [], total: count ?? 0 };

  const { data, error: detailError } = await supabase
    .from("replies")
    .select(
      `id, ticket_ref, subject, sent_at, brand_id,
       brand:brands(name),
       reviews!inner(id, score, comment, updated_at,
                     reviewer:profiles!reviews_reviewer_id_fkey(full_name),
                     review_issues(issue_code))`,
    )
    .eq("specialist_id", id)
    .in("id", ids)
    .order("sent_at", { ascending: false })
    .order("id")
    .order("updated_at", { referencedTable: "reviews", ascending: false });
  if (detailError) throw detailError;

  const items = data.map((r) => ({
    id: r.id,
    ticketRef: r.ticket_ref,
    subject: r.subject,
    sentAt: r.sent_at,
    brandId: r.brand_id,
    // Typed non-null, but null for a brand the caller no longer belongs to.
    brandName: r.brand?.name ?? null,
    reviews: r.reviews.map((rv) => ({
      id: rv.id,
      reviewerName: rv.reviewer?.full_name ?? "Former lead",
      score: rv.score,
      comment: rv.comment,
      issueCodes: rv.review_issues.map((ri) => ri.issue_code),
      updatedAt: rv.updated_at,
    })),
  }));
  return { items, total: count ?? 0 };
}
