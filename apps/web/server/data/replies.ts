import "server-only";

import { createClient } from "@/server/supabase/server";
import type { TimeRange } from "@/server/time";

export type BrandReplySummary = {
  id: string;
  externalId: string;
  subject: string;
  specialist: { id: string; name: string };
  sentAt: string;
  score: number | null;
};

/**
 * Replies of one brand, newest first, as the caller is allowed to see them. The
 * query does not filter by author: RLS returns every reply to a lead of the
 * brand and only their own to a specialist. Message bodies are left out; this
 * is a listing (TASK-003, Q13).
 */
export async function listBrandReplies(brandId: string, viewerId: string): Promise<BrandReplySummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("replies")
    .select(
      "id, external_id, subject, sent_at, specialist_id, specialist:profiles!replies_specialist_id_fkey(full_name), reviews(score, reviewer_id, created_at)",
    )
    .eq("brand_id", brandId)
    .order("sent_at", { ascending: false })
    .order("created_at", { referencedTable: "reviews", ascending: false });
  if (error) throw error;

  return data.map((r) => ({
    id: r.id,
    externalId: r.external_id,
    subject: r.subject,
    // The generated type says non-null, but RLS decides whether the embedded
    // profile is visible. A policy gap should show up as a label, not a 500.
    specialist: { id: r.specialist_id, name: r.specialist?.full_name ?? "Former specialist" },
    sentAt: r.sent_at,
    score: scoreFor(r.reviews, viewerId),
  }));
}

/**
 * A reply can have one review per lead. A lead sees their own score; anyone
 * else (the specialist) sees the most recent one. Without this, a second lead
 * on the brand would make the listed score depend on row order.
 */
function scoreFor(reviews: { score: number; reviewer_id: string }[], viewerId: string): number | null {
  const own = reviews.find((rv) => rv.reviewer_id === viewerId);
  return (own ?? reviews[0])?.score ?? null;
}

export type QueueItem = {
  id: string;
  ticketRef: string;
  subject: string;
  brand: { id: string; slug: string; name: string };
  specialistName: string;
  sentAt: string;
  /** The caller's own score, or null while they have not reviewed it. */
  myScore: number | null;
};

/**
 * Replies sent in the range in the given brands, oldest first, with the
 * caller's own score. The caller passes only the brands they lead; RLS would
 * hide the rest anyway, but a person who leads one brand and writes in
 * another must not find their own replies in their queue.
 */
export async function listReviewQueue(
  brandIds: string[],
  viewerId: string,
  range: TimeRange,
): Promise<QueueItem[]> {
  if (brandIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("replies")
    .select(
      "id, ticket_ref, subject, sent_at, brand:brands!inner(id, slug, name), specialist:profiles!replies_specialist_id_fkey(full_name), reviews(score, reviewer_id)",
    )
    .in("brand_id", brandIds)
    .gte("sent_at", range.start)
    .lt("sent_at", range.end)
    // Filters the embedded reviews, not the replies: unreviewed replies stay.
    .eq("reviews.reviewer_id", viewerId)
    .order("sent_at")
    .order("id");
  if (error) throw error;

  return data.map((r) => ({
    id: r.id,
    ticketRef: r.ticket_ref,
    subject: r.subject,
    brand: r.brand,
    specialistName: r.specialist?.full_name ?? "Former specialist",
    sentAt: r.sent_at,
    myScore: r.reviews[0]?.score ?? null,
  }));
}

export type ReplyReview = {
  id: string;
  reviewerId: string;
  reviewerName: string;
  score: number;
  comment: string;
  issueCodes: string[];
  updatedAt: string;
};

export type ReplyDetail = {
  id: string;
  ticketRef: string;
  subject: string;
  customerMessage: string;
  replyBody: string;
  receivedAt: string;
  sentAt: string;
  specialist: { id: string; name: string };
  brand: { id: string; slug: string; name: string; keyRule: string; guidelines: string };
  reviews: ReplyReview[];
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * One reply with its brand rules and the reviews the caller may see, or null
 * when it does not exist or RLS hides it (a lead of the brand and the author
 * see it; nobody else). A malformed id is also null rather than a Postgres
 * cast error.
 */
export async function getReplyDetail(replyId: string): Promise<ReplyDetail | null> {
  if (!UUID.test(replyId)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("replies")
    .select(
      `id, ticket_ref, subject, customer_message, reply_body, received_at, sent_at, specialist_id,
       brand:brands!inner(id, slug, name, key_rule, guidelines),
       specialist:profiles!replies_specialist_id_fkey(full_name),
       reviews(id, reviewer_id, score, comment, updated_at,
               reviewer:profiles!reviews_reviewer_id_fkey(full_name),
               review_issues(issue_code))`,
    )
    .eq("id", replyId)
    .order("updated_at", { referencedTable: "reviews", ascending: false })
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    ticketRef: data.ticket_ref,
    subject: data.subject,
    customerMessage: data.customer_message,
    replyBody: data.reply_body,
    receivedAt: data.received_at,
    sentAt: data.sent_at,
    specialist: { id: data.specialist_id, name: data.specialist?.full_name ?? "Former specialist" },
    brand: {
      id: data.brand.id,
      slug: data.brand.slug,
      name: data.brand.name,
      keyRule: data.brand.key_rule,
      guidelines: data.brand.guidelines,
    },
    reviews: data.reviews.map((rv) => ({
      id: rv.id,
      reviewerId: rv.reviewer_id,
      reviewerName: rv.reviewer?.full_name ?? "Former lead",
      score: rv.score,
      comment: rv.comment,
      issueCodes: rv.review_issues.map((ri) => ri.issue_code),
      updatedAt: rv.updated_at,
    })),
  };
}

/**
 * The brand of a reply the caller can see, or null. The review action reads
 * brand_id from here, never from the request.
 */
export async function getReplyBrandId(replyId: string): Promise<string | null> {
  if (!UUID.test(replyId)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("replies").select("brand_id").eq("id", replyId).maybeSingle();
  if (error) throw error;
  return data?.brand_id ?? null;
}
