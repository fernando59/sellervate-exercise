import { ScoreBadge } from "@/features/review/components/score-badge";
import { SEVERITY_TEXT } from "@/features/review/components/tones";
import { formatDate } from "@/server/time";
import type { BrandFeedback } from "../summary";

/** Where the specialist stands in one brand, from their own reviews only. */
export function BrandCard({ summary }: { summary: BrandFeedback }) {
  const name = summary.name ?? "Former brand";

  return (
    <article className="flex min-w-0 flex-col gap-4 rounded-lg border border-line bg-surface p-4 sm:p-5">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="truncate font-display text-lg font-bold tracking-tight">{name}</h2>
        {summary.reviewCount > 0 ? (
          <span
            className={`shrink-0 font-mono text-xs tabular-nums ${summary.criticalCount > 0 ? "text-bad" : "text-ink-muted"}`}
          >
            {summary.criticalCount} critical
          </span>
        ) : null}
      </header>

      {summary.average === null ? (
        <p className="text-sm text-ink-muted">No reviews yet. They appear here once a lead reviews one of your replies.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div className="flex flex-col">
              <span className="text-xs text-ink-muted">{summary.name ? `Your average in ${summary.name}` : "Your average"}</span>
              <span className="font-mono text-2xl font-medium tabular-nums">
                {summary.average.toFixed(1)}
                <span className="ml-2 text-xs text-ink-muted">
                  {summary.reviewCount} {summary.reviewCount === 1 ? "review" : "reviews"}
                </span>
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-ink-muted">Latest scores, oldest first</span>
              <ol className="flex gap-1" aria-label="Latest scores, oldest first">
                {summary.recentScores.map((score, i) => (
                  <li key={i}>
                    <ScoreBadge score={score} />
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-xs text-ink-muted">What gets flagged most</h3>
            {summary.topIssues.length === 0 ? (
              <p className="text-sm">Nothing flagged so far.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {summary.topIssues.map(({ issue, count, lastSentAt }) => (
                  <li
                    key={issue.code}
                    className="flex flex-col text-sm sm:flex-row sm:items-baseline sm:justify-between sm:gap-3"
                  >
                    <span className={`min-w-0 truncate ${SEVERITY_TEXT[issue.severity]}`} title={issue.label}>
                      {issue.label}
                    </span>
                    <span className="shrink-0 font-mono text-2xs tabular-nums text-ink-muted">
                      ×{count} · last {formatDate(lastSentAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </article>
  );
}
