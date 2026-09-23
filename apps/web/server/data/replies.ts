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
export async function listBrandReplies(brandId: string): Promise<BrandReplySummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("replies")
    .select(
      "id, external_id, subject, sent_at, specialist:profiles!replies_specialist_id_fkey(id, full_name), reviews(score)",
    )
    .eq("brand_id", brandId)
    .order("sent_at", { ascending: false });
  if (error) throw error;

  return data.map((r) => ({
    id: r.id,
    externalId: r.external_id,
    subject: r.subject,
    specialist: { id: r.specialist.id, name: r.specialist.full_name },
    sentAt: r.sent_at,
    // One lead per brand today, so at most one review per reply.
    score: r.reviews[0]?.score ?? null,
  }));
}
