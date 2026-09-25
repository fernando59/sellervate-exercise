import type { SpecialistScore } from "@/server/data/brand-overview";

/**
 * Per specialist, all time, already ordered by who needs attention first. A
 * table from sm: up; on a phone each specialist is a stacked row.
 */
export function SpecialistTable({ specialists }: { specialists: SpecialistScore[] }) {
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-line bg-surface p-4 sm:p-5">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold tracking-tight">By specialist</h2>
        <span className="shrink-0 font-mono text-2xs uppercase tracking-widest text-ink-muted">All time</span>
      </header>

      <ul className="flex flex-col divide-y divide-line sm:hidden">
        {specialists.map((s) => (
          <li key={s.specialistId} className="flex flex-col gap-1 py-2">
            <span className="truncate text-sm font-medium">{s.name}</span>
            <span className="font-mono text-2xs tabular-nums text-ink-muted">
              {s.average.toFixed(1)} avg · {s.reviewCount} {s.reviewCount === 1 ? "review" : "reviews"} ·{" "}
              <span className={s.criticalCount > 0 ? "text-bad" : undefined}>{s.criticalCount} critical</span>
            </span>
          </li>
        ))}
      </ul>

      <table className="hidden w-full table-fixed text-sm sm:table">
        <thead>
          <tr className="border-b border-line text-left text-2xs text-ink-muted">
            <th scope="col" className="py-2 font-medium">
              Specialist
            </th>
            <th scope="col" className="w-20 py-2 text-right font-medium">
              Average
            </th>
            <th scope="col" className="w-20 py-2 text-right font-medium">
              Reviews
            </th>
            <th scope="col" className="w-20 py-2 text-right font-medium">
              Critical
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {specialists.map((s) => (
            <tr key={s.specialistId}>
              <th scope="row" className="truncate py-2 text-left font-medium">
                {s.name}
              </th>
              <td className="py-2 text-right font-mono tabular-nums">{s.average.toFixed(1)}</td>
              <td className="py-2 text-right font-mono tabular-nums">{s.reviewCount}</td>
              <td className={`py-2 text-right font-mono tabular-nums ${s.criticalCount > 0 ? "text-bad" : ""}`}>
                {s.criticalCount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
