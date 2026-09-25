"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { IssueType } from "@/server/data/reviews";
import { saveReview } from "../actions";
import { queueHref, type QueueParams } from "../queue-params";
import {
  COMMENT_MAX,
  CRITICAL_SCORE_CAP,
  REVIEW_FORM_LABELS as L,
  SCORES,
  reviewFormDefaults,
  reviewFormSchema,
  type ReviewFormInput,
  type ReviewFormValues,
} from "../review-form.config";
import { SEVERITY_LABEL, SEVERITY_ORDER, SEVERITY_TEXT } from "./tones";

type ReviewFormProps = {
  replyId: string;
  /** Active issue types only: a retired one cannot be added. */
  issueTypes: IssueType[];
  existing?: { score: number; comment: string; issueCodes: string[] };
  queue: QueueParams;
  prevReplyId: string | null;
  nextReplyId: string | null;
};

const SELECTED_CHIP = {
  critical: "border-bad bg-bad-soft text-bad",
  major: "border-warn bg-warn-soft text-warn",
  minor: "border-line-strong bg-sunken text-ink",
} as const;

export function ReviewForm({ replyId, issueTypes, existing, queue, prevReplyId, nextReplyId }: ReviewFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const criticalCodes = useMemo(
    () => issueTypes.filter((it) => it.severity === "critical").map((it) => it.code),
    [issueTypes],
  );
  const schema = useMemo(() => reviewFormSchema(criticalCodes), [criticalCodes]);

  const {
    control,
    register,
    handleSubmit,
    getValues,
    setValue,
    setError,
    formState: { errors, isSubmitted },
  } = useForm<ReviewFormInput, unknown, ReviewFormValues>({
    resolver: zodResolver(schema),
    defaultValues: reviewFormDefaults(replyId, existing),
  });

  // A critical issue caps the score. The buttons above the cap are disabled so
  // the rule shows while choosing, not only on save; the refine and
  // save_review still enforce it. A score already above the cap stays
  // selected and flagged: changing the lead's judgement for them is worse
  // than asking them to pick again.
  const issueCodes = useWatch({ control, name: "issueCodes" });
  const score = useWatch({ control, name: "score" });
  const capped = issueCodes?.some((code) => criticalCodes.includes(code)) ?? false;
  const overCap = capped && score !== undefined && score > CRITICAL_SCORE_CAP;

  // 1–5 set the score, J/K move through the queue. Ignored while typing.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("textarea, input[type=text], [contenteditable=true]")) return;
      const key = Number(event.key);
      if (SCORES.includes(key as (typeof SCORES)[number])) {
        const isCapped = getValues("issueCodes")?.some((code) => criticalCodes.includes(code));
        if (isCapped && key > CRITICAL_SCORE_CAP) return;
        setValue("score", key, { shouldDirty: true, shouldValidate: isSubmitted });
        return;
      }
      const letter = event.key.toLowerCase();
      const destination = letter === "j" ? nextReplyId : letter === "k" ? prevReplyId : null;
      if (destination) router.push(queueHref({ ...queue, reply: destination }));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [criticalCodes, getValues, isSubmitted, nextReplyId, prevReplyId, queue, router, setValue]);

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await saveReview(values, { brand: queue.brand ?? undefined, status: queue.status });
      if (result.ok) {
        router.push(queueHref({ ...queue, reply: result.nextReplyId }));
        return;
      }
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        setError(field as keyof ReviewFormInput, { message });
      }
      setFormError(result.message);
    });
  });

  const grouped = SEVERITY_ORDER.map((severity) => ({
    severity,
    types: issueTypes.filter((it) => it.severity === severity),
  })).filter((g) => g.types.length > 0);

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6 rounded-lg border border-line bg-surface p-4 sm:p-5">
      <input type="hidden" {...register("replyId")} />

      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className="mb-2 flex w-full items-baseline justify-between text-sm font-semibold">
          {L.score}
          <span className="hidden font-mono text-2xs font-normal text-ink-muted sm:inline">keys 1–5 · J/K</span>
        </legend>
        <Controller
          control={control}
          name="score"
          render={({ field }) => (
            <div
              role="radiogroup"
              aria-label={L.score}
              aria-describedby={capped ? "score-cap" : undefined}
              className="grid grid-cols-5 gap-2"
            >
              {SCORES.map((n) => {
                const checked = field.value === n;
                const blocked = capped && n > CRITICAL_SCORE_CAP;
                const look = checked
                  ? blocked
                    ? "border-bad bg-bad-soft text-bad"
                    : "border-accent bg-accent text-accent-ink"
                  : blocked
                    ? "border-line bg-ground text-ink-muted opacity-40"
                    : "border-line bg-ground hover:border-line-strong";
                return (
                  <label key={n} className={blocked ? "cursor-not-allowed" : "cursor-pointer"}>
                    <input
                      type="radio"
                      name={field.name}
                      value={n}
                      checked={checked}
                      disabled={blocked}
                      onChange={() => field.onChange(n)}
                      onBlur={field.onBlur}
                      className="peer sr-only"
                    />
                    <span
                      className={`flex h-12 items-center justify-center rounded-md border font-mono text-lg tabular-nums transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${look}`}
                    >
                      {n}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        />
        {capped ? (
          <p id="score-cap" role={overCap ? "alert" : undefined} className={`text-xs ${overCap ? "text-bad" : "text-ink-muted"}`}>
            A critical issue caps the score at {CRITICAL_SCORE_CAP}.{overCap ? ` Pick 1 or ${CRITICAL_SCORE_CAP}.` : ""}
          </p>
        ) : null}
        {errors.score && !overCap ? (
          <p role="alert" className="text-xs text-bad">
            {errors.score.message}
          </p>
        ) : null}
      </fieldset>

      <fieldset className="flex min-w-0 flex-col gap-3">
        <legend className="mb-2 text-sm font-semibold">{L.issues}</legend>
        <Controller
          control={control}
          name="issueCodes"
          render={({ field }) => (
            <div className="flex flex-col gap-3">
              {grouped.map(({ severity, types }) => (
                <div key={severity} className="flex flex-col gap-1.5">
                  <span className={`text-2xs font-semibold uppercase tracking-wider ${SEVERITY_TEXT[severity]}`}>
                    {SEVERITY_LABEL[severity]}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {types.map((it) => {
                      const checked = field.value?.includes(it.code) ?? false;
                      return (
                        <label key={it.code} className="max-w-full cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              field.onChange(
                                checked
                                  ? (field.value ?? []).filter((c) => c !== it.code)
                                  : [...(field.value ?? []), it.code],
                              )
                            }
                            onBlur={field.onBlur}
                            className="peer sr-only"
                          />
                          <span
                            className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${
                              checked
                                ? SELECTED_CHIP[severity]
                                : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink"
                            }`}
                          >
                            <span aria-hidden="true" className="font-mono">
                              {checked ? "✓" : "+"}
                            </span>
                            <span className="truncate">{it.label}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        />
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="review-comment" className="text-sm font-semibold">
          {L.comment} <span className="font-normal text-ink-muted">(optional)</span>
        </label>
        <textarea
          id="review-comment"
          rows={4}
          maxLength={COMMENT_MAX}
          placeholder={L.commentPlaceholder}
          aria-invalid={errors.comment ? true : undefined}
          className="w-full rounded-md border border-line bg-ground px-3 py-2 text-sm placeholder:text-ink-muted focus:border-accent"
          {...register("comment")}
        />
        {errors.comment ? (
          <p role="alert" className="text-xs text-bad">
            {errors.comment.message}
          </p>
        ) : null}
      </div>

      {formError ? (
        <p role="alert" className="rounded-md border border-bad/40 bg-bad-soft px-3 py-2 text-sm text-bad">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="self-stretch rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-60 sm:self-end"
      >
        {pending ? "Saving…" : existing ? L.update : L.save}
      </button>
    </form>
  );
}
