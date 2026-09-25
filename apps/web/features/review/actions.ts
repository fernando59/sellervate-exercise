"use server";

import { revalidatePath } from "next/cache";
import { isAuthError, UnauthorizedError } from "@/server/auth/errors";
import { getCurrentUser, requireLeadOf } from "@/server/auth/session";
import { getReplyBrandId } from "@/server/data/replies";
import { listIssueTypes, saveReview as saveReviewRow, SaveReviewError } from "@/server/data/reviews";
import { parseQueueParams } from "./queue-params";
import { loadReviewQueue, nextUnreviewed } from "./queue";
import { reviewFormSchema, type SaveReviewResult } from "./review-form.config";

/**
 * Saves the caller's review of one reply and returns the next reply to open.
 *
 * Order matters: who is calling, what they sent, which brand the reply really
 * belongs to (read through RLS), whether they lead it, and only then the
 * write. brand_id is never read from the input. save_review repeats every
 * check in the database for callers that skip this action.
 */
export async function saveReview(input: unknown, queue: unknown): Promise<SaveReviewResult> {
  try {
    const user = await getCurrentUser();

    const issueTypes = await listIssueTypes();
    const critical = issueTypes.filter((it) => it.severity === "critical").map((it) => it.code);
    const parsed = reviewFormSchema(critical).safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Extract<SaveReviewResult, { ok: false }>["fieldErrors"] = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "score" || field === "issueCodes" || field === "comment") {
          fieldErrors[field] ??= issue.message;
        }
      }
      return { ok: false, error: "invalid", message: "Check the highlighted fields.", fieldErrors };
    }
    const data = parsed.data;

    const brandId = await getReplyBrandId(data.replyId);
    if (!brandId) return { ok: false, error: "not_found", message: "This reply does not exist or is not yours to see." };
    requireLeadOf(user, brandId);

    await saveReviewRow(data);

    revalidatePath("/review");
    revalidatePath("/replies/[id]", "page");

    const params = parseQueueParams(isRecord(queue) ? queue : {});
    const { items } = await loadReviewQueue(user, params);
    return { ok: true, nextReplyId: nextUnreviewed(items, data.replyId)?.id ?? null };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { ok: false, error: "unauthorized", message: error.message };
    if (isAuthError(error)) return { ok: false, error: "forbidden", message: error.message };
    if (error instanceof SaveReviewError) return { ok: false, error: error.reason, message: error.message };
    throw error;
  }
}

function isRecord(value: unknown): value is Record<string, string | undefined> {
  if (typeof value !== "object" || value === null) return false;
  return Object.values(value).every((v) => v === undefined || typeof v === "string");
}
