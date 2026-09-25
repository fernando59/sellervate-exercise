import type { ReplyReview } from "@/server/data/replies";
import type { IssueType } from "@/server/data/reviews";
import { formatDate } from "@/server/time";
import { ScoreBadge } from "./score-badge";
import { SEVERITY_CHIP, SEVERITY_ORDER } from "./tones";

/** A saved review, read-only: score, issues (critical first) and comment. */
export function ReviewSummary({ review, issueTypes }: { review: ReplyReview; issueTypes: IssueType[] }) {
  const issues = review.issueCodes
    .map((code) => issueTypes.find((it) => it.code === code))
    .filter((it): it is IssueType => it !== undefined)
    .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
      <header className="flex items-center gap-3">
        <ScoreBadge score={review.score} size="lg" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold">{review.reviewerName}</span>
          <span className="font-mono text-2xs text-ink-muted">Reviewed {formatDate(review.updatedAt)}</span>
        </div>
      </header>
      {issues.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Issues">
          {issues.map((it) => (
            <li key={it.code} className={`max-w-full truncate rounded-full border px-3 py-1 text-xs ${SEVERITY_CHIP[it.severity]}`}>
              {it.label}
            </li>
          ))}
        </ul>
      ) : null}
      {review.comment ? <p className="max-w-prose whitespace-pre-line text-sm">{review.comment}</p> : null}
    </article>
  );
}
