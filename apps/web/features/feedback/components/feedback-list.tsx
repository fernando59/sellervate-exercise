import Link from "next/link";
import { ScoreBadge } from "@/features/review/components/score-badge";
import { SEVERITY_CHIP, SEVERITY_ORDER } from "@/features/review/components/tones";
import type { FeedbackItem } from "@/server/data/feedback";
import type { IssueType } from "@/server/data/reviews";
import { formatDate } from "@/server/time";
import { hasCritical } from "../summary";

/** The specialist's reviewed replies, newest first; critical ones carry a red edge. */
export function FeedbackList({ items, issueTypes }: { items: FeedbackItem[]; issueTypes: IssueType[] }) {
  const issuesByCode = new Map(issueTypes.map((it) => [it.code, it]));

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const critical = item.reviews.some((rv) => hasCritical(rv.issueCodes, issuesByCode));
        return (
          <li
            key={item.id}
            className={`flex min-w-0 flex-col gap-3 rounded-lg border border-l-4 bg-surface p-4 ${critical ? "border-line border-l-bad" : "border-line"}`}
          >
            <header className="flex min-w-0 flex-col gap-1">
              <div className="flex min-w-0 items-center gap-2 font-mono text-2xs text-ink-muted">
                <span className="truncate uppercase tracking-widest">{item.brandName ?? "Former brand"}</span>
                <span aria-hidden="true">·</span>
                <span className="shrink-0">{item.ticketRef}</span>
                <span aria-hidden="true">·</span>
                <span className="shrink-0">Sent {formatDate(item.sentAt)}</span>
              </div>
              <Link href={`/replies/${item.id}`} className="truncate font-semibold hover:text-accent">
                {item.subject}
              </Link>
            </header>

            {item.reviews.map((rv) => {
              const issues = rv.issueCodes
                .map((code) => issuesByCode.get(code))
                .filter((it): it is IssueType => it !== undefined)
                .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));
              return (
                <div key={rv.id} className="flex min-w-0 gap-3">
                  <ScoreBadge score={rv.score} size="lg" />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    {issues.length > 0 ? (
                      <ul className="flex flex-wrap gap-1.5" aria-label="Issues">
                        {issues.map((it) => (
                          <li
                            key={it.code}
                            className={`max-w-full truncate rounded-full border px-3 py-1 text-xs ${SEVERITY_CHIP[it.severity]}`}
                          >
                            {it.label}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {rv.comment ? <p className="max-w-prose whitespace-pre-line text-sm">{rv.comment}</p> : null}
                    <span className="truncate text-2xs text-ink-muted">{rv.reviewerName}</span>
                  </div>
                </div>
              );
            })}
          </li>
        );
      })}
    </ul>
  );
}
