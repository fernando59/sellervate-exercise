import "server-only";

import { createClient } from "@/server/supabase/server";

export type Severity = "critical" | "major" | "minor";

export type IssueType = {
  code: string;
  label: string;
  severity: Severity;
  active: boolean;
};

/** The whole issue catalog, retired types included (old reviews still show them). */
export async function listIssueTypes(): Promise<IssueType[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("issue_types")
    .select("code, label, severity, active")
    .order("sort_order");
  if (error) throw error;
  return data.map((it) => ({ ...it, severity: it.severity as Severity }));
}

export type SaveReviewInput = {
  replyId: string;
  score: number;
  comment: string;
  issueCodes: string[];
};

/** Why save_review refused, from the SQLSTATE it raised (see its migration). */
export type SaveReviewFailure = "not_found" | "forbidden" | "invalid";

export class SaveReviewError extends Error {
  constructor(
    readonly reason: SaveReviewFailure,
    message: string,
  ) {
    super(message);
    this.name = "SaveReviewError";
  }
}

const FAILURE_BY_CODE: Record<string, SaveReviewFailure> = {
  P0002: "not_found",
  "42501": "forbidden",
  "22023": "invalid",
};

/**
 * Writes the caller's review and its issues in one transaction. The function
 * derives brand_id from the reply and reviewer_id from the session, so neither
 * travels in the request.
 */
export async function saveReview(input: SaveReviewInput): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_review", {
    p_reply_id: input.replyId,
    p_score: input.score,
    p_comment: input.comment,
    p_issue_codes: input.issueCodes,
  });
  if (error) {
    const reason = FAILURE_BY_CODE[error.code];
    if (reason) throw new SaveReviewError(reason, error.message);
    throw error;
  }
  return data;
}
