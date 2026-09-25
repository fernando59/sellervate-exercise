import "server-only";

import { createClient } from "@/server/supabase/server";

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

/**
 * The caller's own reviewed replies, newest first. The specialist filter is in
 * the query on purpose: RLS alone would return a lead every reply of their
 * team, and /me computes its averages from exactly these rows (TASK-005, Q1).
 */
export async function listMyFeedback(userId: string): Promise<FeedbackItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("replies")
    .select(
      `id, ticket_ref, subject, sent_at, brand_id,
       brand:brands(name),
       reviews!inner(id, score, comment, updated_at,
                     reviewer:profiles!reviews_reviewer_id_fkey(full_name),
                     review_issues(issue_code))`,
    )
    .eq("specialist_id", userId)
    .order("sent_at", { ascending: false })
    .order("id")
    .order("updated_at", { referencedTable: "reviews", ascending: false });
  if (error) throw error;

  return data.map((r) => ({
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
}
