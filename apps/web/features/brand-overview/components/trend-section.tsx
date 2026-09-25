import type { BrandEvent, TrendWeek } from "@/server/data/brand-overview";
import { formatShortDay } from "@/server/time";
import type { TrendSummary } from "../trend";
import { SMALL_SAMPLE, TrendChart } from "./trend-chart";

/**
 * The headline numbers, the weekly chart, what changed and when, and the same
 * data as a table for screen readers. Labels are formatted here, on the
 * server, so the client chart gets plain serialisable points.
 */
export function TrendSection({
  weeks,
  events,
  summary,
  weekCount,
}: {
  weeks: TrendWeek[];
  events: BrandEvent[];
  summary: TrendSummary;
  weekCount: number;
}) {
  const points = weeks.map((w, i) => ({
    label: formatShortDay(w.week),
    average: w.average,
    reviewCount: w.reviewCount,
    criticalCount: w.criticalCount,
    partial: i === weeks.length - 1,
  }));
  const markers = events.map((e, i) => ({ label: formatShortDay(e.week), number: i + 1 }));

  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-lg border border-line bg-surface p-4 sm:p-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold tracking-tight">Weekly average score</h2>
          <p className="text-xs text-ink-muted">
            Last {weekCount} weeks, by the week each reply was sent. This week is still in progress.
          </p>
        </div>
        <dl className="flex gap-5 font-mono tabular-nums">
          <Stat label="Average" value={summary.average === null ? "–" : summary.average.toFixed(1)} />
          <Stat label="Reviews" value={String(summary.reviewCount)} />
          <Stat label="Critical" value={String(summary.criticalCount)} tone={summary.criticalCount > 0 ? "text-bad" : undefined} />
        </dl>
      </header>

      <TrendChart points={points} markers={markers} />

      <div className="flex flex-col gap-2 text-2xs text-ink-muted sm:flex-row sm:flex-wrap sm:gap-x-5">
        <span className="flex items-center gap-2">
          <span className="inline-block size-2.5 rounded-full border-2 border-accent bg-surface" aria-hidden="true" />
          Fewer than {SMALL_SAMPLE} reviews that week
        </span>
        <span>Empty weeks had no reviews.</span>
      </div>

      {events.length > 0 ? (
        <div className="flex flex-col gap-1 border-t border-line pt-3">
          <h3 className="text-xs font-semibold">What changed</h3>
          <ol className="flex flex-col gap-1">
            {events.map((e, i) => (
              <li key={`${e.happenedOn}-${i}`} className="flex gap-2 text-sm">
                <span className="font-mono text-2xs leading-5 text-ink-muted">{i + 1}</span>
                <span className="min-w-0">
                  <span className="font-mono text-2xs text-ink-muted">{formatShortDay(e.happenedOn)} · </span>
                  {e.note}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <table className="sr-only">
        <caption>Weekly average score, last {weekCount} weeks</caption>
        <thead>
          <tr>
            <th scope="col">Week of</th>
            <th scope="col">Average</th>
            <th scope="col">Reviews</th>
            <th scope="col">Critical</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.label}>
              <th scope="row">
                {p.label}
                {p.partial ? " (so far)" : ""}
              </th>
              <td>{p.average === null ? "No reviews" : p.average.toFixed(1)}</td>
              <td>{p.reviewCount}</td>
              <td>{p.criticalCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex flex-col">
      <dt className="font-sans text-2xs text-ink-muted">{label}</dt>
      <dd className={`text-xl font-medium ${tone ?? ""}`}>{value}</dd>
    </div>
  );
}
