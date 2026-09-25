import Link from "next/link";
import { FEEDBACK_PAGE_SIZE } from "@/server/data/feedback";
import { feedbackHref, type FeedbackParams } from "../feedback-params";

/** "21–40 of 312" with Previous / Next links that keep the filters. */
export function Pagination({ params, total }: { params: FeedbackParams; total: number }) {
  const lastPage = Math.max(1, Math.ceil(total / FEEDBACK_PAGE_SIZE));
  const first = (params.page - 1) * FEEDBACK_PAGE_SIZE + 1;
  const last = Math.min(total, params.page * FEEDBACK_PAGE_SIZE);

  return (
    <nav aria-label="Pages" className="flex items-center justify-between gap-3">
      <PageLink href={feedbackHref({ ...params, page: params.page - 1 })} disabled={params.page <= 1}>
        ← Previous
      </PageLink>
      <span className="font-mono text-xs tabular-nums text-ink-muted">
        {first}–{last} of {total}
      </span>
      <PageLink href={feedbackHref({ ...params, page: params.page + 1 })} disabled={params.page >= lastPage}>
        Next →
      </PageLink>
    </nav>
  );
}

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: string }) {
  const base = "rounded-md border px-3 py-1.5 text-xs font-medium";
  if (disabled) {
    return (
      <span aria-disabled="true" className={`${base} border-line text-ink-muted opacity-50`}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={`${base} border-line bg-surface hover:border-accent hover:text-accent`}>
      {children}
    </Link>
  );
}
