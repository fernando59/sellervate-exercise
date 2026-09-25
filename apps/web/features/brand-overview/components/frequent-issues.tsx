import { SEVERITY_CHIP, SEVERITY_LABEL } from "@/features/review/components/tones";
import type { BrandIssueCount } from "@/server/data/brand-overview";
import type { IssueType } from "@/server/data/reviews";
import { formatDate } from "@/server/time";

const SEVERITY_RANK = { critical: 0, major: 1, minor: 2 } as const;

/**
 * What goes wrong in the brand, all time: critical first, then the most
 * frequent. "Last" is the latest reply it was flagged on, which is what
 * answers "did it stop after we changed something?".
 */
export function FrequentIssues({ counts, issueTypes }: { counts: BrandIssueCount[]; issueTypes: IssueType[] }) {
  const byCode = new Map(issueTypes.map((it) => [it.code, it]));
  const rows = counts
    .flatMap((c) => {
      const issue = byCode.get(c.issueCode);
      return issue ? [{ ...c, issue }] : [];
    })
    .sort((a, b) => SEVERITY_RANK[a.issue.severity] - SEVERITY_RANK[b.issue.severity] || b.count - a.count);

  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-line bg-surface p-4 sm:p-5">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold tracking-tight">Frequent issues</h2>
        <span className="shrink-0 font-mono text-2xs uppercase tracking-widest text-ink-muted">All time</span>
      </header>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">Nothing flagged so far.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {rows.map(({ issue, count, lastSentAt }) => (
            <li key={issue.code} className="flex items-center gap-3 py-2">
              <span
                className={`w-16 shrink-0 rounded border px-1.5 py-0.5 text-center text-2xs font-medium ${SEVERITY_CHIP[issue.severity]}`}
              >
                {SEVERITY_LABEL[issue.severity]}
              </span>
              <span className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                <span className="min-w-0 truncate text-sm">{issue.label}</span>
                <span className="shrink-0 font-mono text-2xs tabular-nums text-ink-muted">
                  ×{count} · last {formatDate(lastSentAt)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
