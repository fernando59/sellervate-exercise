import "server-only";

import { createClient } from "@/server/supabase/server";

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
