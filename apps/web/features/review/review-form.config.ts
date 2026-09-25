import { z } from "zod";

/**
 * The review form's single source of truth: the client validates with it for
 * the UX and the server action parses with it again for security. save_review
 * repeats the same rules in the database.
 */

export const COMMENT_MAX = 2000;
export const SCORES = [1, 2, 3, 4, 5] as const;
export const CRITICAL_SCORE_CAP = 2;

/**
 * The critical-issue cap needs the catalog, which lives in the database, so
 * the schema is built from the codes that are critical today. It never picks
 * or suggests a score; it only refuses one that contradicts a critical issue.
 */
export function reviewFormSchema(criticalCodes: readonly string[]) {
  return z
    .object({
      replyId: z.uuid(),
      score: z
        .number({ error: "Pick a score from 1 to 5." })
        .int()
        .min(1, { error: "Pick a score from 1 to 5." })
        .max(5, { error: "Pick a score from 1 to 5." }),
      issueCodes: z.array(z.string().regex(/^[a-z_]+$/)).max(20),
      comment: z
        .string()
        .trim()
        .max(COMMENT_MAX, { error: `Keep the comment under ${COMMENT_MAX} characters.` }),
    })
    .superRefine((value, ctx) => {
      const critical = value.issueCodes.some((code) => criticalCodes.includes(code));
      if (critical && value.score > CRITICAL_SCORE_CAP) {
        ctx.addIssue({
          code: "custom",
          path: ["score"],
          message: `A critical issue caps the score at ${CRITICAL_SCORE_CAP}.`,
        });
      }
    });
}

export type ReviewFormInput = z.input<ReturnType<typeof reviewFormSchema>>;
export type ReviewFormValues = z.output<ReturnType<typeof reviewFormSchema>>;

export function reviewFormDefaults(
  replyId: string,
  existing?: { score: number; comment: string; issueCodes: string[] },
): Partial<ReviewFormInput> {
  return {
    replyId,
    score: existing?.score,
    comment: existing?.comment ?? "",
    issueCodes: existing?.issueCodes ?? [],
  };
}

export const REVIEW_FORM_LABELS = {
  score: "Score",
  issues: "What went wrong",
  comment: "Comment for the specialist",
  commentPlaceholder: "What should they do differently next time?",
  save: "Save and next",
  update: "Update and next",
} as const;

export type SaveReviewResult =
  | { ok: true; nextReplyId: string | null }
  | {
      ok: false;
      error: "unauthorized" | "not_found" | "forbidden" | "invalid";
      message: string;
      fieldErrors?: Partial<Record<"score" | "issueCodes" | "comment", string>>;
    };
